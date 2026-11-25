// Shared capture helpers (Playwright). Flows import these; the engine reads what they write:
//   <name>.png|mp4 + <name>.<ext>.boxes.json  (docs/SHOT_SPEC.md "Box names")
import { chromium, type Browser, type BrowserContext, type CDPSession, type Locator, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type Rect = [number, number, number, number];
export type TimedRect = { rect: Rect; from?: number; to?: number };
export type Boxes = Record<string, Rect | TimedRect[]>;

export const CSS_W = 1920;
export const CSS_H = 1080;

// ── Capture browser ──────────────────────────────────────────────────────────
// Chrome's screencast records the real window, not Playwright's emulated viewport, and a headed
// window is clamped to the laptop screen. So capture runs headless in a real window forced to 2x:
// 1920x1080 CSS px = 3840x2160 device px, for stills and clips alike.
// Shopify answers headless Chrome with "Your connection needs to be verified", so capture runs headed
// by default, like the QA suite, with an emulated 1920x1080 viewport at 2x (screenshots are 3840x2160).
// CAPTURE_HEADLESS=1 = real 2x headless window (true 4K screencast) for stores that allow it.
const HEADLESS = process.env.CAPTURE_HEADLESS === '1';

export async function launchCapture(): Promise<Browser> {
  return chromium.launch({
    channel: 'chrome',
    headless: HEADLESS,
    slowMo: Number(process.env.CAPTURE_SLOWMO ?? 350), // readable pace for recorded clips
    args: HEADLESS
      ? [`--window-size=${CSS_W},${CSS_H + 100}`, '--force-device-scale-factor=2', '--hide-scrollbars']
      : ['--hide-scrollbars'],
  });
}

export async function newCapturePage(browser: Browser, storageState?: string): Promise<{ context: BrowserContext; page: Page }> {
  const view = HEADLESS ? { viewport: null } : { viewport: { width: CSS_W, height: CSS_H }, deviceScaleFactor: 2 };
  const context = await browser.newContext({ ...view, ...(storageState ? { storageState } : {}) });
  await installCursor(context);
  const page = await context.newPage();
  if (HEADLESS) await fitWindow(page);
  return { context, page };
}

/** Resize the window so the page area is exactly CSS_W x CSS_H (window decorations vary). */
export async function fitWindow(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const { windowId } = await cdp.send('Browser.getWindowForTarget');
  for (let i = 0; i < 3; i++) {
    const [iw, ih] = await page.evaluate(() => [innerWidth, innerHeight]);
    if (iw === CSS_W && ih === CSS_H) break;
    const { bounds } = await cdp.send('Browser.getWindowBounds', { windowId });
    await cdp.send('Browser.setWindowBounds', {
      windowId,
      bounds: { width: bounds.width! + CSS_W - iw, height: bounds.height! + CSS_H - ih },
    });
    await page.waitForTimeout(150);
  }
  await cdp.detach();
  const [iw, ih, dpr] = await page.evaluate(() => [innerWidth, innerHeight, devicePixelRatio]);
  if (iw !== CSS_W || ih !== CSS_H || dpr !== 2) {
    throw new Error(`capture window is ${iw}x${ih}@${dpr}x, need ${CSS_W}x${CSS_H}@2x (headed on a small screen? unset CAPTURE_HEADED)`);
  }
}

/** Bounding box of a locator in screenshot pixels (accounts for deviceScaleFactor). Works for
 *  locators inside the app iframe too: Playwright reports them in main-viewport coordinates. */
export async function boxOf(page: Page, loc: Locator): Promise<Rect> {
  const b = await loc.boundingBox();
  if (!b) throw new Error(`no bounding box for ${loc}`);
  const dpr = await page.evaluate(() => window.devicePixelRatio);
  return [b.x * dpr, b.y * dpr, b.width * dpr, b.height * dpr].map(Math.round) as Rect;
}

async function imageSize(page: Page) {
  const [w, h, dpr] = await page.evaluate(() => [innerWidth, innerHeight, devicePixelRatio]);
  return { w: Math.round(w * dpr), h: Math.round(h * dpr) };
}

function writeBoxes(file: string, image: { w: number; h: number }, boxes: Boxes) {
  fs.writeFileSync(`${file}.boxes.json`, JSON.stringify({ image, boxes }, null, 1) + '\n');
}

/** Screenshot + boxes.json in one call. Names ending in "?" are optional (skipped if not on screen). */
export async function shoot(page: Page, file: string, targets: Record<string, Locator | Rect | undefined> = {}) {
  await settle(page);
  await page.screenshot({ path: file });
  const boxes: Boxes = {};
  for (const [name, loc] of Object.entries(targets)) {
    const optional = name.endsWith('?');
    const key = name.replace(/\?$/, '');
    if (Array.isArray(loc)) { boxes[key] = loc; continue; }
    if (!loc) { if (optional) continue; throw new Error(`no box for ${key}`); }
    if (optional && !(await loc.isVisible().catch(() => false))) continue;
    boxes[key] = await boxOf(page, loc);
  }
  writeBoxes(file, await imageSize(page), boxes);
  console.log(`📸 ${path.basename(file)}  (${Object.keys(boxes).length} boxes)`);
}

/** Blur-before-capture: hide real values (fallback; demo data is preferred). */
export async function mask(page: Page, selectors: string[]) {
  await page.addStyleTag({ content: selectors.map(s => `${s}{filter:blur(8px)!important}`).join('\n') });
}

/** Box (screenshot px) of the smallest element that holds both `text` and an icon (img/svg): e.g. the
 *  app name + icon in the Shopify title bar or sidebar. Used for `patches:` that paint the production
 *  app name over a QA capture. Searches the top page only (Shopify admin chrome, not the app iframe). */
export async function labelWithIconBoxes(page: Page, text: string): Promise<Rect[]> {
  // Playwright locators pierce shadow DOM (Shopify's title bar lives in one); the walk below does too.
  const loc = page.getByText(text, { exact: true });
  const out: Rect[] = [];
  const dpr = await page.evaluate(() => devicePixelRatio);
  for (let i = 0; i < (await loc.count()); i++) {
    const h = await loc.nth(i).elementHandle();
    const r = await h?.evaluate(el => {
      const up = (e: Element): Element | null => e.parentElement ?? ((e.getRootNode() as ShadowRoot).host || null);
      const range = document.createRange();
      range.selectNodeContents(el);
      const t = range.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      const tr = { x: t.x, y: t.y, r: Math.min(t.right, box.right), b: t.bottom };
      if (tr.r - tr.x <= 0 || t.height <= 0) return null;
      let icon: DOMRect | undefined;
      for (let e: Element | null = el; e && !icon; e = up(e)) {
        const scopes: ParentNode[] = [e, ...(e.shadowRoot ? [e.shadowRoot] : [])];
        for (const s of scopes) for (const ic of Array.from(s.querySelectorAll('img,svg'))) {
          const b = ic.getBoundingClientRect();
          const midY = b.y + b.height / 2;
          if (!icon && b.width > 0 && b.right <= tr.x + 2 && tr.x - b.right < 48 && midY > tr.y - 6 && midY < tr.b + 6) icon = b;
        }
        if (e.getBoundingClientRect().width > 700) break;
      }
      const x0 = Math.min(tr.x, icon?.x ?? tr.x), y0 = Math.min(tr.y, icon?.y ?? tr.y);
      return [x0, y0, tr.r - x0, Math.max(tr.b, icon?.bottom ?? tr.b) - y0];
    });
    if (r) out.push(r.map(v => Math.round(v * dpr)) as Rect);
  }
  return out;
}

/** Hide a floating overlay (e.g. Shopify's "Work with Sidekick" bar) found by its text: the outermost
 *  positioned ancestor that is still small (under a third of the viewport) is hidden. Pierces shadow
 *  DOM. Not for data: use demo data, or mask(), for that. */
export async function hideFloating(page: Page, text: string) {
  // Shopify re-renders its overlays, so the hide re-applies itself every 300 ms (until the page reloads).
  await page.evaluate(text => {
    const w = window as unknown as Record<string, Set<string>>;
    (w.__captureHide ??= new Set()).add(text);
    if ((w as unknown as { __captureHideTimer?: number }).__captureHideTimer) return;
    const up = (e: Element): Element | null => e.parentElement ?? (((e.getRootNode() as ShadowRoot).host as Element) || null);
    const hideFor = (node: Node) => {
      let pick: HTMLElement | null = null;
      for (let e: Element | null = node.parentElement ?? null; e && e !== document.body; e = up(e)) {
        const b = e.getBoundingClientRect();
        if (b.width > innerWidth / 2 || b.height > innerHeight / 3) break;
        if (getComputedStyle(e).position !== 'static') pick = e as HTMLElement;
      }
      pick?.style.setProperty('visibility', 'hidden', 'important');
    };
    const scan = (root: Document | ShadowRoot) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.nodeType === Node.ELEMENT_NODE) { const sr = (n as Element).shadowRoot; if (sr) scan(sr); continue; }
        for (const t of w.__captureHide) if (n.textContent?.includes(t)) hideFor(n);
      }
    };
    scan(document);
    (w as unknown as { __captureHideTimer?: number }).__captureHideTimer = window.setInterval(() => scan(document), 300);
  }, text);
}

