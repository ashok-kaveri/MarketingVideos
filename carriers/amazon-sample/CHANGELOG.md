# Amazon Shipping sample — changelog

## draft v2 — 2026-11-25
- First Amazon Shipping sample: QA store mcsl-automation-amazon, demo orders #3908–#3910 (UK, Amazon Shipping Two Day),
  captured with the shared labels tour (capture/flows/common/labels-tour.ts), Kokoro af_heart voice. 1:27.
- QA store demo product has no dimensions: the order page shows "Package Dimensions cannot be empty" and the first
  Generate Label retried; cut in shots.yaml, red text covered by a white patch (hand-added box amz.dims_error).
- Engine (generic): title/recap no longer say "Amazon Shipping shipping" when the carrier name already ends in Shipping.
- v1 (not kept): duplicated "shipping" in the title, error text visible.
- QA gate: all automated checks pass (OCR skipped: tesseract not installed).
- Known: older QA orders in the grid include two "Label Failed" rows; Shopify's Sidekick bar shows on the order page.
