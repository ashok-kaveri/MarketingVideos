# Review lessons

Every change marketing and product asked for on the PostNord video (5 review rounds, 40 items),
turned into rules so the next carrier passes review the first time. Read this before writing a script
(stage 1) and before capturing (stage 2); `marketing-video` skill and `docs/QA_CHECKLIST.md` point here.

Each rule says **how it is enforced**:
- **auto**: the engine or capture code does it by default; nothing to remember.
- **script / shots / capture**: a rule for whoever writes `script.md`, `shots.yaml` or a capture flow.
- **QA**: a check on the draft before it goes to review (`docs/QA_CHECKLIST.md`).

`#n` = item number in the original feedback list (rounds: 1 = #1–11, 2 = #12–18, 3 = #19–28, 4 = #29–36,
5 = #37–40).

## 1. The screen matches the words, when they are spoken
The most repeated note (#2, #3, #6, #17, #24, #26, #27, #29, #31).

| Rule | How |
|---|---|
| A clip that shows actions moves with the voice: each click lands on the word that names it. | shots: `video.sync` anchors from the `⏱` marks capture prints (#2) |
| Name UI blocks **in the order they appear on screen**, and highlight each one as it is named. | script + shots: one `highlights` entry per named block, `on:` its words (#24) |
| Say what the clip actually clicks ("select **All**", not "select Label" when the clip picks All). | script: write narration from the capture, not from memory (#26) |
| Describe what is on that screen, not the feature in general. | script (#17) |
| If the screen and the sentence disagree, reorder the sentence or re-cut the clip. | script/shots (#6) |
| Two actions in one line ("Export CSV, then Import CSV"): highlight both, in that order. | shots (#27) |
| A UI element appears only after the words that introduce it (no box before its field is shown). | shots: `on:` / `sync` (#31) |
| Confirmation messages ("account connected", "label created") stay on screen long enough to read, and are highlighted when the voice mentions them. | capture: wait for the toast before `clip.stop()`; shots: highlight it (#29) |

## 2. Make the click path obvious
| Rule | How |
|---|---|
| Zoom in and highlight the thing being talked about when it is small (a menu item, a number, a field). | shots: `zoom` + `highlights` (#3, #7, #9, #28) |
| Show how you got there: if a box opens from a menu, show the menu click (#30). | capture + shots |
| Search boxes are empty unless the voice says what is typed. Type only what the narration says. | capture (#4 → reversed by #25: empty) |
| Cut dead time (cursor wandering, loading, retries); speed up long waits (badge shows). | shots: `video.cut` / `speed`; auto badge (#3, #20, #22) |
| Spots that feel rushed get more time: sync slows a clip (≥ 0.75×) and holds; add `hold:`. | shots (#23) |
| Install clip ends on the **Install** click; no plan/pricing page. | shots: `trim`/`cut` (#22) |

## 3. Only what the app supports, only what is true
| Rule | How |
|---|---|
| Claim only features in `brief.md` with evidence (KB article or working merchant flow). | script; `docs/SCRIPT_STANDARD.md` scope rule |
| Cut a clip whose information turned out invalid instead of explaining around it. | shots (#20) |
| Intro lists the **main** features only (labels, fulfilment, tracking), not every add-on. | script (#15) |
| Keep the first label flow simple; extras (special services) get their own short. | script/shots (#39) |
| Show a real **Delivered** status on the tracking dashboard: use an order that was delivered, never paint a status. | capture: tracking step selects the page's own "Delivered" filter and warns when the store has none (#19) |
| Show the flow the merchant actually uses after a label, e.g. **Generate Label & Fulfil** on the order summary (label + fulfilled in one step) where the app offers it. | script/capture (#40) |

## 4. No personal data, no QA app, no clutter
| Rule | How |
|---|---|
| Demo data, not blur: orders from the test repo uploader ("Test User", demo addresses). | auto (uploader) (#5) |
| Account identifiers (Party ID, account numbers) are blurred or demo values; blurs follow text that scrolls (time-bound boxes). | capture: `clip.box` per position; shots: `blur` (#13) |
| Never the QA app name or icon. Capture in the production app; on a QA store paint the production name over it. | auto: QA app refused unless `CAPTURE_ALLOW_QA=1`; shots `patches` (#16) |
| Only the live app under **Apps** in the Shopify sidebar. | capture on a store with only the production app installed (#16) |
| No browser chrome: no tabs, address bar, bookmarks bar. | auto: capture records the page only (#10, #32). Hand recordings: crop. |
| No dev-store banners or broken buttons in emails; fix or crop them. | capture/shots (#9) |
| Shopify's "Work with Sidekick" bar is **not** hidden (asked in round 2, reversed in round 4). | auto: the tour no longer hides it (#12, #35) |

## 5. The carrier's market
| Rule | How |
|---|---|
| Currency, weight/dimension units and origin address match the carrier's market (PostNord: Nordic kr, kg/cm, Nordic origin). | `carrier.yaml market:`; set the demo store up that way before capture (#18, #34) |
| Painting a currency symbol over another is a last resort a reviewer signs off (PostNord final: "kr" over "$"). | shots `patches` + reviewer OK (#36) |
| Brand names are spoken the way the carrier says them ("PostNord" as one word). | `carrier.yaml say:` → `tools/tts.py` (#1) |
| A sentence that runs over two screens is spoken in one take, with no gap. | auto: `tools/tts.py` + build-props (section without final punctuation) (#1) |

## 6. Branding
| Rule | How |
|---|---|
| PluginHive logo top-right on every scene, **all white** on navy. | auto (#14) |
| Shopify logo (bag + white "Shopify", not green text) on the title card and the closing cards; elsewhere only with `shopify_logo: true`. | auto (#11, #14, #38) |
| Carrier logo at the start, on the closing cards, and at suitable points between (`carrier_logo: true` on a scene, e.g. the connect-account screen). | auto on title + closing cards from `carrier.yaml logo:`; props warns when the file is missing (#33, #38) |
| Sharp app icon (`brand/icons/ph_app_icon.png`). | auto (#11) |
| No opening hook: the video starts on "In this video". | template has no hook scene (#21) |

## 7. Technical polish
| Rule | How |
|---|---|
| No flicker between screens: consecutive app screens hard-cut inside the same frame, no dip to the background. | auto: build-props sets `fadeIn: false` between framed scenes (#37) |
| No bookmarks bar, Chrome tabs or OS UI in any hand recording. | QA (#10, #32) |
| Final check of the 4K render for glitches before sending. | QA |

## Not automated yet (do by hand, or build when it repeats)
- Carrier logo files: `brand/logos/<carrier>.png` must be added per carrier (none in the repo yet).
- Choosing an order that really reached Delivered depends on the store's history; the capture only finds it.
- Confirmation-toast highlights need a box per toast (`clip.box('toast.*', …)` in the flow).
