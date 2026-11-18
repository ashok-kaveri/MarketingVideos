# MCSL Carrier Marketing Videos

Code-driven production of "How to set up <Carrier> shipping on Shopify" videos for the
PH MultiCarrier Shipping Label app.

## New carrier in 10 steps
1. `cp -R carriers/_template carriers/<code>` and fill `carrier.yaml`.
2. Write `brief.md` from the Domain Expert carrier docs (features, differentiators, gaps).
3. Write `script.md` per [docs/SCRIPT_STANDARD.md](docs/SCRIPT_STANDARD.md); get marketing approval.
4. Write `shots.yaml` per [docs/SHOT_SPEC.md](docs/SHOT_SPEC.md) — one scene per script line.
5. Prepare the demo store (carrier connected, demo products and orders).
6. Capture: Playwright flows into `capture/` (+ `*.boxes.json`); carrier login screens by hand.
7. Voiceover: TTS per scene into `audio/<scene-id>.mp3` + `<scene-id>.timings.json`.
8. `cd engine && npm run props -- <code> && npm run draft -- <code>`
9. `python3 tools/qa_check.py <code>`, review the contact sheet in `review/`, fix yaml, re-render.
10. Marketing sign-off → `npm run final -- <code>` → write `youtube.md` (title, chapters, description).

## Status
| Carrier | Brief | Script | Shots | Capture | VO | Draft | Final |
|---|---|---|---|---|---|---|---|
| UPS (pilot) | ✅ | ✅ (marketing) | ✅ | ⏳ raw files needed | ⏳ voice TBD | layout preview ✅ | — |
