# QA Checklist (release gate)

`python3 tools/qa_check.py <carrier>` covers the ✅auto items; the rest are reviewed on the contact sheet
(`carriers/<code>/review/contact_sheet.jpg`) and the draft itself.

Every item traces back to a review note: see `docs/REVIEW_LESSONS.md` (`#n` below).

## Content
- [ ] ✅auto Every `shots.yaml` scene has narration in `script.md`, and vice versa
- [ ] ✅auto Every `source`, box name and audio file referenced exists
- [ ] Every feature claim is backed by the Domain Expert carrier docs (`brief.md` lists the source)
- [ ] Narration matches `script.md` word for word (listen to the draft)
- [ ] Screen matches the words: every named block/button is on screen and highlighted when spoken, in screen order (#24, #26, #27)
- [ ] Clips move with the voice (no click before or long after its word); nothing feels rushed (#2, #23)
- [ ] Confirmation messages are readable and highlighted where mentioned (#29)
- [ ] Intro lists only the main features; no feature outside `brief.md` (#15, #20)
- [ ] Tracking dashboard shows a real Delivered status (or the gap is noted in CHANGELOG) (#19)
- [ ] Currency, units and origin match the carrier's market (#18, #34)

## Brand
- [ ] ✅auto OCR: no "QA-MultiCarrier" / "QA MultiCarrier" anywhere in the render
- [ ] ✅auto PluginHive logo (all white) on every scene; Shopify + carrier logos on title and closing cards (#14, #33, #38) — props warns if the carrier logo file is missing
- [ ] No opening hook: the video starts on "In this video" (#21)
- [ ] Only the live app under Apps in the Shopify sidebar (#16)
- [ ] One highlight colour; no highlight while zooming; no ripples/tags
- [ ] Chapter pill text matches the chapter

## Privacy
- [ ] ✅auto OCR: no e-mail address or phone-number pattern visible unblurred
- [ ] Carrier account numbers, usernames, passwords blurred or fake
- [ ] Card details / saved-card pop-ups blurred

## Clean screens
- [ ] No browser chrome: tabs, address bar, bookmarks bar (#10, #32)
- [ ] No dev-store banners, broken buttons or error text left on screen (#9)
- [ ] Search boxes empty unless the voice says what is typed (#25)
- [ ] Shopify's Sidekick bar left as is (not hidden) (#12, #35)

## Technical
- [ ] ✅auto No flicker between screens (hard cuts between app screens) — watch every screen-to-screen cut once (#37)
- [ ] ✅auto Final is 3840x2160, 30 fps, H.264 + AAC, loudness −16 LUFS ±1
- [ ] ✅auto No black/frozen gaps > 1 s outside intended holds
- [ ] Audio and highlights in sync (spot-check 5 highlights)
- [ ] `CHANGELOG.md` updated with version + what changed
