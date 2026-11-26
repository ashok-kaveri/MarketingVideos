# MCSL Carrier Marketing Videos

Code-driven production of "How to set up <Carrier> shipping on Shopify" videos for the
PH MultiCarrier Shipping Label app.

## New carrier in 10 steps
1. `cp -R carriers/_template carriers/<code>` and fill `carrier.yaml`.
2. Write `brief.md` from the Domain Expert carrier docs (features, differentiators, gaps).
3. Write `script.md` per [docs/SCRIPT_STANDARD.md](docs/SCRIPT_STANDARD.md); get marketing approval.
4. Write `shots.yaml` per [docs/SHOT_SPEC.md](docs/SHOT_SPEC.md) — one scene per script line.
5. Prepare the demo store (carrier connected, demo products and orders).
6. Capture: `capture/` flows (reusing mcsl-test-automation's login and page objects) write 4K stills/clips
   + `*.boxes.json` into `carriers/<code>/capture/`; carrier-hosted login screens by hand. See [capture/README.md](capture/README.md).
7. Voiceover: TTS per scene into `audio/<scene-id>.mp3` + `<scene-id>.timings.json`.
8. `cd engine && npm run props -- <code> && npm run draft -- <code>`
9. `python3 tools/qa_check.py <code>`, review the contact sheet in `review/`, fix yaml, re-render.
10. Marketing sign-off → `npm run final -- <code>` → write `youtube.md` (title, chapters, description).

## Status
| Carrier | Brief | Script | Shots | Capture | VO | Draft | Final |
|---|---|---|---|---|---|---|---|
| PostNord | ✅ | 📝 v3 (marketing script + fixes) — marketing review | ✅ | ⚠️ marketing raw files, QA app (name patched) | ✅ Kokoro af_heart | draft_v1 (~5:46) | — |
| UPS (reference, done by marketing) | ✅ | ✅ (marketing) | ✅ | ⏳ raw files needed | ⏳ voice TBD | layout preview ✅ | — |
| UPS sample (pipeline demo, QA store) | ✅ | ✅ sample (approved UPS lines) | ✅ | ✅ automated 4K (capture/flows/ups-sample.flow.ts) | ✅ Kokoro af_heart | draft_v2 (1:29) | — |
| Amazon Shipping sample (pipeline demo, QA store) | ✅ (KB-backed) | ✅ sample | ✅ | ✅ automated 4K (shared labels tour) | ✅ Kokoro af_heart | draft_v2 (1:27) | — |
