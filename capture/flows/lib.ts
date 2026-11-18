// Shared capture helpers (Playwright). Flows import these; the engine reads what they write.
import type { Locator, Page } from '@playwright/test';
import fs from 'node:fs';

export type Boxes = Record<string, [number, number, number, number] | { rect: [number, number, number, number]; from?: number; to?: number }[]>;

/** Bounding box of a locator in screenshot pixels (accounts for deviceScaleFactor). */
export async function boxOf(page: Page, loc: Locator): Promise<[number, number, number, number]> {
  const b = await loc.boundingBox();
  if (!b) throw new Error(`no bounding box for ${loc}`);
  const dpr = await page.evaluate(() => window.devicePixelRatio);
  return [b.x * dpr, b.y * dpr, b.width * dpr, b.height * dpr].map(Math.round) as [number, number, number, number];
}

/** Screenshot + boxes.json in one call. */
export async function shoot(page: Page, file: string, targets: Record<string, Locator>) {
  await page.screenshot({ path: file });
  const dpr = await page.evaluate(() => window.devicePixelRatio);
  const vp = page.viewportSize()!;
  const boxes: Boxes = {};
  for (const [name, loc] of Object.entries(targets)) boxes[name] = await boxOf(page, loc);
  fs.writeFileSync(`${file}.boxes.json`, JSON.stringify({ image: { w: vp.width * dpr, h: vp.height * dpr }, boxes }, null, 2));
}

/** Blur-before-capture: hide real values behind demo-safe text. */
export async function mask(page: Page, selectors: string[]) {
  await page.addStyleTag({ content: selectors.map((s) => `${s}{filter:blur(8px)!important}`).join('\n') });
}
