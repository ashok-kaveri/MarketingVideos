// Prints which store and carrier the capture env points at. No browser, no credentials printed.
//   npx playwright test info
import { test } from '@playwright/test';
import { loadCaptureEnv } from './env';

test('store info', () => {
  const e = loadCaptureEnv();
  console.log(
    'STORE_INFO ' +
      JSON.stringify({
        envFile: e.envFile.replace(/^.*\/\.mcsl\//, 'mcsl-test-automation/'),
        store: e.store,
        app: e.qa ? 'QA app (mcsl-qa) — not for videos' : 'production',
        carrierLabel: e.carrierLabel,
        carrierFolder: e.carrier ? `carriers/${e.carrier}` : null,
      }),
  );
});
