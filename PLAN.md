# MCSL Carrier Marketing Videos — Project Plan

Goal: one polished "How to set up <Carrier> shipping on Shopify" video per MCSL carrier,
matching (and beating) the UPS reference video, produced in days per carrier instead of weeks.

Reference: `reference/ups/` — UPS Shopify setup video (FINAL), 7:21, 3840x2160 @ 30 fps,
plus the marketing team's instructions + script.

---

## 1. What the reference video actually is (reverse-engineered)

Structure (this becomes our fixed template):

| Block | Content |
|---|---|
| Hook | Floating "pain point" bubbles ("Which UPS rate do I charge?", "Printing labels one by one…", "Did UPS get my order?") on light background |
| Title | Navy gradient, kinetic text "Automate your **UPS shipping** on Shopify" + feature chip (Real-time rates) |
| Chapters 01–06 | Big outlined number + "STEP 0X OF 06" + title card, then scenes |
| | 01 Install the app · 02 Connect your <Carrier> account · 03 Set up live <Carrier> rates · 04 Print <Carrier> shipping labels · 05 Schedule pickups · 06 Fulfil & track orders |
| Scenes | App UI framed on navy gradient, chapter pill top-left, PluginHive logo top-right, cyan highlight boxes, smooth zoom in/hold/out, blur on PII, "4x fast-forward" badge on sped-up typing |
| Special scenes | Split screen "Checkout rates" vs "Label printing"; animated "Paperless Invoice" card; statement cards ("Shipping in bulk?", "Need to make changes?", "Shipping internationally?"); "Label on. Ready to ship." |
| Outro | "Your UPS shipping, automated." recap → app card ($9/mo, rating, Install) → "Start your free trial today" → "Need help setting up?" support card → end card |

Why it was slow: every zoom, highlight box and blur was hand-keyframed per shot, screens were
captured in the **QA app** (so the name/icon had to be replaced everywhere), and the
instruction doc is prose the editor has to interpret. All three are fixable.

---

## 2. Core idea: video-as-code + DOM-driven capture

1. **Capture with Playwright, not by hand.** Each shot is a scripted flow on a demo store
   running the **production PH MultiCarrier Shipping Label app** (no QA-app name to replace).
   At capture time we record each target element's bounding box from its locator →
   `shot_XX.boxes.json`. Highlights, zooms and blurs are then *computed*, not keyframed.
2. **PII never gets captured.** Demo store uses fake addresses/emails/phones; carrier
   account fields are masked with injected CSS during capture. Blur becomes a safety net, not a job.
3. **Render with Remotion (React video).** One component library (ChapterCard, Scene,
   Highlight, Zoom, Blur, SplitScreen, StatementCard, FastForwardBadge, Outro) → every carrier
   video is the same engine with a different config. Brand fixes apply to all carriers at once.
4. **Voiceover from TTS with word timestamps.** Highlights sync to the exact spoken word
   ("HS code … country of manufacture … description") automatically.
5. **Domain Expert writes the script.** Carrier features come from this repo's knowledge
   (`MCSLDomainExpert/docs/MCSL_CARRIER_*`, mcsl-wiki, RAG) so each video shows the carrier's
   real differentiators (UPS: SurePost/negotiated; FedEx: HAL, dry ice, alcohol; DHL: paperless
   trade; etc.), not a find-and-replace of UPS.
6. **Automated review.** Draft render → `watch-video` frames + OCR → checklist (no "QA-",
   no unmasked email/phone, logo present every scene, captions match script, durations).

Manual parts that stay manual: carrier OAuth/registration screens (record once with QuickTime,
drop in as `.mov`), script approval by marketing, final sign-off.

---

## 3. Folder structure

