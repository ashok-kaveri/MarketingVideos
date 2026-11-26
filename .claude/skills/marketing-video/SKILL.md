---
name: marketing-video
description: Produce a "Set up <Carrier> shipping on Shopify" marketing video for the PH MultiCarrier Shipping Label app, end to end, from a demo store. Use when the user asks to generate / make / create a marketing video (or its script) "using the store <URL>", or to continue one after script approval ("script approved", "make the video"). Stage 1 writes the script and stops for approval; stage 2 captures the app and renders the draft.
---

# Marketing video from a store

The user's prompt looks like: **"Generate marketing video using the store <URL>"**.
The user has already pointed the QA repo's `.env` (`~/Documents/Pluginhive/qa_automation/mcsl-test-automation/.env`)
at that store. Do not ask for credentials, do not read or print that `.env`, and do not check the URL against it:
the capture code reads it. Get the store and carrier only from the `info` flow below.

Two stages with a hard stop between them: **script → marketing approval → video**.
Rules that always apply: [CLAUDE.md](../../../CLAUDE.md), [docs/SCRIPT_STANDARD.md](../../../docs/SCRIPT_STANDARD.md),
[docs/SHOT_SPEC.md](../../../docs/SHOT_SPEC.md), [docs/STYLE_GUIDE.md](../../../docs/STYLE_GUIDE.md),
[docs/QA_CHECKLIST.md](../../../docs/QA_CHECKLIST.md), [capture/README.md](../../../capture/README.md).
Follow `carriers/postnord/` as the worked example of every file.
**Read [docs/REVIEW_LESSONS.md](../../../docs/REVIEW_LESSONS.md) first**: 40 review notes from PostNord turned into
rules. Most are automatic (logos, hard cuts, no hook, Sidekick); the rest are rules for the script, the shot list
and the capture. Breaking one means another review round.

## Where commands run
- `capture/` flows open a browser and may need the user to type a Shopify code: run them in the
  **Terminal panel** (`run_in_terminal`, cwd = `capture/`), and tell the user a sign-in window may open.
- Renders (`npm run stills/draft/final`) also run in the Terminal panel (they fail in the sandbox).
- `npm run props`, `tools/tts.py`, `tools/qa_check.py`, `npx playwright test info|--list`, `tsc` run in Bash.

## Stage 0 — setup (seconds)
1. If `capture/.mcsl` is missing: `bash capture/setup.sh`.
2. `cd capture && npx playwright test info` → read the `STORE_INFO` line: store, app, carrier label,
   carrier folder.
   - `app` must be `production`. If it says QA app, stop: the store's `APPURL` must be the production
     app (`/apps/multi-carrier-shipping-label`). Tell the user; never capture from the QA app.
   - `carrierFolder: null` = new carrier: `cp -R carriers/_template carriers/<code>` (lower-case code,
     e.g. `dhl`, `fedex`), then run `info` again. If the label is ambiguous (e.g. "Multi Carrier Store"),
     ask which carrier the video is for and run flows with `VIDEO_CARRIER=<code>`.

## Stage 1 — script (ends with a STOP)
1. **Brief** (`carriers/<c>/brief.md`): support matrix ✅/❌ with evidence, per SCRIPT_STANDARD "Scope rule".
   Sources: `~/Documents/Pluginhive/DomainExperts/MCSLDomainExpert/docs/` (MCSL_CARRIER_CAPABILITY_MATRIX.md,
   MCSL_CARRIER_SUPPORT_REGISTRY.md, kb_snapshots/), `~/Documents/Pluginhive/MCSL/mcsl-wiki`, and the
   app code when available. Only what **our app** supports for this carrier, never what the carrier offers.
   List open questions for product at the end.
2. **Explore the store** for exact on-screen names (Terminal panel, from `capture/`):
   `npx playwright test explore` (app home), then
   `EXPLORE="Carriers;Carriers><Carrier>;Products;Settings;..." npx playwright test explore`.
   Read `carriers/<c>/review/explore/*.aria.yaml` (and the pngs) — button, tab, field and service
   names in the script must match these exactly (Title Case as on screen).
3. **Write** `carrier.yaml` (with `say:` for brand words and `market:`; add `brand/logos/<code>.png`), `script.md` (one `## <scene-id>` per scene, SCRIPT_STANDARD voice, chapters the
   app does not support for this carrier are dropped), and `shots.yaml` (one scene per script section;
   `source:` file names you will capture in stage 2, `zoom`/`highlights` box names you will record).
4. **Preview**: `~/.cache/mcsl-tts/venv/bin/python tools/tts.py <c>`, then
   `cd engine && npm run props -- <c> --placeholders`, and a draft render in the Terminal panel
   (`npm run draft -- <c>`) — real voice and timing, grey frames for the screens.
5. Bump `carriers/<c>/CHANGELOG.md` ("script v1"), update the status table in README.md.
6. **STOP.** Give the user: the script (scene by scene), the ❌ features left out and why, the open
   questions, and the preview path. Ask for marketing approval. Do not start stage 2 until the user
   says the script is approved (changes requested → edit, re-run step 4, stop again).

## Stage 2 — video (after approval)
1. **Demo data**: orders via the `uploader` fixture (`uploader.uploadOrder()` etc.), never real customers.
   Anything personal still on screen → `mask()` or a `patches:` entry, never shipped unblurred.
2. **Flows**: write `capture/flows/<c>.flow.ts` — one `test()` per capture file in `shots.yaml`, in
   order. Navigate with the test repo's page objects (`@pages/...`, iframe via `app(page)`); use
   `cap.shot()` for stills and `cap.clip()` + `clip.box()` / `clip.mark()` for clips; box names exactly
   as in `shots.yaml`. A screen without a page object: add one **in the test repo** under
   `support/pages/` (don't commit there; tell the user, so QA can review it). Shared steps (address,
   packaging, products) go in a helper both carriers can use, not copy-paste.
3. **Capture** (Terminal panel, from `capture/`): `npx playwright test <c>`. Check every output:
   open the pngs / a few clip frames (`ffmpeg -ss <t> -i x.mp4 -frames:v 1`), confirm the app name is
   **PH MultiCarrier Shipping Label**, no real customer data, boxes on the right elements. Fix the flow
   and re-run only the failing test (`-g "<title>"`).
4. Carrier-hosted pages (carrier login/registration outside the app) can't be scripted: list them for
   the user to record by hand (QuickTime, 4K), with the file name `shots.yaml` expects.
5. **Sync clips to the voice**: fill `video.sync` anchors in `shots.yaml` from the `⏱` marks the
   capture printed (SHOT_SPEC "Video sources").
6. **Self-review against REVIEW_LESSONS** before anyone else sees it: words vs screen at every highlight,
   confirmation toasts readable, no error text, no browser chrome, Delivered status, market currency.
   Fix in `shots.yaml` (cut, sync, highlights, patches) or re-capture.
7. **Build**: `cd engine && npm run props -- <c>` (strict — fix every missing file/box), stills
   (`npm run stills -- <c> <frames…>`) and look at `review/stills/sheet.jpg`, then `npm run draft -- <c>`.
8. **QA**: `python3 tools/qa_check.py <c>` + docs/QA_CHECKLIST.md. Fix in the yaml / flows, never by
   hand-tuning engine code for one carrier (a new need → a generic engine option).
9. Bump `CHANGELOG.md` (every render), update README status. Report: draft path, what was captured,
   anything still manual, QA results. The 4K final (`npm run final -- <c>`) only after marketing
   signs off the draft.
