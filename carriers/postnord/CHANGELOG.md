# PostNord — changelog

## draft v2 — 2026-11-20 (marketing review 1)
- Voice: "PostNord" said as one word; a sentence split over two scenes is spoken in one take and
  played without a gap (address, carriers, products, service point, special services, tracking).
- Sync: account connect, generate/print, edit order, bulk labels and fulfil clips now move on the
  spoken words (engine `video.sync`).
- Print: cursor's trip to "All" cut; zoom + highlight on "Label" when the voice says it.
- Special services: search box reads "Add PostNord"; the Add PostNord Special Services option is highlighted.
- Demo data instead of blur: address form (Erik Lindqvist / 2125550147 / orders@yourstore.com), label and
  Shopify order recipient email/phone. Fulfil clip: manifest pop-ups cut instead of blurred.
- Products: line reordered ("In the app's Products section, you can add each product's weight and
  dimensions") so the menu shows on "Products section" and the product on "weight and dimensions".
- Carrier details: zoom on Other Details (bottom-left). Customs intro: product page + Edit Customs instead of the menu.
- Tracking email: dev-store header removed, broken "Shop" button replaced with "Track your order", zoomed in.
- Account clip ends before the browser bookmarks bar (WooCommerce bookmark); bulk clip too.
- Brand: crisp redrawn app icon; Shopify bag + white "Shopify" instead of green text; hook bubbles kept inside the frame.

## draft v1 — 2026-11-20
- Script v3: marketing's script (reference/PostNord_script_marketing.txt) with fixes to match the app:
  Party ID fields instead of Customer Number + API key; CN22/CN23 category set in Add PostNord Special
  Services (Print Settings has no CN22/CN23 option); pickup section removed (not supported); intro/fulfil
  lines adjusted; "Confirmation of Delivery" as named in the app.
- Captures: marketing raw files (QA app) copied to capture/ with hand-measured boxes (review/setup_captures.py).
  App name and icon patched to "PH MultiCarrier Shipping Label" on every app screen (engine `patches`).
  UPS stepper label patched to PostNord on the packaging screens.
- Blurs: address-form person/phone/email/street, edit-order phone/email, recipient email on label screens,
  Shopify customer email/phone, "Manifest initiated" toasts on the fulfil clip.
- Voiceover: Kokoro af_heart (tools/tts.py), word-timed highlights.
- carrier.yaml: review count 656 (as on the App Store listing in the install capture).
