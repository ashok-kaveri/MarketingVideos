# PostNord — feature brief

Code refs are in `~/Documents/storepep-react/storepepSAAS` (synced b5f78c270, 2026-11-12).
Wiki refs are in `~/Documents/mcsl-wiki/wiki/product/stories/`.

## Account connection (chapter 02)
No OAuth and no carrier-hosted login. The merchant fills in the PostNord carrier form in the app:
carrier name, **Party ID Type** and **Party ID** (PostNord customer number), Country of Origin,
then switches on the production key.
- Source: `client/src/components/form/settings/carriers/postNord.js` (partyIdType, partyId, productionKey)
- Source: `server/src/shared/settings/carrierRequiredFields.js` › postNordRequiredFields
- Blur: Party ID, account number, bank / SWIFT (COD details) if visible.

## Features requested by product (all confirmed in code)
| Feature | What the app does | Code / UI name | Source |
|---|---|---|---|
| Service Point | Buyer picks a PostNord service point at checkout. If they don't, the "Set Default Service Point For PostNord" automation picks the nearest one. "Optional service point" add-on (A7) | automation action `SET_DEFAULT_SERVICE_POINTS_FOR_POSTNORD`; add-on A7 | automationSelectFieldValues.js:35,68; carrierSelectFieldOptions.js; ZI-517 (documented fallback) |
| Insurance | PostNord insurance add-on per shipment | `Insurance` (A5 / ZIN), `Insurance ROW` (61), `Insurance DK` (62), `Tilläggsförsäkring` (30) | carrierSelectFieldOptions.js › getPostNordAdditionalServices |
| Confirmation on Delivery | Delivery confirmation notice | `Confirmation of Delivery / Utlämningsavisering` (C6); `Mottagningsbevis` (MB), `Mottagarkvittens` (KB) | same |
| Return | Return labels; return label type setting; return services | `Return Label Type` setting; services 24 Return Drop Off, RK Rek Retur; add-ons Prepared return F5, Förbetald retur 92, Return to Sender D1 | postNord.js:610; serviceCodeMapper.js; ZI-056 |
| Rek + Faktura (FE) | Rek (registered letter) sent with "Faktura, utan inlämningsunderlag" (FE). The app adds FE automatically on Rek Retur, and on Rek when the store default is on | service `RR` Rek, `RK` Rek Retur; add-ons FE, FS | postNordRequestBuilder.js:322-330; carrierSelectFieldOptions.js:739,749 |
| Rek + Utökat ansvar (UA) | Extended liability add-on for Rek | add-on `UA` | carrierSelectFieldOptions.js:734 |
| CN22 / CN23 | The app picks CN22 or CN23 automatically per service. Item category comes from carrier settings. CN23 document details and quarantine comments can be set per order | `Select category of item for CN22-CN23 doc`; "PostNord Additional Setting" dialog | postNordRequestBuilder.js:878-908; postNord.js:593; addPostNordSpecialServices.js |

How the merchant applies add-ons:
- **Per order or in bulk:** "PostNord Additional Setting" dialog (`addPostNordSpecialServices.js`).
- **Automatically:** automation action "Add PostNord special services".

## Other confirmed capabilities used in the script
- Real-time PostNord checkout rates (`frontEndRates/carriersList.js` lists PostNord).
- Pickup requests with pickup additional services, pickup time and company close time (`postNord.js:541-584`, `pickupRequestHelper.js`).
- Tracking status sync (`carrierBasedTrackingStatus.js`).

## Not to claim
- **Delivery Options API** (estimated delivery days at checkout): behind a per-account flag and not generally available (featureLoader.js:57; ZI-599, ZI-634).
- **Label and CN22 on a single page**: proposed only (ZI-480).
- **Country-specific HS codes**: a custom per-store feature (ZI-480), not standard.
- **Manifest**: PostNord returns no printable manifest (`closeAndGenerateManifest` is a pass-through). Skip the manifest scene.
- Service names change on 2027-01-01 (ZI-765), e.g. "Flexlevering" and the Home (17) postal-code block. Capture after that date, or avoid naming affected services on screen.

## Open questions for product / marketing
1. Which service should the checkout demo show: MyPack Collect (19, service point) or Home (17)?
2. Insurance: show A5 "Insurance" (generic) or Tilläggsförsäkring (30, SE)? It depends on the demo store's origin country. Proposed: Sweden.
3. Is the "Rek service default" store setting (`postNord.rek.service.default.value`) on for all stores, or per store? This decides whether the script says "automatically".
