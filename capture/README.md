# Capture

Playwright flows that record app screens **and** the bounding boxes the engine needs.

## Rules
- Production **PH MultiCarrier Shipping Label** app on a per-carrier marketing demo store. Never the QA app.
- Viewport 1920x1080, `deviceScaleFactor: 2` → 3840x2160 screenshots/recordings.
- Run headed (`--headed`) so the operator can watch.
- Demo data only (fixtures/). Mask anything real with `mask.css` before capture.
- Carrier-hosted login/registration pages: record manually (QuickTime, 4K), then add boxes by hand.

## Output contract
For every `capture/<name>.png|mov` the flow writes `<name>.<ext>.boxes.json`:
```json
{ "image": { "w": 3840, "h": 2160 }, "boxes": { "menu.address": [x, y, w, h] } }
```
Box names are the ones used in `carriers/<code>/shots.yaml`. Use `boxOf(page, locator)` from
`flows/lib.ts` — never hand-type coordinates for app screens.

## Status
Flows are not written yet (Phase 0 next step): needs a marketing demo store with the production app.
