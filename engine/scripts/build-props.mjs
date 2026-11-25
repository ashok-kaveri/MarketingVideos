#!/usr/bin/env node
// carriers/<code>/{carrier.yaml, script.md, shots.yaml, capture/, audio/}  ->  engine/src/generated/<code>.json
// Usage: npm run props -- <code> [--placeholders]
//   --placeholders  missing capture files / boxes become grey placeholder frames instead of errors
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const FPS = 30;
const WORDS_PER_SEC = 2.6;   // estimate until TTS timings exist
const LEAD = 0.3;            // VO starts this long after the scene cut
const HOLD = 0.6;            // default pause after VO
const Z = 18;                // zoom frames (theme.motion.zoomFrames)
const CHAPTER_CARD = 66;
const SILENT = { hook: 6, statement: 1.8, callout: 3, recap: 3, app_card: 4, support_card: 4, title: 5 };

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(ENGINE, '..');
const args = process.argv.slice(2);
const code = args.find((a) => !a.startsWith('--'));
const PLACEHOLDERS = args.includes('--placeholders');
if (!code) { console.error('usage: npm run props -- <carrier> [--placeholders]'); process.exit(2); }

const CDIR = path.join(ROOT, 'carriers', code);
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const sec = (s) => Math.round(s * FPS);

// ── inputs ────────────────────────────────────────────────────────────
const carrierY = YAML.parse(fs.readFileSync(path.join(CDIR, 'carrier.yaml'), 'utf8'));
const shots = YAML.parse(fs.readFileSync(path.join(CDIR, 'shots.yaml'), 'utf8')).scenes;
const script = parseScript(fs.readFileSync(path.join(CDIR, 'script.md'), 'utf8'));

function parseScript(md) {
  const out = {};
  let cur = null;
  for (const line of md.split('\n')) {
    const m = line.match(/^##\s+([\w-]+)\s*(\(silent\))?\s*$/);
    if (m) { cur = m[1]; out[cur] = { text: '', silent: !!m[2] }; continue; }
    if (cur && line.trim()) out[cur].text += (out[cur].text ? ' ' : '') + line.trim();
  }
  return out;
}

// script <-> shots consistency
const shotIds = new Set(shots.map((s) => s.id));
for (const s of shots) if (!script[s.id]) err(`scene "${s.id}" has no "## ${s.id}" section in script.md`);
for (const id of Object.keys(script)) if (!shotIds.has(id)) err(`script.md section "${id}" is not used in shots.yaml`);
const dup = shots.map((s) => s.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dup.length) err(`duplicate scene ids: ${dup.join(', ')}`);

// ── public/ links so Remotion can serve the files ─────────────────────
const pub = path.join(ENGINE, 'public');
fs.mkdirSync(path.join(pub, 'carriers'), { recursive: true });
// (re)link: a project that was moved or copied leaves links pointing at the old location
const link = (target, at) => {
  try { if (fs.readlinkSync(at) === target) return; fs.unlinkSync(at); } catch { /* missing */ }
  fs.symlinkSync(target, at);
};
link(path.join(ROOT, 'brand'), path.join(pub, 'brand'));
link(CDIR, path.join(pub, 'carriers', code));

const asset = (rel) => (fs.existsSync(path.join(ROOT, rel)) ? rel : undefined);
const assets = {
  pluginhiveLogo: asset('brand/logos/pluginhive.png'),
  shopifyLogo: asset('brand/logos/shopify.png'),
  shopifyBag: asset('brand/icons/shopify_bag.png'),
  appIcon: asset('brand/icons/ph_app_icon.png'),
  music: asset('brand/music/bed.mp3'),
};

// ── media ─────────────────────────────────────────────────────────────
function probe(file) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file]).toString());
  return { w: j.streams[0].width, h: j.streams[0].height, duration: parseFloat(j.format?.duration ?? '0') };
}

