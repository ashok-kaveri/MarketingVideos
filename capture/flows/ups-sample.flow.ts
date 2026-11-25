// UPS sample (pipeline demo on the QA store, CAPTURE_ALLOW_QA=1 VIDEO_CARRIER=ups-sample).
// Captures for carriers/ups-sample/shots.yaml: single label, bulk labels, fulfil, tracking dashboard.
// Navigation is the test repo's page objects; demo orders come from its uploader (no real customers).
import type { Page } from '@playwright/test';
import OrderGridPage from '@pages/orders/orderGridPage';
import OrderSummaryPage from '@pages/orders/orderSummaryPage';
import LabelBatchPage from '@pages/labelBatch/labelBatchPage';
import TrackingPage from '@pages/orders/trackingPage';
import { test, app } from './fixtures';
import { hideFloating, labelWithIconBoxes, type Clip, type Rect } from './lib';

test.describe.configure({ mode: 'serial' });
test.setTimeout(6 * 60_000);

const QA_NAME = 'QA-MultiCarrier Shipping Label';
let single = '';
let bulk: string[] = [];

/** QA app name + icon in the Shopify title bar and sidebar, for the engine's `patches` (QA store only). */
async function qaBoxes(page: Page): Promise<{ 'qa.title?': Rect | undefined; 'qa.sidebar?': Rect | undefined }> {
  const found = await labelWithIconBoxes(page, QA_NAME);
  const dpr = await page.evaluate(() => devicePixelRatio);
  // Shopify's sidebar is ~240 CSS px wide; the title bar starts right of it.
  return {
    'qa.title?': found.find(r => r[0] > 240 * dpr && r[1] < 60 * dpr),
    'qa.sidebar?': found.find(r => r[0] <= 240 * dpr),
  };
}

async function tidy(page: Page) {
  await hideFloating(page, 'Work with Sidekick');
}

async function startClip(cap: { page: Page; clip(n: string): Promise<Clip> }, name: string) {
  await tidy(cap.page);
  const clip = await cap.clip(name);
  for (const [k, r] of Object.entries(await qaBoxes(cap.page))) if (r) await clip.box(k.replace('?', ''), r);
  return clip;
}

test('demo orders', async ({ uploader }) => {
  single = (await uploader.uploadOrder()) as string;
  bulk = [(await uploader.uploadOrder()) as string, (await uploader.uploadOrder()) as string];
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
  await tidy(cap.page);
  await cap.shot('40_tracking_dashboard.png', {
    ...(await qaBoxes(cap.page)),
    'tracking.header': app(cap.page).locator('.sticky-header-tracking-table').first(),
  });
});
