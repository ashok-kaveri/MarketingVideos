# PostNord — feature brief (v2, verified)

**Rule for every carrier:** the video shows only what **our app** supports for the carrier, not what
the carrier itself offers. A feature goes in the script only when there is evidence of a working,
merchant-facing flow: an official PluginHive KB article, or a code path that is not behind an
off-by-default flag. A function existing in the code is not enough.

Code: `~/Documents/storepep-react/storepepSAAS` (b5f78c270). KB: `MCSLDomainExpert/docs/kb_snapshots/`.

## Support matrix
| Capability | In video? | Evidence |
|---|---|---|
| Live checkout rates | ❌ NO | `getRates` returns the order's cart total as a placeholder "rate" for each configured service (postNordShipmentHelper.js:128-200). The PostNord Rating API is not integrated (comment l.91). Delivery Options API is off by default, per-account flag (featureLoader.js:57). Merchants use Shopify's own shipping rates. |
| Pickup booking | ❌ NO | Confirmed by product (Madan, 2026-11-18). Code: blocked for Norway, cancel unsupported. |
| Manifest | ❌ NO | `closeAndGenerateManifest` is a pass-through. |
| Commercial invoice / app-generated customs documents | ❌ NO | Confirmed by product. Do not say "customs documents" or "commercial invoice". |
| Delivery Options API / ETAs at checkout | ❌ NO | Flag-gated (ZI-599, ZI-634). |
| Label + CN22 on one page | ❌ NO | Proposed only (ZI-480). |
| Connect account in app | ✅ | Carrier form: Party ID Type, Party ID, Country of Origin, production toggle (postNord.js; carrierRequiredFields.js). KB: "How to register for a PostNord account" |
| Service Point | ✅ | KB `shopify-postnord-service-point.md`: enable **PostNord Service Point** under carrier **Other Details** → add the app's **Pick-up Locations** block to the cart page in the theme editor → buyer enters country + postal code and picks a service point → it shows on the order under **Local Pickup Location Details** → generate the label. Fallback automation "Set Default Service Point For PostNord" (ZI-517). |
| Insurance | ✅ | add-on `Insurance` (A5), plus Insurance DK (62) and ROW (61) — carrierSelectFieldOptions.js |
| Confirmation of Delivery | ✅ | add-on `Confirmation of Delivery / Utlämningsavisering` (C6) |
| Rek + Faktura (FE) + Utökat ansvar (UA) | ✅ | service RR Rek / RK Rek Retur. Add-ons FE "Faktura, utan inlämningsunderlag" and UA "Utökat ansvar". FE is auto-added on Rek Retur (postNordRequestBuilder.js:322-330) |
| Returns | ✅ | `createReturnShipment`, **Return Label Type** setting (postNord.js:610). PostNord return labels tested with a customer (ZI-056). Note: not every destination is supported. |
| CN22 / CN23 | ✅ (wording!) | The CN22/CN23 declaration data (items, HS code, origin, value, category) is sent to PostNord with the shipment; the app picks CN22 vs CN23 per service (postNordRequestBuilder.js:878-908). Setting: **Select category of item for CN22-CN23 doc**. Per order: CN23 details and quarantine comments in **PostNord Additional Setting**. Say "customs declaration", never "customs documents". |
| Tax IDs | ✅ | Setup KB: Tax IDs section "available only for PostNord, Sendle, and Amazon Shipping" |
| Apply add-ons automatically | ✅ | automation action "Add PostNord special services" |
| Bulk labels | ✅ | generic app flow |
| Tracking sync + emails | ✅ | `makeTrackingRequest`; generic fulfilment flow |

## Video structure (5 chapters, not 6)
1. Install the app
2. Connect your PostNord account
3. Set up PostNord shipping (packaging, products, services, service point on cart page)
4. Print PostNord shipping labels (add-ons, Rek, returns, international)
5. Fulfil & track orders

Dropped compared with UPS: live rates and the checkout demo, the pickup chapter, manifest, commercial invoice, paperless invoice.

## Open questions
1. CN22/CN23: does the merchant get a CN22/CN23 PDF from PostNord (ZI-480 implies a separate PDF today), or should we only say "sent electronically"? **Answered by marketing's capture (2026-11-20):** Print Documents → All gives the label plus a CN22 page ("International tracked letter", order #1029), so script v3 keeps "creates the customs form along with it".
2. Is FE auto-added on Rek for all stores (`postNord.rek.service.default.value`)? Script v2 says "combine", not "automatically".
3. Demo store origin: Sweden (Rek, FE/UA, Swedish add-on names) — confirm.

## Notes from marketing's raw captures (2026-11-20)
- Print Settings has no CN22/CN23 option (only Label, Commercial Invoice, etc.), so the CN22/CN23 step is shown in
  Add PostNord Special Services → "Category of Item for CN22-CN23" instead.
- The account form is Country of Origin / Party ID Type / Party ID / Production Key (no API key).
- The QA app's Pickup tab lists a PostNord order after Request Pickup. Product said pickup is not supported, so the
  video leaves it out — confirm with product whether that changed.
- The fulfil clip shows "Manifest initiated" toasts (manifest is not supported); they are blurred in the video.
