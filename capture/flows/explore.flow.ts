// Explore flow: records what the app actually shows, so the script names UI elements exactly as on
// screen (SCRIPT_STANDARD) and shots.yaml / carrier flows get real locators.
//   npx playwright test explore                                  # app home
//   EXPLORE="Carriers;Products;Settings" npx playwright test explore   # also click these, one by one
// Each EXPLORE item is a ">"-separated click path from the app home, e.g. "Carriers>PostNord".
// A step is clicked as the first visible link/button/tab/menu item with exactly that name.
// Writes carriers/<code>/review/explore/<nn>_<slug>.png (1920 wide) + .aria.yaml (accessibility tree
// of the app iframe). Not inputs for the engine; read them to write brief.md / script.md / flows.
import fs from 'node:fs';
import path from 'node:path';
import { test, app } from './fixtures';
import type { FrameLocator, Locator } from '@playwright/test';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'home';

async function clickByName(frame: FrameLocator, name: string) {
  const roles = ['link', 'button', 'tab', 'menuitem', 'option', 'checkbox', 'radio'] as const;
  for (const role of roles) {
    const loc: Locator = frame.getByRole(role, { name, exact: true });
    const n = await loc.count();
    for (let i = 0; i < n; i++) {
      if (await loc.nth(i).isVisible().catch(() => false)) return loc.nth(i).click();
    }
  }
  const text = frame.getByText(name, { exact: true }).first();
  if (await text.isVisible().catch(() => false)) return text.click();
  throw new Error(`nothing visible named "${name}"`);
}

test('explore the app', async ({ cap }) => {
  const outDir = path.join(path.dirname(cap.env.outDir), 'review', 'explore');
  fs.mkdirSync(outDir, { recursive: true });
  const frame = app(cap.page);
  const paths = ['', ...(process.env.EXPLORE ?? '').split(';').map(s => s.trim()).filter(Boolean)];

  for (const [i, p] of paths.entries()) {
    const base = path.join(outDir, `${String(i).padStart(2, '0')}_${slug(p)}`);
    try {
      await cap.openApp();
      for (const step of p.split('>').map(s => s.trim()).filter(Boolean)) {
        await clickByName(frame, step);
        await cap.page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
        await cap.page.waitForTimeout(800);
      }
      await cap.page.screenshot({ path: `${base}.png`, scale: 'css' });
      fs.writeFileSync(`${base}.aria.yaml`, await frame.locator('body').ariaSnapshot());
      console.log(`🔎 ${path.basename(base)}  ${p || '(app home)'}`);
    } catch (e) {
      await cap.page.screenshot({ path: `${base}.FAILED.png`, scale: 'css' }).catch(() => {});
      console.log(`✗ ${p}: ${(e as Error).message.split('\n')[0]}`);
    }
  }
});
