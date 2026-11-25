# UPS sample — changelog

## draft v1 — 2026-11-25
- First end-to-end run of the automated pipeline: capture/flows/ups-sample.flow.ts (test-repo login session,
  page objects, demo orders by API) → Kokoro voiceover → Remotion draft.
- QA store (mcsl-automation, QA app): app name + icon painted over with PH MultiCarrier Shipping Label;
  Shopify's "Work with Sidekick" bar hidden at capture.

## draft v2 — 2026-11-25
- Fixes from reviewing v1: QA name patches were mis-scaled with 1080p draft proxies (engine now keeps the capture's
  declared size as coordinate space — generic fix in build-props); fast-forward badge rounded ("3x", was
  "2.98666…x"); bulk "Generate labels" highlight ends when the batch page opens.
- Draft rendered from 1080p proxies of the 4K clips (originals kept as capture/*.4k.mp4 for the final).
- Known: Shopify's "Work with Sidekick" bar still shows on the order page (lives outside the page the hider reaches).
- QA gate: all automated checks pass (OCR checks skipped: tesseract not installed).