function placeholder(name) {
  const dir = path.join(pub, 'placeholders');
  fs.mkdirSync(dir, { recursive: true });
  const safe = name.replace(/[^\w.-]+/g, '_') + '.png';
  const out = path.join(dir, safe);
  if (!fs.existsSync(out)) {
    const label = `MISSING CAPTURE  ${name}`.replace(/[:'\\]/g, ' ');
    try {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0xe9edf2:s=1920x1080', '-frames:v', '1',
        '-vf', `drawtext=text='${label}':fontcolor=0x5a6b85:fontsize=44:x=(w-text_w)/2:y=(h-text_h)/2`, out], { stdio: 'ignore' });
    } catch {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0xe9edf2:s=1920x1080', '-frames:v', '1', out], { stdio: 'ignore' });
    }
  }
  return { src: `placeholders/${safe}`, kind: 'image', w: 1920, h: 1080, placeholder: true };
}

const SLOW_MIN = 0.75; // sync never slows a clip below this; the rest of the gap is a freeze

/** videoSpec.sync: [{ src: <source sec>, on: "<narration phrase>" }] — the source moment lands on the spoken word.
 *  Between anchors the clip is sped up (or slowed to SLOW_MIN, then frozen) to fit; after the last anchor `speed` applies. */
function loadMedia(source, videoSpec, at) {
  const file = path.join(CDIR, 'capture', source);
  if (!fs.existsSync(file)) {
    (PLACEHOLDERS ? warn : err)(`missing capture: carriers/${code}/capture/${source}`);
    return { media: placeholder(source), map: () => 0 };
  }
  const p = probe(file);
  const isVideo = /\.(mov|mp4|m4v|webm)$/i.test(source);
  // Coordinate space = the capture's declared size (boxes.json "image"), so boxes, inline rects and patch
  // sizes stay in capture pixels even when the file is a smaller proxy of the same clip (fast drafts).
  const declared = (() => {
    try { return JSON.parse(fs.readFileSync(`${file}.boxes.json`, 'utf8')).image; } catch { return null; }
  })();
  const sameShape = declared?.w && declared?.h && Math.abs(declared.w / declared.h - p.w / p.h) < 0.01;
  const media = { src: `carriers/${code}/capture/${source}`, kind: isVideo ? 'video' : 'image', w: sameShape ? declared.w : p.w, h: sameShape ? declared.h : p.h };
  if (!isVideo) return { media, map: () => 0 };

  // trim -> minus cuts -> split by speed ranges
  const [a, bRaw] = videoSpec?.trim ?? [0, null];
  const b = bRaw ?? p.duration;
  let parts = [[a, b]];
  for (const [cf, ct] of videoSpec?.cut ?? []) {
    parts = parts.flatMap(([f, t]) => (ct <= f || cf >= t ? [[f, t]] : [[f, cf], [ct, t]].filter(([x, y]) => y - x > 0.01)));
  }
  const speeds = videoSpec?.speed ?? [];
  const clip = (f, t) => parts.map(([x, y]) => [Math.max(x, f), Math.min(y, t)]).filter(([x, y]) => y - x > 0.001);
  const contentLen = (f, t) => clip(f, t).reduce((n, [x, y]) => n + y - x, 0);
  const playRange = (f, t, rate) => clip(f, t).flatMap(([pf, pt]) => {
    if (rate !== undefined) return [{ srcFrom: pf, srcTo: pt, rate }];
    const cuts = [pf, pt, ...speeds.flatMap((s) => [s.from, s.to]).filter((x) => x > pf && x < pt)].sort((x, y) => x - y);
    return cuts.slice(0, -1).map((c, i) => {
      const mid = (c + cuts[i + 1]) / 2;
      return { srcFrom: c, srcTo: cuts[i + 1], rate: speeds.find((s) => mid >= s.from && mid < s.to)?.rate ?? 1 };
    });
  });
  const pieces = [];
  let prev = { src: a, out: 0 };
  const anchors = (videoSpec?.sync ?? []).map((s) => ({ src: s.src, out: at(s.on) })).sort((x, y) => x.src - y.src);
  for (const q of anchors) {
    const D = contentLen(prev.src, q.src);
    const T = q.out - prev.out;
    if (q.src <= prev.src || T <= 0.05) { err(`${source}: sync anchor at ${q.src}s lands before the previous one — check src/on order`); continue; }
    const rate = D / T;
    if (rate < 1) {
      const r = Math.max(rate, SLOW_MIN);
      const hold = T - D / r;
      if (hold > 0.02) pieces.push({ srcFrom: prev.src, srcTo: prev.src, rate: 1, freeze: true, hold });
      pieces.push(...playRange(prev.src, q.src, r));
    } else {
      if (rate > 12) warn(`${source}: sync runs ${rate.toFixed(1)}x between ${prev.src}s and ${q.src}s`);
      pieces.push(...playRange(prev.src, q.src, rate));
    }
    prev = q;
  }
  pieces.push(...playRange(prev.src, b));
  let out = 0;
  media.segments = pieces.map((s) => {
    const len = Math.max(1, Math.round((s.freeze ? s.hold : (s.srcTo - s.srcFrom) / s.rate) * FPS));
    const { hold, ...rest } = s;
    const seg = { ...rest, outFrom: out, outTo: out + len };
    out += len;
    return seg;
  });
  media.videoFrames = out;
  // source seconds -> output frame; end=true gives the last frame showing t (a freeze shows it for its whole length)
  const map = (t, end = false) => {
    const hits = media.segments.filter((s) => t >= s.srcFrom && t <= s.srcTo);
    if (!hits.length) return t < a ? 0 : out;
    const s = end ? hits[hits.length - 1] : hits[0];
    if (s.freeze) return end ? s.outTo : s.outFrom;
    return s.outFrom + Math.round(((t - s.srcFrom) / s.rate) * FPS);
  };
  return { media, map };
}

