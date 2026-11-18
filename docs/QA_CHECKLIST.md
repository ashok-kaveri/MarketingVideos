# QA Checklist (release gate)

`python3 tools/qa_check.py <carrier>` covers the ✅auto items; the rest are reviewed on the contact sheet
(`carriers/<code>/review/contact_sheet.jpg`) and the draft itself.

## Content
- [ ] ✅auto Every `shots.yaml` scene has narration in `script.md`, and vice versa
- [ ] ✅auto Every `source`, box name and audio file referenced exists
- [ ] Every feature claim is backed by the Domain Expert carrier docs (`brief.md` lists the source)
- [ ] Narration matches `script.md` word for word (listen to the draft)

## Brand
- [ ] ✅auto OCR: no "QA-MultiCarrier" / "QA MultiCarrier" anywhere in the render
- [ ] PluginHive logo on every scene; Shopify logo only where Shopify is spoken
- [ ] One highlight colour; no highlight while zooming; no ripples/tags
- [ ] Chapter pill text matches the chapter

## Privacy
- [ ] ✅auto OCR: no e-mail address or phone-number pattern visible unblurred
- [ ] Carrier account numbers, usernames, passwords blurred or fake
- [ ] Card details / saved-card pop-ups blurred

## Technical
- [ ] ✅auto Final is 3840x2160, 30 fps, H.264 + AAC, loudness −16 LUFS ±1
- [ ] ✅auto No black/frozen gaps > 1 s outside intended holds
- [ ] Audio and highlights in sync (spot-check 5 highlights)
- [ ] `CHANGELOG.md` updated with version + what changed
