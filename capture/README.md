# Capture

Playwright flows that record app screens **and** the bounding boxes the engine needs.
They reuse the QA team's [mcsl-test-automation](../../../qa_automation/mcsl-test-automation) repo
instead of duplicating it: its Shopify login (saved session, OTP by IMAP/TOTP, pauses for a CAPTCHA
or a texted code), its `ShopifyOrderUploader` (demo orders over the Admin API) and its page objects.

## One-time setup
```bash
bash capture/setup.sh
```
This links `capture/node_modules` and `capture/.mcsl` to the test repo, so Playwright and the page
objects come from one install. Default location is `../../../qa_automation/mcsl-test-automation`;
override it with `MCSL_TEST_REPO=/path`. Run `npm install` in the test repo first.

## The store
Each carrier is captured on a demo store with the **production** app
(`.../apps/multi-carrier-shipping-label`). The store is whatever the test repo's **`.env`** points at;
the user updates it by hand before a video, exactly as for a QA run (`APPURL`, `SHOPIFYURL`,
`SHOPIFY_STORE_NAME`, `USER_EMAIL`, `USER_PASSWORD`, `SHOPIFY_ACCESS_TOKEN`, `*_PRODUCTS_JSON`,
`SHIPPING_ADDRESS_JSON`, `CARRIER`, optional `OTP_IMAP_PASSWORD` / `OTP_TOTP_SECRET`).
`CAPTURE_ENV=<name>` uses `carrier-envs/<name>.env` (or a path) instead. Credentials stay in that
file; nothing in this repo copies or prints them.

Carrier folder: `VIDEO_CARRIER=<code>` (`carriers/<code>`), otherwise worked out from the env's
free-form `CARRIER` (`PostNord-UK` → `postnord`). `CARRIER` itself is left alone: page objects read it.

A QA-app `APPURL` (`/apps/mcsl-qa`) is refused. `CAPTURE_ALLOW_QA=1` allows it for pipeline tests
only, and then writes to `capture/_qa_test/<carrier>/` (git-ignored), never to the carrier folder.

## Run
```bash
cd capture
npx playwright test info       # which store / app / carrier folder (no browser, no secrets printed)
npx playwright test smoke      # check sign-in + 4K capture
npx playwright test explore    # app screens + accessibility trees -> carriers/<c>/review/explore/
EXPLORE="Carriers;Carriers>PostNord;Products" npx playwright test explore
npx playwright test postnord   # a carrier's flows
```
The whole pipeline (script → approval → capture → draft) is the `marketing-video` skill in
`.claude/skills/`: prompt "Generate marketing video using the store <URL>".
Run these in the Terminal panel, not in Claude's sandbox: the first run opens a browser window to
sign in.

1. **Session.** Capture reuses the test repo's Shopify session (`auth-chrome.json`, copied to
   `capture/auth-capture-<store>.json`). It never signs in itself: a browser launched by Playwright is
   bounced at accounts.shopify.com (`?verify=`). When the session has expired, refresh it with the test
   repo's own sign-in, run by you (it types the password from `.env`):
   `cd <test repo> && rm -f auth-chrome.json && npx playwright test --project=setup-chrome`
2. **Capture (headed).** Shopify answers headless Chrome with "Your connection needs to be verified", so
   capture runs in a visible window, like the QA suite, with an emulated 1920x1080 viewport at 2x:
   stills and clips are 3840x2160. `CAPTURE_HEADLESS=1` uses a real 2x headless window instead.

Output goes to `carriers/<code>/capture/`.

| Env | Default | |
|---|---|---|
| `CAPTURE_SLOWMO` | 350 | ms between actions, for a readable pace in clips |
| `CAPTURE_CURSOR` | 1 | `0` = no drawn cursor |
| `CAPTURE_HEADLESS` | 0 | `1` = headless 2x window (stores that allow it) |

## Writing a flow
`flows/<carrier>.flow.ts` (or a shared `flows/common/*.flow.ts`). Import `test` from `./fixtures`;
the worker-scoped `cap` fixture is the signed-in page, opened once per run.
```ts
import { test, app } from './fixtures';
import OrderSummaryPage from '@pages/orders/orderSummaryPage';

test('17 single label', async ({ cap, uploader }) => {
  const orderId = (await uploader.uploadOrder()) as string;       // demo order, no real customer
  await cap.openApp();
  await cap.shot('05_carriers_menu.png', { 'menu.carriers': app(cap.page).getByRole('link', { name: 'Carriers' }) });

  const clip = await cap.clip('17_single_label.mp4');
  await clip.box('order.generate', app(cap.page).getByRole('button', { name: 'Generate Label' }));
  clip.mark('click Generate Label');                               // prints the source second, for video.sync
  await new OrderSummaryPage(cap.page).clickGenerateLabel();
  await clip.stop();
});
```
- `cap.shot(name, targets)`: screenshot + `<name>.boxes.json`. A target name ending in `?` is optional.
- `cap.clip(name)` → `clip.box(name, locator)` (time-bound box from now on), `clip.mark(label)`,
  `clip.stop()`. Clips are H.264 mp4, 30 fps, from Chrome's screencast (JPEG q95 frames at 4K).
- Box names are the ones used in `carriers/<code>/shots.yaml`. Never hand-type coordinates for app
  screens. Locators inside the app go through `app(page)` (the `app-iframe`).
- Reuse the test repo's page objects (`@pages/...`) for navigation. A screen they do not cover gets a
  new page object **in the test repo**, so QA can use it too.
- Demo data only (fixtures/, the uploader's demo products and addresses). `mask()` is the fallback.
- Carrier-hosted login/registration pages: record by hand (QuickTime, 4K), add boxes by hand.

## Output contract
For every `carriers/<code>/capture/<name>.png|mp4` there is `<name>.<ext>.boxes.json`:
```json
{ "image": { "w": 3840, "h": 2160 },
  "boxes": { "menu.address": [x, y, w, h],
             "order.generate": [{ "rect": [x, y, w, h], "from": 3.2, "to": 9.0 }] } }
```

## Drafts from 4K clips
Remotion extracts every frame of a 4K clip, which makes 1080p drafts crawl. For a draft, keep the 4K file as
`<name>.4k.mp4` and put a 1080p copy at `<name>.mp4`; boxes and patches stay right (the engine uses the
size in `boxes.json` as the coordinate space). Swap the 4K files back before `npm run final`.

## Status
Tested end to end on the QA store (carriers/ups-sample, 2026-11-25): session reuse, demo orders, 4K stills
and clips with timed boxes, QA-name patches, Kokoro voice, draft render, QA gate. Not yet run on a
production-app store.
