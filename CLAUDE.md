# CLAUDE.md — MCSL Carrier Marketing Videos

Produces one "Set up <Carrier> shipping on Shopify" marketing video per carrier for the
**PH MultiCarrier Shipping Label** app (PluginHive). Read [PLAN.md](PLAN.md) for the why.

## Source of truth
- Brand + motion rules: [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md)
- Narration rules: [docs/SCRIPT_STANDARD.md](docs/SCRIPT_STANDARD.md)
- `shots.yaml` / `carrier.yaml` schema: [docs/SHOT_SPEC.md](docs/SHOT_SPEC.md)
- Release gate: [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md)
- Carrier facts: the MCSL Domain Expert repo (`~/Documents/Pluginhive/DomainExperts/MCSLDomainExpert/docs/MCSL_CARRIER_*`,
  `~/Documents/Pluginhive/MCSL/mcsl-wiki`). Never claim a feature for a carrier unless it is listed there.
- Capture: [capture/README.md](capture/README.md). Reuses the QA repo
  `~/Documents/Pluginhive/qa_automation/mcsl-test-automation` (login, demo orders, page objects).

## Hard rules
- App name on screen and in narration is always **PH MultiCarrier Shipping Label**. Never
  "QA-MultiCarrier Shipping Label", never the QA app icon. Capture in the production app.
- The QA app and the production app are different apps; never call the QA app "public".
- One highlight colour (`--accent`), highlights only while a zoom is holding (never mid-zoom).
- No click ripples, no label tags. PluginHive logo top-right on every scene; Shopify logo
  only where Shopify is mentioned.
- No real customer data on screen. Demo data first; blur is the fallback.
- Edit the text files (`carrier.yaml`, `script.md`, `shots.yaml`), never hand-tune engine
  code for one carrier. If a carrier needs something new, add a generic option to the engine.
- Every render bumps `CHANGELOG.md` in the carrier folder.

## Layout
- `engine/` Remotion project (design space 1920x1080, final render at `--scale 2` = 4K)
- `carriers/<code>/` one folder per carrier, copied from `carriers/_template/`
- `capture/` Playwright capture flows (shared across carriers), linked to the QA repo by `capture/setup.sh`
- `tools/` validation and QA scripts
- `reference/ups/` marketing team's original UPS video, instructions and script

## Commands
```bash
cd engine && npm install
npm run props -- ups          # carriers/ups/*.yaml -> engine/src/generated/ups.json
npm run studio                # live preview
npm run stills -- ups 60 1200  # preview stills + sheet -> carriers/ups/review/stills/
npm run draft -- ups          # 1080p draft -> carriers/ups/renders/
npm run final -- ups          # 4K final   -> carriers/ups/renders/
python3 tools/qa_check.py ups # automated QA gate on the latest render

bash capture/setup.sh          # once: link capture/ to mcsl-test-automation
cd capture && npx playwright test <flow>   # store = mcsl-test-automation/.env; 4K captures -> carriers/<c>/capture/
```
Whole pipeline: the `marketing-video` skill ("Generate marketing video using the store <URL>"; the
user points the test repo's `.env` at that store first).

## Gotchas
- Remotion's downloaded chrome-headless-shell crashes on macOS 26; `engine/remotion.config.ts`
  points it at the installed Google Chrome. Renders also fail inside Claude's Bash sandbox —
  run `npm run stills/draft/final` in the Terminal panel (outside the sandbox).
- If renders hang on video frames ("delayRender ... proxy?src=...mov" timeout), macOS is killing Remotion's
  bundled ffprobe. Fix: `cd engine/node_modules/@remotion/compositor-darwin-arm64 && codesign --force --sign - *.dylib ffmpeg ffprobe remotion`
  (needed again after every reinstall of that package). A `node_modules` copied from another Mac also
  lacks esbuild's binary ("The service was stopped"): `rm -rf node_modules/esbuild node_modules/@esbuild && npm install`.
- Voiceover: `~/.cache/mcsl-tts/venv/bin/python tools/tts.py <c>` (Kokoro af_heart + word timings; setup in the file header).
- `npm run props -- <c>` is strict (missing capture/box = error). `--placeholders` gives a
  layout preview with grey frames instead.
- `carriers/ups/capture/4_*` and `11_*` are STAND-IN crops of the reference video used to test
  the engine. Replace them with real captures; their boxes.json are not committed.