/** Wait for spinners/network to calm down so stills are not caught mid-load. */
export async function settle(page: Page, ms = 600) {
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

// ── Cursor ────────────────────────────────────────────────────────────────────
// Recordings have no OS pointer. This draws one in every frame (the app runs in a cross-origin
// iframe, so the top page never sees its mouse events). It follows Playwright's real mouse moves
// and glides between them. No click ripple (STYLE_GUIDE). Disable with CAPTURE_CURSOR=0.
export async function installCursor(context: BrowserContext) {
  if (process.env.CAPTURE_CURSOR === '0') return;
  await context.addInitScript(() => {
    const ID = '__capture_cursor__';
    const svg =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
          '<path d="M4 2 L4 22 L9.5 17 L13 25 L16.5 23.5 L13 15.8 L20.5 15.8 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      );
    const mount = () => {
      if (document.getElementById(ID) || !document.documentElement) return;
      const c = document.createElement('div');
      c.id = ID;
      c.style.cssText =
        `position:fixed;left:0;top:0;width:28px;height:28px;margin:-2px 0 0 -4px;pointer-events:none;` +
        `z-index:2147483647;background:url("${svg}") no-repeat;display:none;` +
        `transition:left .32s cubic-bezier(.3,.7,.2,1),top .32s cubic-bezier(.3,.7,.2,1);`;
      document.documentElement.appendChild(c);
    };
    const el = () => document.getElementById(ID) as HTMLDivElement | null;
    document.addEventListener('mousemove', e => {
      mount();
      const c = el();
      if (!c) return;
      // Over an <iframe>, that frame draws its own cursor.
      if ((e.target as Element)?.tagName === 'IFRAME') { c.style.display = 'none'; return; }
      c.style.display = 'block';
      c.style.left = `${e.clientX}px`;
      c.style.top = `${e.clientY}px`;
    }, true);
    document.addEventListener('mouseout', e => { if (!e.relatedTarget) { const c = el(); if (c) c.style.display = 'none'; } }, true);
  });
}

// ── Clips ─────────────────────────────────────────────────────────────────────
// Records the page with Chrome's screencast (JPEG frames at full device resolution) and encodes
// them to a constant-frame-rate H.264 mp4. Playwright's own video is VP8 at a low bitrate, not
// good enough for a 4K render.
export class Clip {
  private frames: { file: string; t: number }[] = [];
  private boxes: Record<string, TimedRect[]> = {};
  private t0 = 0;
  private stopped = false;
  private constructor(private page: Page, private cdp: CDPSession, private file: string, private tmp: string) {}

  static async start(page: Page, file: string): Promise<Clip> {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mcsl-clip-'));
    const cdp = await page.context().newCDPSession(page);
    const clip = new Clip(page, cdp, file, tmp);
    const { w, h } = await imageSize(page);
    cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
      if (clip.stopped) return;
      const t = metadata.timestamp ?? Date.now() / 1000;
      if (!clip.t0) clip.t0 = t;
      const f = path.join(tmp, `${String(clip.frames.length).padStart(6, '0')}.jpg`);
      fs.writeFileSync(f, Buffer.from(data, 'base64'));
      clip.frames.push({ file: f, t });
      await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: w, maxHeight: h, everyNthFrame: 1 });
    // The first frame only arrives once something paints; wait for it so t0 is the clip start.
    for (let i = 0; i < 50 && !clip.t0; i++) await page.waitForTimeout(100);
    if (!clip.t0) clip.t0 = Date.now() / 1000;
    console.log(`🎬 recording ${path.basename(file)}`);
    return clip;
  }

  /** Seconds since the clip started (source time in shots.yaml `video.sync` / `trim`). */
  now() {
    return Date.now() / 1000 - this.t0;
  }

  /** Record a box from now on. Recording the same name again ends the previous rect. */
  async box(name: string, loc: Locator | Rect) {
    const rect = Array.isArray(loc) ? loc : await boxOf(this.page, loc);
    const t = +this.now().toFixed(2);
    const list = (this.boxes[name] ??= []);
    const last = list[list.length - 1];
    if (last && last.to === undefined) last.to = t;
    list.push({ rect, from: t });
  }

  /** Log a moment (printed, for writing `video.sync` anchors). */
  mark(label: string) {
    console.log(`   ⏱  ${this.now().toFixed(2)}s  ${label}`);
  }

  async stop(fps = 30) {
    await this.page.waitForTimeout(500);
    this.stopped = true;
    await this.cdp.send('Page.stopScreencast').catch(() => {});
    await this.cdp.detach().catch(() => {});
    const end = Date.now() / 1000;
    if (!this.frames.length) throw new Error(`clip ${this.file}: no frames recorded`);
    // ffmpeg concat list: each frame shown until the next one arrived (screencast only sends on change).
    const list = this.frames
      .map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, (this.frames[i + 1]?.t ?? end) - f.t).toFixed(4)}`)
      .join('\n');
    const listFile = path.join(this.tmp, 'list.txt');
    // The last frame is listed twice so its duration is played out (otherwise the stream ends where
    // it starts); `-t` below then trims whatever ffmpeg adds for the repeat.
    fs.writeFileSync(listFile, `${list}\nfile '${this.frames[this.frames.length - 1].file}'\n`);
    // Source time 0 = first frame = t0, so box/mark times line up with the encoded clip.
    const duration = +(end - this.t0).toFixed(2);
    const ff = spawnSync(
      'ffmpeg',
      ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', `fps=${fps},format=yuv420p`,
        // Short GOP: Remotion seeks every frame (and sync/speed ramps jump around), so a keyframe every
        // 10 frames keeps 4K frame extraction fast; x264's default (250) made renders crawl.
        '-t', String(duration), '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-g', '10', '-keyint_min', '10',
        '-movflags', '+faststart', this.file],
      { stdio: 'inherit' },
    );
    if (ff.status !== 0) throw new Error(`ffmpeg failed for ${this.file} (is ffmpeg on PATH?)`);
    for (const list of Object.values(this.boxes)) {
      const last = list[list.length - 1];
      if (last.to === undefined) last.to = duration;
    }
    writeBoxes(this.file, await imageSize(this.page), this.boxes);
    fs.rmSync(this.tmp, { recursive: true, force: true });
    console.log(`🎬 ${path.basename(this.file)}  ${duration}s, ${this.frames.length} frames, ${Object.keys(this.boxes).length} boxes`);
  }
}
