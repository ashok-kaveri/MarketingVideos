// Smoke flow: proves the bridge to the test repo works end to end on a store, before real flows.
//   npx playwright test smoke
// Writes 00_smoke_app_home.png (+ boxes) and 00_smoke_clip.mp4 (+ timed boxes). Delete them after.
import { test, expect, app } from './fixtures';
import { CSS_H, CSS_W } from './lib';

test('sign in, open the app, take a still and a short clip', async ({ cap }) => {
  console.log(`store ${cap.env.store} → ${cap.env.outDir}${cap.env.qa ? '  (QA app: pipeline test only)' : ''}`);
  await cap.openApp();
  const frame = app(cap.page);
  await expect(frame.locator('body *').first()).toBeAttached();

  // Still: the app home, with the iframe itself as a box (proves box coordinates in 4K pixels).
  await cap.shot('00_smoke_app_home.png', { 'app.frame': cap.page.locator('iframe[name="app-iframe"]') });

  // Clip: move over the page and reload it, so the cursor, screencast and encoder are all exercised.
  const clip = await cap.clip('00_smoke_clip.mp4');
  await clip.box('app.frame', cap.page.locator('iframe[name="app-iframe"]'));
  const vp = { width: CSS_W, height: CSS_H };
  await cap.page.mouse.move(vp.width * 0.3, vp.height * 0.4);
  await cap.page.mouse.move(vp.width * 0.6, vp.height * 0.5);
  clip.mark('reload');
  await cap.openApp();
  await cap.page.mouse.move(vp.width * 0.45, vp.height * 0.3);
  await clip.stop();
});
