// Shared capture steps: the "labels + fulfil + track" tour every carrier video has, on demo orders.
// A carrier flow calls labelsTour() to register these tests; files written (into carriers/<c>/capture/):
//   10_single_label.mp4    open an order -> Generate Label -> Label Summary
//   20_bulk_labels.mp4     select 2 orders -> Generate labels -> Label Batch SUCCESS
//   30_fulfil.mp4          Label Batch -> Mark as Fulfilled
//   40_tracking_dashboard.png
// Boxes: order.generate, label.summary, bulk.generate, batch.fulfil, tracking.header, and on a QA store
// qa.title / qa.sidebar (QA app name + icon, painted over by shots.yaml `patches`).
// Navigation is the test repo's page objects; demo orders come from its uploader (no real customers).
import type { Page } from '@playwright/test';
import OrderGridPage from '@pages/orders/orderGridPage';
import OrderSummaryPage from '@pages/orders/orderSummaryPage';
import LabelBatchPage from '@pages/labelBatch/labelBatchPage';
import TrackingPage from '@pages/orders/trackingPage';
import { test, app } from '../fixtures';
import { labelWithIconBoxes, type Clip, type Rect } from '../lib';

const QA_NAME = 'QA-MultiCarrier Shipping Label';

/** QA app name + icon in the Shopify title bar and sidebar, for the engine's `patches` (QA store only). */
export async function qaBoxes(page: Page): Promise<{ 'qa.title?': Rect | undefined; 'qa.sidebar?': Rect | undefined }> {
  const found = await labelWithIconBoxes(page, QA_NAME);
  const dpr = await page.evaluate(() => devicePixelRatio);
  // Shopify's sidebar is ~240 CSS px wide; the title bar starts right of it.
  return {
    'qa.title?': found.find(r => r[0] > 240 * dpr && r[1] < 60 * dpr),
    'qa.sidebar?': found.find(r => r[0] <= 240 * dpr),
  };
}

/** Page clean-up before a capture. Shopify's "Work with Sidekick" bar is NOT hidden: marketing asked for
 *  that once and then reversed it (docs/REVIEW_LESSONS.md #12, #35). Browser chrome (tabs, bookmarks bar)
 *  never appears: capture records the page only (#10, #32). */
export async function tidy(_page: Page) {
  // nothing to hide by default; use hideFloating(page, text) for a one-off overlay a reviewer flags
}

export async function startClip(cap: { page: Page; clip(n: string): Promise<Clip> }, name: string) {
  await tidy(cap.page);
  const clip = await cap.clip(name);
  for (const [k, r] of Object.entries(await qaBoxes(cap.page))) if (r) await clip.box(k.replace('?', ''), r);
  return clip;
}

export type TourOptions = {
  /** Uploader address type for the demo orders ("default" = the env's SHIPPING_ADDRESS_JSON). */
  address?: 'default' | 'domestic' | 'international';
};

export function labelsTour(opts: TourOptions = {}) {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(6 * 60_000);
  let single = '';
  let bulk: string[] = [];
  const address = opts.address ?? 'default';

  test('demo orders', async ({ uploader }) => {
    single = (await uploader.uploadOrder(null, [], address)) as string;
    bulk = [(await uploader.uploadOrder(null, [], address)) as string, (await uploader.uploadOrder(null, [], address)) as string];
    console.log(`demo orders: single ${single}, bulk ${bulk.join(', ')}`);
  });

  test('10 single label', async ({ cap }) => {
    const grid = new OrderGridPage(cap.page);
    const summary = new OrderSummaryPage(cap.page);
    const frame = app(cap.page);
    await grid.navigateToAppAndFilterOrder(single);
    await grid.waitUntilOrderIsDisplayed(single); // record only once the order is in the grid
    await cap.page.waitForTimeout(1500);

    const clip = await startClip(cap, '10_single_label.mp4');
    clip.mark('open the order');
    await grid.clickOrderId(single);
    const generate = frame.getByRole('button', { name: /^(Generate Label|Prepare Shipment)$/ }).first();
    await generate.waitFor({ state: 'visible', timeout: 45_000 });
    await cap.page.waitForTimeout(2500); // let the viewer read the order
    await clip.box('order.generate', generate);
    clip.mark('click Generate Label');
    await summary.clickGenerateLabel();
    await summary.validateLabelSummaryDisplayed();
    await clip.box('label.summary', frame.getByText('Label Summary').first());
    clip.mark('label created');
    await cap.page.waitForTimeout(2500);
    await clip.stop();
  });

  test('20 bulk labels', async ({ cap }) => {
    const grid = new OrderGridPage(cap.page);
    const frame = app(cap.page);
    await grid.navigateToAppAndWaitForOrders(bulk);

    const clip = await startClip(cap, '20_bulk_labels.mp4');
    clip.mark('select orders');
    await grid.selectOrdersByIds(bulk);
    const generate = frame.getByRole('button', { name: 'Generate labels' });
    await generate.waitFor({ state: 'visible', timeout: 30_000 });
    await clip.box('bulk.generate', generate);
    clip.mark('click Generate labels');
    await generate.click();
    await grid.waitUntilStatusChangesInLabelBatch('1', 'Label Status', 'Processing', 'SUCCESS', 120_000, 'FAILURE');
    await grid.waitUntilStatusChangesInLabelBatch('2', 'Label Status', 'Processing', 'SUCCESS', 120_000, 'FAILURE').catch(() => {});
    clip.mark('labels created');
    await cap.page.waitForTimeout(2500);
    await clip.stop();
  });

  test('30 fulfil', async ({ cap }) => {
    const batch = new LabelBatchPage(cap.page);
    const frame = app(cap.page);
    const clip = await startClip(cap, '30_fulfil.mp4');
    const fulfil = frame.getByRole('button', { name: 'Mark as Fulfilled' }).first();
    await fulfil.waitFor({ state: 'visible', timeout: 30_000 });
    await cap.page.waitForTimeout(1200);
    await clip.box('batch.fulfil', fulfil);
    clip.mark('click Mark as Fulfilled');
    await batch.clickMarkAsFulfilledButton();
    await cap.page.waitForTimeout(8000);
    clip.mark('fulfilled');
    await clip.stop();
  });

  test('40 tracking dashboard', async ({ cap }) => {
    await new TrackingPage(cap.page).navigateToTrackingPage();
    await cap.page.waitForTimeout(2000);
    // Show real Delivered shipments when the store has any (review lesson #19). Uses the page's own status
    // filter; never paint a status that isn't true. Falls back to All Orders and says so.
    const status = app(cap.page).getByRole('combobox').first();
    const delivered = await status
      .selectOption({ label: 'Delivered' })
      .then(async () => {
        await cap.page.waitForTimeout(2500);
        return (await app(cap.page).getByText('Delivered', { exact: true }).count()) > 1;
      })
      .catch(() => false);
    if (!delivered) {
      console.log('⚠️  no Delivered shipments on this store: tracking shows All Orders (lesson #19 wants Delivered)');
      await status.selectOption({ label: 'All Orders' }).catch(() => {});
      await cap.page.waitForTimeout(1500);
    }
    await tidy(cap.page);
    await cap.shot('40_tracking_dashboard.png', {
      ...(await qaBoxes(cap.page)),
      'tracking.header': app(cap.page).locator('.sticky-header-tracking-table').first(),
    });
  });
}
