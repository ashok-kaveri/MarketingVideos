// Capture fixtures: one signed-in browser for the whole run (like the test repo), plus helpers that
// write into the carrier's capture/ folder. Flows import { test, expect } from here.
import { test as base, chromium, expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import LoginPage from '@pages/login/loginPage';
import ShopifyOrderUploader from '@pages/shopifyAPI/createOrderAPI';
import { requireCaptureEnv, type CaptureEnv } from './env';
import { Clip, launchCapture, newCapturePage, shoot, type Rect } from './lib';

/** Session file the test repo's LoginPage reads and writes (auth-<BROWSER>.json in the working dir). */
const sessionFile = () => path.resolve(`auth-${process.env.BROWSER}.json`);

/** Headed sign-in, done by the person at the keyboard: a Chrome window opens on the store admin, they
 *  sign in as usual (email + password, passkey, Google, code), and the session is saved the moment the
 *  admin loads. Scripted password entry is what Shopify's bot check (?verify=) bounces, so it is opt-in:
 *  CAPTURE_SCRIPTED_LOGIN=1 uses the test repo's LoginPage instead. Writes sessionFile(). */
async function signInHeaded(appUrl: string, store: string) {
  const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1280,960'] });
  try {
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();
    if (process.env.CAPTURE_SCRIPTED_LOGIN === '1') {
      await new LoginPage(page).loginWithSessionIfAvailable(appUrl);
      return;
    }
    console.log('\n' + '='.repeat(72));
    console.log(`  🔐 Sign in to Shopify in the Chrome window that just opened (store: ${store}).`);
    console.log('     Use your usual login; the session is saved as soon as the admin loads.');
    console.log('='.repeat(72) + '\n');
    await page.goto(`https://admin.shopify.com/store/${store}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    // Inside the admin = on admin.shopify.com/store/<store> and still there a few seconds later.
    for (;;) {
      await page.waitForURL(new RegExp(`admin\\.shopify\\.com/store/${store}`), { timeout: 15 * 60_000 });
      await page.waitForTimeout(3000);
      if (new RegExp(`admin\\.shopify\\.com/store/${store}`).test(page.url()) && !onLoginScreen(page.url())) break;
    }
    await context.storageState({ path: sessionFile() });
    console.log(`💾 Signed in — session saved to ${path.basename(sessionFile())}`);
  } finally {
    await browser.close();
  }
}

const onLoginScreen = (url: string) => /accounts\.shopify\.com|\/auth\/login|[?&]verify=/.test(url);

export type Capture = {
  env: CaptureEnv & { carrier: string; outDir: string };
  context: BrowserContext;
  page: Page;
  /** Absolute path of a file in the output folder. */
  out(name: string): string;
  /** Screenshot + boxes, e.g. shot('05_carriers_menu.png', { 'menu.carriers': loc }). */
  shot(name: string, targets?: Record<string, Locator | Rect | undefined>): Promise<void>;
  /** Start a recording, e.g. const c = await clip('17_single_label.mp4'); ...; await c.stop(). */
  clip(name: string): Promise<Clip>;
  /** Open the app (APPURL) and wait for its iframe. */
  openApp(): Promise<void>;
};

export const test = base.extend<object, { cap: Capture; uploader: ShopifyOrderUploader }>({
  cap: [
    async ({}, use) => {
      const env = requireCaptureEnv();
      // Session: the test repo's own sign-in (its setup-chrome project writes auth-chrome.json for the
      // store in its .env) is the one Shopify accepts. A browser launched by Playwright is bounced at
      // accounts.shopify.com (?verify=) even when a person types the login, so capture does not sign in
      // itself unless CAPTURE_SIGN_IN=1.
      const testRepoSession = path.join(__dirname, '..', '.mcsl', 'auth-chrome.json');
      const usesTestRepoEnv = path.basename(env.envFile) === '.env';
      const refreshHelp =
        `Refresh the session with the test repo's sign-in, then run capture again:\n` +
        `  cd ${path.resolve(__dirname, '..', '.mcsl')} && rm -f auth-chrome.json && npx playwright test --project=setup-chrome`;
      const adoptTestRepoSession = () => {
        if (!usesTestRepoEnv || !fs.existsSync(testRepoSession) || fs.statSync(testRepoSession).size === 0) return false;
        fs.copyFileSync(testRepoSession, sessionFile());
        console.log('🔑 Using the test repo session (auth-chrome.json)');
        return true;
      };
      if (!fs.existsSync(sessionFile()) && !adoptTestRepoSession()) {
        if (process.env.CAPTURE_SIGN_IN === '1') await signInHeaded(env.appUrl, env.store);
        else throw new Error(`No Shopify session for ${env.store}. ${refreshHelp}`);
      }

      const browser = await launchCapture();
      let { context, page } = await newCapturePage(browser, sessionFile());
      const openApp = async () => {
        await page.goto(env.appUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        if (onLoginScreen(page.url())) throw new Error(`SIGNED_OUT ${page.url().split('?')[0]}`);
        await page.locator('iframe[name="app-iframe"]').waitFor({ state: 'attached', timeout: 60_000 });
        await page.frameLocator('iframe[name="app-iframe"]').locator('body *').first().waitFor({ state: 'attached', timeout: 60_000 });
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      };
      try {
        await openApp();
      } catch (e) {
        if (!String(e).includes('SIGNED_OUT')) throw e;
        // Our copy expired: retry once with the test repo's session if it is newer, else ask for a refresh.
        console.log('⚠️  Saved session was not accepted.');
        await context.close();
        const ours = fs.statSync(sessionFile()).mtimeMs;
        fs.rmSync(sessionFile(), { force: true });
        const newer = fs.existsSync(testRepoSession) && fs.statSync(testRepoSession).mtimeMs > ours;
        if (!(newer && adoptTestRepoSession())) {
          if (process.env.CAPTURE_SIGN_IN === '1') await signInHeaded(env.appUrl, env.store);
          else {
            await browser.close();
            throw new Error(`Shopify session for ${env.store} has expired. ${refreshHelp}`);
          }
        }
        ({ context, page } = await newCapturePage(browser, sessionFile()));
        try {
          await openApp();
        } catch (e2) {
          if (String(e2).includes('SIGNED_OUT')) {
            throw new Error(
              'Signed in, but Shopify sent the headless capture browser back to the login page. ' +
                'Capture needs a headless window for 4K; see capture/README.md "If Shopify refuses headless".',
            );
          }
          throw e2;
        }
      }
      const out = (name: string) => path.join(env.outDir, name);
      await use({
        env,
        context,
        page,
        out,
        openApp,
        shot: (name, targets) => shoot(page, out(name), targets),
        clip: name => Clip.start(page, out(name)),
      });
      await context.close();
      await browser.close();
    },
    { scope: 'worker' },
  ],
  uploader: [
    async ({}, use) => {
      requireCaptureEnv();
      await use(new ShopifyOrderUploader());
    },
    { scope: 'worker' },
  ],
});

export { expect };

/** The app's iframe, for locators inside the app. */
export const app = (page: Page) => page.frameLocator('iframe[name="app-iframe"]');