function loadBoxes(source, media) {
  const f = path.join(CDIR, 'capture', `${source}.boxes.json`);
  if (!fs.existsSync(f)) return null;
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const k = j.image?.w ? media.w / j.image.w : 1;
  const scale = (r) => r.map((v) => v * k);
  const out = {};
  for (const [name, v] of Object.entries(j.boxes ?? {})) {
    const list = Array.isArray(v) && typeof v[0] === 'number' ? [{ rect: v }] : Array.isArray(v) ? v : [v];
    out[name] = list.map((e) => ({ rect: scale(e.rect), from: e.from, to: e.to }));
  }
  return out;
}

// ── narration timing ──────────────────────────────────────────────────
// A section that ends mid-sentence runs straight into the next scene: no hold after it, no lead-in on the next.
// (tools/tts.py speaks such sections as one take and splits it between the words.)
const endsSentence = (t) => /[.!?]["”’)]*$/.test(t.trim());
const spokenIds = Object.keys(script).filter((id) => !script[id].silent && script[id].text);
const continues = new Set(spokenIds.filter((id) => !endsSentence(script[id].text)));
const continued = new Set(spokenIds.filter((id, i) => i > 0 && continues.has(spokenIds[i - 1])));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
function narration(id) {
  const s = script[id] ?? { text: '', silent: true };
  const lead = continued.has(id) ? 0 : LEAD;
  const tj = path.join(CDIR, 'audio', `${id}.timings.json`);
  const audioFile = ['mp3', 'wav', 'm4a'].map((e) => path.join(CDIR, 'audio', `${id}.${e}`)).find((f) => fs.existsSync(f));
  let words;
  if (fs.existsSync(tj)) {
    words = JSON.parse(fs.readFileSync(tj, 'utf8')).map((w) => ({ w: norm(w.word), start: w.start + lead, end: w.end + lead }));
  } else {
    const toks = s.text.split(/\s+/).filter(Boolean);
    words = toks.map((t, i) => ({ w: norm(t), start: lead + i / WORDS_PER_SEC, end: lead + (i + 1) / WORDS_PER_SEC }));
  }
  words = words.filter((w) => w.w);
  const voEnd = words.length ? words[words.length - 1].end : 0;
  const audio = audioFile ? `carriers/${code}/audio/${path.basename(audioFile)}` : undefined;
  const at = (phrase, sceneId) => {
    const p = phrase.split(/\s+/).map(norm).filter(Boolean);
    for (let i = 0; i + p.length <= words.length; i++) if (p.every((w, j) => words[i + j].w === w)) return words[i].start;
    err(`${sceneId}: phrase "${phrase}" not found in narration`);
    return lead;
  };
  return { text: s.text, silent: s.silent || !s.text, voEnd, audio, at, lead };
}

// ── block (media + zooms + highlights + blurs) ────────────────────────
function buildBlock(spec, sceneId, nar, sceneFramesFn) {
  const { media, map } = loadMedia(spec.source, spec.video, (p) => nar.at(p, sceneId));
  const boxes = loadBoxes(spec.source, media);
  const resolve = (t) => {
    if (Array.isArray(t) && typeof t[0] === 'number') return [{ rect: t }];
    const optional = typeof t === 'string' && t.endsWith('?');
    const name = optional ? t.slice(0, -1) : t;
    const hit = boxes?.[name];
    if (!hit) {
      if (!optional) (PLACEHOLDERS || media.placeholder ? warn : err)(`${sceneId}: box "${name}" not in ${spec.source}.boxes.json`);
      return [];
    }
    return hit.map((h) => ({ rect: h.rect, from: h.from !== undefined ? map(h.from) : undefined, to: h.to !== undefined ? map(h.to, true) : undefined }));
  };
  const total = sceneFramesFn(media);
  const frameOf = (phrase) => sec(nar.at(phrase, sceneId));

  // zooms
  const zSpecs = spec.zoom === undefined ? [] : Array.isArray(spec.zoom) && typeof spec.zoom[0] !== 'number' ? spec.zoom : [spec.zoom];
  const zNorm = zSpecs.map((z) => (typeof z === 'string' || typeof z[0] === 'number' ? { target: z } : z));
  const zooms = [];
  zNorm.forEach((z, i) => {
    const r = resolve(z.target)[0];
    if (!r) return;
    const from = z.on ? frameOf(z.on) : i === 0 ? sec(0.4) : null;
    if (from === null) { err(`${sceneId}: zoom #${i + 1} needs "on:" (only the first zoom may omit it)`); return; }
    zooms.push({ rect: r.rect, from, toSpec: z.until });
  });
  zooms.forEach((z, i) => {
    z.to = z.toSpec ? frameOf(z.toSpec) + Z : i < zooms.length - 1 ? zooms[i + 1].from : total;
    z.to = Math.min(z.to, total);
    delete z.toSpec;
  });

  // highlights (rule: only while a zoom holds)
  const highlights = [];
  for (const h of spec.highlights ?? []) {
    for (const r of resolve(h.target)) {
      let from = h.on ? frameOf(h.on) : r.from ?? sec(0.4);
      let to = h.until && h.until !== 'scene_end' ? frameOf(h.until) : r.to ?? total;
      const z = zooms.find((zz) => from >= zz.from - Z && from < zz.to);
      if (z) {
        const chained = zooms.some((n) => n !== z && n.from <= z.to && n.from >= z.from + 1);
        from = Math.max(from, z.from + Z + 2);
        to = Math.min(to, chained ? z.to : z.to - Z);
      }
      if (to - from < 6) { warn(`${sceneId}: highlight "${h.target}" squeezed to nothing by zoom timing — check on/until`); continue; }
      highlights.push({ rect: r.rect, from, to });
    }
  }

  // patches: opaque covers with optional text/icon, e.g. app name in the title bar
  const patches = (spec.patches ?? []).flatMap((p) => resolve(p.target).map((r) => ({
    rect: r.rect, from: r.from ?? 0, to: r.to ?? total,
    bg: p.bg ?? '#ffffff', text: p.text, color: p.color ?? '#303030', size: p.size, weight: p.weight ?? 500, padX: p.pad_x, align: p.align,
    icon: p.icon ? assets.appIcon : undefined,
  })));
  if ((spec.patches ?? []).some((p) => p.icon) && !assets.appIcon) warn(`${sceneId}: patch wants icon but brand/icons/ph_app_icon.png is missing`);

  const blurs = (spec.blur ?? []).flatMap((t) => resolve(t).map((r) => ({ rect: r.rect, from: r.from ?? 0, to: r.to ?? total })));
  return { media, caption: spec.caption, zooms, highlights, blurs, patches };
}

// ── scenes ────────────────────────────────────────────────────────────
const scenes = [];
let cursor = 0;
let lastChapter = 0;
const byId = {};

for (const s of shots) {
  if (s.chapter && s.chapter !== lastChapter) {
    scenes.push({ id: `chapter-${s.chapter}`, type: 'chapter', chapter: s.chapter, from: cursor, duration: CHAPTER_CARD });
    cursor += CHAPTER_CARD;
    lastChapter = s.chapter;
  }
  const nar = narration(s.id);
  const hold = s.hold ?? (continues.has(s.id) ? 0 : HOLD);
  const voFrames = nar.silent ? 0 : sec(nar.voEnd + hold);
  const base = Math.max(voFrames, sec(SILENT[s.type] ?? 0), sec(1.5));
  const sceneFrames = (media) => Math.max(base, media?.videoFrames ?? 0);

  const scene = { id: s.id, type: s.type, chapter: s.chapter, shopifyLogo: !!s.shopify_logo, audio: nar.audio, audioFrom: sec(nar.lead), text: s.text, kind: s.kind, from: cursor };
  if (s.type === 'screen') {
    if (!s.source) err(`${s.id}: screen scene needs "source"`);
    else scene.block = buildBlock(s, s.id, nar, sceneFrames);
    scene.duration = sceneFrames(scene.block?.media);
  } else if (s.type === 'split') {
    scene.left = buildBlock(s.left, `${s.id}.left`, nar, sceneFrames);
    scene.right = buildBlock(s.right, `${s.id}.right`, nar, sceneFrames);
    scene.duration = Math.max(sceneFrames(scene.left.media), sceneFrames(scene.right.media));
  } else if (s.type === 'callout') {
    const over = s.over ? byId[s.over] : null;
    if (s.over && !over) err(`${s.id}: over "${s.over}" must be an earlier scene`);
    if (over?.block) {
      const m = { ...over.block.media };
      if (m.kind === 'video' && m.segments?.length) {
        const last = m.segments[m.segments.length - 1];
        m.segments = [{ srcFrom: last.srcTo - last.rate / FPS, srcTo: last.srcTo, rate: last.rate, outFrom: 0, outTo: 1 }];
        m.videoFrames = 1;
      }
      scene.block = { media: m, zooms: [], highlights: [], blurs: over.block.blurs.map((b) => ({ ...b, from: 0, to: 1e9 })), patches: (over.block.patches ?? []).map((p) => ({ ...p, from: 0, to: 1e9 })) };
    }
    scene.duration = base;
  } else {
    scene.duration = base;
  }
  scenes.push(scene);
  byId[s.id] = scene;
  cursor += scene.duration;
}

const carrier = {
  code, name: carrierY.name, chapters: carrierY.chapters, hookBubbles: carrierY.hook_bubbles ?? [],
  titleChips: carrierY.title_chips ?? [], recapLine: carrierY.recap_line ?? `Your ${carrierY.name} shipping, automated.`,
  appCard: { developer: 'PluginHive', ...carrierY.app_card }, supportUrl: carrierY.support_url,
};

for (const w of warnings) console.warn(`warn  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`\n${errors.length} error(s). Fix them, or pass --placeholders for a layout preview.`);
  process.exit(1);
}

const genDir = path.join(ENGINE, 'src', 'generated');
fs.writeFileSync(path.join(genDir, `${code}.json`), JSON.stringify({ carrier, scenes, totalFrames: cursor, assets }, null, 1));
const all = fs.readdirSync(genDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
fs.writeFileSync(path.join(genDir, 'index.ts'),
  `// Generated by scripts/build-props.mjs — do not edit\n${all.map((c, i) => `import c${i} from './${c}.json';`).join('\n')}\nexport const generated: Record<string, unknown> = { ${all.map((c, i) => `'${c}': c${i}`).join(', ')} };\n`);

const mmss = (f) => `${Math.floor(f / FPS / 60)}:${String(Math.round((f / FPS) % 60)).padStart(2, '0')}`;
console.log(`ok  ${code}: ${scenes.length} scenes, ${mmss(cursor)} (${cursor} frames), ${warnings.length} warning(s)`);
