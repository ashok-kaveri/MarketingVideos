# QA report — ups-sample

Render: `carriers/ups-sample/renders/draft_v2.mp4`

| Result | Check | Detail |
|---|---|---|
| PASS | shots.yaml / script.md / captures / boxes consistent | ok  ups-sample: 12 scenes, 1:29 (2679 frames), 0 warning(s) |
| PASS | resolution 1920x1080 | 1920x1080 |
| PASS | 30 fps | 30/1 |
| PASS | H.264 | h264 |
| PASS | AAC audio | aac |
| PASS | loudness −16 LUFS ±1 | -16.1 LUFS |
| PASS | no black gaps > 1 s |  |
| SKIP | OCR checks (QA app name, PII) | tesseract not installed: brew install tesseract |

Manual items: see docs/QA_CHECKLIST.md. Contact sheet: `review/contact_sheet.jpg`.
