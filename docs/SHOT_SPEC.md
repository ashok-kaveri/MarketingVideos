# Shot Spec — `carrier.yaml` and `shots.yaml`

`shots.yaml` is the machine-readable replacement for the marketing "editing instructions" doc.
The engine reads it through `npm run props -- <carrier>` (engine/scripts/build-props.mjs).

## `carrier.yaml`
```yaml
code: ups                      # folder name
name: UPS                      # as spoken / on screen
logo: brand/logos/ups.png      # optional, for app card and split captions
chapters:                      # titles shown on chapter cards and the chapter pill
  - Install the app
  - Connect your UPS account
  - Set up live UPS rates
  - Print UPS shipping labels
  - Schedule UPS pickups
  - Fulfil & track orders
hook_bubbles: ["Which UPS rate do I charge?", "Printing labels one by one…"]
app_card: { price: "From $9/month. Free trial available.", rating: "4.9", reviews: 659 }
support_url: www.pluginhive.com/support
voice: { provider: elevenlabs, voice_id: TBD }
```

## `shots.yaml`
```yaml
scenes:
  - id: address-menu            # must match "## address-menu" in script.md
    chapter: 1                  # 1-6; a chapter card is auto-inserted when this changes
    type: screen                # see types below
    source: 2_address_app_main_menu.png   # file in carriers/<code>/capture/
    zoom: menu.address          # box name, or [x, y, w, h] in source pixels; omit for no zoom
    highlights:
      - target: menu.shop_location
        on: "shipping origin"   # appear when this phrase is spoken (default: when zoom holds)
        until: scene_end        # or another phrase; default scene_end
    blur: [form.phone, form.address]
    shopify_logo: false
    hold: 0.6                   # extra seconds after narration ends (default 0.6)
```

### Scene types
| type | needs | notes |
|---|---|---|
| `hook` | — | pain-point bubbles from `carrier.yaml` |
| `title` | — | "Automate your <Carrier> shipping on Shopify" + app icon |
| `screen` | `source` (png/jpg/mov/mp4) | the workhorse |
| `split` | `left`, `right` (each a screen-like block with `source`, `caption`, `zoom`, `highlights`) | checkout vs label printing |
| `statement` | `text` | "Shipping in bulk?" card |
| `callout` | `kind: paperless_invoice \| label_ready` | animated info card over the previous screen |
| `recap`, `app_card`, `support_card` | — | outro, data from `carrier.yaml` |

### Video sources
```yaml
    source: 6_UPS_account_integration.mov
    video:
      trim: [0, 126]             # seconds in the source
      cut: [[12, 15]]            # optional: drop these source ranges (loading screens, wrong clicks)
      speed:                     # optional speed ramps (source seconds)
        - { from: 40, to: 62, rate: 4 }   # shows the fast-forward badge
      sync:                      # optional: this source moment happens on this spoken phrase
        - { src: 4.3, on: "click Add Account" }
        - { src: 17.9, on: "then click Add" }
```
With `sync`, the clip between two anchors is sped up to fit the narration, or slowed (never below
0.75x) and then held on its first frame, so every click lands on its word. `speed` applies only after
the last anchor. Use it whenever the narration describes the actions in the clip.

### Patches (cover part of a capture)
```yaml
    patches:
      - { target: qa.title?, text: PH MultiCarrier Shipping Label, icon: true, bg: "#ffffff", color: "#303030", size: 24, pad_x: 6 }
      - { target: demo.email, text: orders@yourstore.com, bg: "#ffffff", color: "#000000", size: 28, weight: 400, pad_x: 12 }
      - { target: mail.button, text: Track your order, bg: "#4f34e2", color: "#fff", size: 30, align: center }
```
An opaque box (source-pixel `size`, `pad_x`) with optional text and app icon. Use it for demo data over
personal details on still screens (preferred to blur) and for wrong labels. Box the inside of an input,
not its border, and match the page background (a dimmed page is `#7f7f7f`).

### Box names (`zoom`, `highlights.target`, `blur`)
Resolved from `capture/<source>.boxes.json`, written by the Playwright capture flows:
```json
{ "image": { "w": 3840, "h": 2160 },
  "boxes": { "menu.address": [x, y, w, h], "form.phone": [x, y, w, h] } }
```
For hand-made captures, add boxes manually (any image editor shows pixel coordinates) or
use inline `[x, y, w, h]`. For videos, a box may be time-bound: `{ "rect": [...], "from": 3.2, "to": 9.0 }`.

### Multiple zooms, optional boxes, callouts
```yaml
    zoom:                         # sequence: each zoom holds until the next one's phrase
      - { target: ups.negotiated_rates }
      - { target: ups.enable_surepost, on: "UPS Ground Saver" }
    zoom: { target: packages.popup, on: "update package", until: "Once you've" }  # single, timed
    blur: [ups.account_number?]   # trailing "?" = apply only if the box exists in boxes.json
  - { id: paperless, type: callout, kind: paperless_invoice, over: print-settings }  # card over last frame of that scene
```
A scene without `chapter` (hook, intro, outro) shows no chapter pill.

### Timing
- Scene duration = narration length (from `audio/<id>.timings.json`, or estimated at 2.6 words/s
  before TTS exists) + `hold`. Video scenes: max(narration, playable video length).
- A script section that ends mid-sentence (no `.` `!` `?` at the end) runs into the next scene: no
  `hold`, no lead-in, and `tools/tts.py` speaks both as one take, so the sentence sounds natural.
- Highlight `on:` phrases resolve to word times; they are pushed back to the end of the zoom-in
  automatically (style rule: no highlights while zooming).