```
MCSLCarrierVideos/
├── CLAUDE.md                     # agent rules for this repo
├── README.md                     # how to produce a carrier video, end to end
├── PLAN.md                       # this file
├── docs/
│   ├── STYLE_GUIDE.md            # colours, fonts, logo rules, highlight style, motion timings
│   ├── SCRIPT_STANDARD.md        # tone, length, the 6-chapter skeleton, banned phrases
│   ├── SHOT_SPEC.md              # shots.yaml schema (the machine version of the instructions doc)
│   └── QA_CHECKLIST.md           # what every render must pass before review
├── brand/                        # PH app icon, PluginHive logo, Shopify logo, carrier logos,
│                                 # fonts, music bed, intro/outro assets
├── engine/                       # Remotion project (shared components + Carrier composition)
├── capture/                      # Playwright flows per chapter, demo-store fixtures, mask CSS
├── tools/                        # tts.py, qa_check.py, build_shots.py, render.sh
├── reference/ups/                # original marketing video, instructions, script
└── carriers/
    ├── _template/                # copied for every new carrier
    └── ups/
        ├── carrier.yaml          # name, colours, logo, chapters on/off, services, pricing card
        ├── script.md             # approved narration, one paragraph per scene
        ├── shots.yaml            # scene list: source, zoom/highlight/blur targets, VO line
        ├── capture/              # raw .mov/.png + *.boxes.json (gitignored binaries)
        ├── audio/                # TTS per scene + word timings
        ├── review/               # contact sheets, QA report, marketing feedback
        ├── renders/              # draft_1080p_vN.mp4, final_4k.mp4
        └── CHANGELOG.md          # what changed per version and why
```

### `shots.yaml` example (replaces the prose instructions file)

```yaml
- id: 14
  chapter: 3
  source: capture/14_product_weight_dimensions.png
  vo: "Add your product dimensions in the app's Products section."
  zoom: { target: "edit-shipping-modal", hold: until_vo_end }
  highlight:
    - { target: "weight-field",     on_word: "dimensions" }
    - { target: "dimensions-field", on_word: "dimensions" }
  blur: []
```

Targets resolve against `*.boxes.json`, so changing the zoom area is a one-word edit.

---

## 4. Per-carrier pipeline

| # | Step | Who | Output |
|---|---|---|---|
| 1 | Feature brief from Domain Expert knowledge | Claude | `carriers/<c>/brief.md` (what to show, differentiators, what this carrier does NOT support) |
| 2 | Script draft on the 6-chapter skeleton | Claude → marketing approves | `script.md` |
| 3 | Shot list | Claude | `shots.yaml` |
| 4 | Demo store ready (carrier connected, products, orders) | Reuse new-carrier store pipeline | store + env |
| 5 | Playwright capture (headed) + manual carrier-login clip | Claude + you | `capture/` |
| 6 | TTS voiceover with word timings | tool | `audio/` |
| 7 | Draft render 1080p | Remotion | `renders/draft_v1.mp4` |
| 8 | Auto QA + contact sheet review | tool + Claude | `review/qa_report.md` |
| 9 | Marketing review → fixes (edit yaml/script, re-render) | marketing + Claude | `draft_vN` |
| 10 | Final 4K render + YouTube chapters/description | Remotion + Claude | `final_4k.mp4`, `youtube.md` |

Target: steps 1–8 in ~1 day per carrier once the engine exists.

---

## 5. Build phases

- **Phase 0 — Foundations (2–3 days).** Repo, docs standards, brand kit, Remotion engine with
  all components, cut-down hook/title/chapter/outro animations matching the reference.
- **Phase 1 — UPS pilot remake.** Rebuild the UPS video through the new pipeline and A/B it
  against the marketing version. This is the acceptance test for the engine.
- **Phase 2 — Top carriers:** FedEx, DHL Express, USPS (+ Stamps/EasyPost variants), Canada Post.
- **Phase 3 — Rest:** Amazon Shipping, Purolator, PostNord, TNT, Parcelforce, PostNL, Aramex,
  NZ Post, Sendle, APC, Landmark Global, AU Post/Blue Dart variants.
- **Extras once stable:** 60-s vertical cuts per carrier for Reels/Shorts from the same
  shots, App Store listing clips, localized VO.

---

## 6. Improvements over the reference

- Production app captured directly (no name/icon replacement pass)
- Fake demo data → near-zero blur work, no PII risk
- Highlights land on the spoken word, one consistent colour/radius/timing
- Same pixel-perfect layout across all carriers; brand change = re-render all
- Carrier-specific chapter 03 extras driven by real capability data, not copy-paste
- Every version reproducible from text files (script + yaml), diffable in git

---

## 7. Decisions needed before Phase 0

1. **Raw UPS source files** (`1_app_installation_MCSL.mov` … `35_…png`) and the marketing
   team's brand assets (fonts, music, intro/outro project, the TTS voice used) — where are they?
2. **Voice:** which TTS service/voice did marketing use? Need API access for word timestamps
   (ElevenLabs is the usual choice).
3. **Engine:** Remotion (recommended, code-driven) vs. an editing app (Edits/metapilot) per video.
4. **Demo store:** OK to create one "marketing" store per carrier with the production app?
