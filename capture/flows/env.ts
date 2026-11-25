// Which store to capture from, and where the files go.
//   Store: the test repo's .env (the one the QA suite uses), unless CAPTURE_ENV names another file
//          (a name in the test repo's carrier-envs/, or a path). Keys as in the test repo: APPURL,
//          SHOPIFYURL, SHOPIFY_STORE_NAME, USER_EMAIL, USER_PASSWORD, SHOPIFY_ACCESS_TOKEN,
//          *_PRODUCTS_JSON, CARRIER, ... Credentials stay in that file; nothing here prints or copies them.
//   Carrier folder: VIDEO_CARRIER=<code> (carriers/<code>), else worked out from the env's free-form
//          CARRIER ("PostNord-UK" -> postnord). CARRIER itself is left as is: page objects read it.
//   CAPTURE_ALLOW_QA=1: pipeline test on a QA-app store. Output then goes to capture/_qa_test/<carrier>/,
//          never to the carrier folder (CLAUDE.md: videos are captured in the production app).
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const CAPTURE_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(CAPTURE_DIR, '..');
const TEST_REPO = path.join(CAPTURE_DIR, '.mcsl');
const QA_APP = /\/apps\/mcsl-qa(\/|$)/;

export type CaptureEnv = {
  envFile: string;
  store: string;
  appUrl: string;
  qa: boolean;
  carrier?: string; // carriers/<code>, if one matches
  carrierLabel: string; // the env's CARRIER value
  outDir?: string;
};

/** Store handle from any Shopify admin URL: admin.shopify.com/store/<h>/... or <h>.myshopify.com/... */
export function storeOf(url: string): string | undefined {
  const u = url.trim().replace(/^['"]|['"]$/g, '');
  return u.match(/admin\.shopify\.com\/store\/([^/?#]+)/)?.[1] ?? u.match(/^(?:https?:\/\/)?([^./]+)\.myshopify\.com/)?.[1];
}

export function resolveEnvFile(name = process.env.CAPTURE_ENV): string {
  if (!name) return path.join(TEST_REPO, '.env');
  const candidates = [name, path.join(TEST_REPO, 'carrier-envs', name.endsWith('.env') ? name : `${name}.env`)];
  const hit = candidates.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!hit) throw new Error(`CAPTURE_ENV=${name}: no file at ${candidates.join(' or ')}`);
  return hit;
}

const carrierFolders = () =>
  fs.readdirSync(path.join(REPO_ROOT, 'carriers')).filter(d => !d.startsWith('_') && !d.startsWith('.') &&
    fs.statSync(path.join(REPO_ROOT, 'carriers', d)).isDirectory());

function carrierFor(label: string): string | undefined {
  const asked = process.env.VIDEO_CARRIER;
  if (asked) {
    if (!/^[a-z0-9_-]+$/.test(asked) || asked.startsWith('_')) throw new Error(`VIDEO_CARRIER=${asked}: use the carriers/<code> folder name`);
    return asked;
  }
  const norm = label.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hits = carrierFolders().filter(code => norm.includes(code.replace(/[^a-z0-9]/g, '')));
  return hits.sort((a, b) => b.length - a.length)[0]; // longest match wins (e.g. "fedexrest" over "fedex")
}

let loaded: CaptureEnv | undefined;

/** Reads the store env into process.env (once). Throws only on a wrong setting, never on a missing carrier. */
export function loadCaptureEnv(): CaptureEnv {
  if (loaded) return loaded;
  const envFile = resolveEnvFile();
  if (!fs.existsSync(envFile)) throw new Error(`no store env file at ${envFile} (run capture/setup.sh?)`);
  dotenv.config({ path: envFile, override: true, quiet: true });
  const appUrl = (process.env.APPURL ?? '').trim().replace(/^['"]|['"]$/g, '');
  const store = storeOf(appUrl) ?? process.env.SHOPIFY_STORE_NAME?.trim();
  if (!appUrl || !store) throw new Error(`${envFile}: APPURL is not a Shopify admin app URL`);
  const qa = QA_APP.test(appUrl);
  const carrierLabel = (process.env.CARRIER ?? '').trim().replace(/^['"]\s*|\s*['"]$/g, '');
  const carrier = carrierFor(carrierLabel);

  // The test repo's login keys its session file on BROWSER: auth-<BROWSER>.json in the working
  // directory (capture/). One session per store, apart from the QA suite's auth-chrome.json.
  process.env.BROWSER = `capture-${store}`;
  const outDir = carrier && (qa ? path.join(CAPTURE_DIR, '_qa_test', carrier) : path.join(REPO_ROOT, 'carriers', carrier, 'capture'));
  loaded = { envFile, store, appUrl, qa, carrier, carrierLabel, outDir };
  return loaded;
}

/** For capture runs: production app (unless CAPTURE_ALLOW_QA=1) and an existing carrier folder. */
export function requireCaptureEnv(): CaptureEnv & { carrier: string; outDir: string } {
  const env = loadCaptureEnv();
  if (env.qa && process.env.CAPTURE_ALLOW_QA !== '1') {
    throw new Error(
      `APPURL points at the QA app (/apps/mcsl-qa). Videos are captured in the production app ` +
        `(/apps/multi-carrier-shipping-label). For a pipeline test only, set CAPTURE_ALLOW_QA=1.`,
    );
  }
  if (!env.carrier || !env.outDir) {
    throw new Error(`no carriers/<code> folder matches CARRIER="${env.carrierLabel}"; set VIDEO_CARRIER=<code>`);
  }
  if (!fs.existsSync(path.join(REPO_ROOT, 'carriers', env.carrier))) {
    throw new Error(`carriers/${env.carrier}/ does not exist (copy carriers/_template first)`);
  }
  fs.mkdirSync(env.outDir, { recursive: true });
  return env as CaptureEnv & { carrier: string; outDir: string };
}
