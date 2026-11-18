import { Config } from '@remotion/cli/config';
import fs from 'node:fs';

// Remotion's downloaded chrome-headless-shell crashes on macOS 26 ("icudtl.dat not found in bundle").
// Use the installed Google Chrome when present (override with REMOTION_CHROME).
const chrome = process.env.REMOTION_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (fs.existsSync(chrome)) {
  Config.setBrowserExecutable(chrome);
  Config.setChromeMode('chrome-for-testing');
}
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(4);
