# Script Standard

## Skeleton (fixed for every carrier)
| Block | Purpose | Target length |
|---|---|---|
| Hook | 5–7 pain-point bubbles, no narration or one line | 6 s |
| Intro | "In this video, I'll show you how to automate your <Carrier> shipping on Shopify, from … — all from one app." | 12 s |
| 01 Install the app | install, origin address auto-set, edit / add locations | 25 s |
| 02 Connect your <Carrier> account | Carriers tab → <Carrier> → Add Account → carrier's own registration | 30–60 s |
| 03 Set up live <Carrier> rates | packaging → carrier boxes → product dims → defaults → services (rates + labels) → carrier extras → insurance/signature → checkout demo | 90–120 s |
| 04 Print <Carrier> shipping labels | single label → edit before label → bulk → international (customs, duties payer, CI, paperless) | 80–100 s |
| 05 Schedule <Carrier> pickups | paste labels → Request Pickup → Pickup tab → manifest | 30 s |
| 06 Fulfil & track orders | mark fulfilled → tracking sync + emails → tracking dashboard | 25 s |
| Outro | recap line, free trial CTA, support URL | 20 s |

Total target: 6–8 minutes. Chapters that a carrier does not support are dropped, never faked
(e.g. no pickup API → chapter 05 becomes "Hand over at drop-off" or is removed).

## Scope rule (most important)
Show only what **our app supports for this carrier**, never what the carrier itself offers.
Every feature must be backed by a working merchant flow: an official PluginHive KB article, or a
code path that is not behind an off-by-default flag. A function or field existing in the code is NOT
proof (e.g. PostNord `getRates` exists but returns the cart total, so there are no live rates).
`brief.md` must hold a ✅/❌ support matrix with evidence before the script is written, and product
must confirm it. The six-chapter skeleton is a maximum: drop chapters the app does not support
(PostNord has no rates, pickup or manifest, so it has 5 chapters).

## Voice and tone
- Second person, present tense, friendly-confident. "You can…", "Just select…".
- One idea per sentence; ≤ 22 words per sentence.
- Name UI elements exactly as on screen, Title Case: "click **Generate Label**".
- Questions as transitions: "Shipping in bulk?", "Need to make changes?", "Shipping internationally?"
  Each of these gets a statement card.
- Carrier-specific differentiators go in chapter 03/04 (e.g. UPS SurePost/Ground Saver and negotiated
  rates; FedEx One Rate/HAL/dry ice; DHL paperless trade). Source them from the Domain Expert docs.
- Product name: "PH MultiCarrier Shipping Label app". Carrier names in their official form
  ("UPS Ground Saver, formerly known as SurePost").
- Close: "That's how you can automate your <Carrier> shipping on Shopify with the PH MultiCarrier
  Shipping Label app. Start your free trial today…" + support line `www.pluginhive.com/support`.

## Banned
- Claims the carrier docs do not back ("cheapest", "guaranteed delivery").
- Internal terms: QA app, toggle, store UUID, request log, C2/C3 codes.
- Prices other than the current app-listing price in `carrier.yaml`.

## Format of `script.md`
One `## <scene-id>` heading per scene, narration underneath, exactly as it will be spoken.
This is the ONLY place narration lives. `shots.yaml` references the ids; `npm run props` fails if a
scene in `shots.yaml` has no section here, or a section here is not used by any scene.
A section may be marked `## <id> (silent)` with no text for scenes without narration.
