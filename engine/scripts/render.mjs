#!/usr/bin/env node
// npm run draft -- <code>   -> carriers/<code>/renders/draft_vN.mp4   (1920x1080)
// npm run final -- <code>   -> carriers/<code>/renders/final_4k_vN.mp4 (3840x2160)
// Extra args after the code are passed to `remotion render` (e.g. --frames=0-300).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [mode, code, ...extra] = process.argv.slice(2);
if (!['draft', 'final'].includes(mode) || !code) { console.error('usage: npm run draft|final -- <carrier> [remotion args]'); process.exit(2); }
if (!fs.existsSync(path.join(ENGINE, 'src', 'generated', `${code}.json`))) { console.error(`run "npm run props -- ${code}" first`); process.exit(2); }

const outDir = path.resolve(ENGINE, '..', 'carriers', code, 'renders');
fs.mkdirSync(outDir, { recursive: true });
const prefix = mode === 'draft' ? 'draft_v' : 'final_4k_v';
const n = 1 + Math.max(0, ...fs.readdirSync(outDir).map((f) => +(f.match(new RegExp(`^${prefix}(\\d+)\\.mp4$`))?.[1] ?? 0)));
const out = path.join(outDir, `${prefix}${n}.mp4`);
const flags = mode === 'final' ? ['--scale=2', '--crf=16', '--audio-bitrate=320k'] : ['--crf=23'];
const r = spawnSync('npx', ['remotion', 'render', 'src/index.ts', `carrier-${code}`, out, '--codec=h264', ...flags, ...extra], { cwd: ENGINE, stdio: 'inherit' });
if (r.status === 0) console.log(`\nrendered ${path.relative(path.resolve(ENGINE, '..'), out)}`);
process.exit(r.status ?? 1);
