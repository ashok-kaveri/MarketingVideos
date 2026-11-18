# Style Guide

Measured from the approved UPS reference video (`reference/ups/reference_final.mp4`).
All sizes are in the 1920x1080 design space; the final render doubles them (4K).

## Canvas
| Item | Value |
|---|---|
| Final output | 3840x2160, 30 fps, H.264, AAC 48 kHz, ~17 Mbps |
| Draft output | 1920x1080, 30 fps |
| Background | navy radial gradient: centre `#142858` → edge `#06122a`, two faint teal glows (top-left, bottom-right) |
| Safe margin | 48 px |

## Colour tokens (`engine/src/theme.ts` is the code copy)
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0f1e3f` | base navy |
| `--bg-deep` | `#06122a` | gradient edge |
| `--accent` | `#00d3e8` | emphasis words, ALL highlight boxes |
| `--accent-dim` | `#009ab4` | step-number pill, outlined chapter number |
| `--text` | `#ffffff` | titles on navy |
| `--text-muted` | `#9fb0cc` | sub-captions |
| `--card` | `#ffffff` | statement / app / support cards |

## Typography
- Font: Inter (fallback: SF Pro / system sans). Swap for marketing's font once provided in `brand/fonts/`.
- Title card: 64 px semibold, emphasis words in `--accent`.
- Chapter pill: 30 px medium, number in a 44 px `--accent-dim` circle.
- Chapter card: number 220 px outlined `--accent-dim`; "STEP 0X OF 06" 20 px caps `--accent`; title 56 px.
- Split-screen captions: 24 px medium, white, centred above each panel.

## Fixed chrome on every screen scene
- Chapter pill top-left at (48, 36): `( 03 ) Set up live UPS rates`.
- PluginHive logo top-right, 34 px tall, right edge at 1872.
- Screen frame: x 102–1818, y 104–1026, radius 12, soft shadow; media is `contain`-fitted inside.
- Shopify logo: only on scenes whose narration mentions Shopify (`shopify_logo: true` in shots.yaml).

## Motion
| Move | Timing |
|---|---|
| Scene cut | 8-frame cross-fade (0.27 s) |
| Zoom in / out | 18 frames (0.6 s), ease-in-out cubic |
| Zoom scale | auto-fit target to 70% of frame, clamped 1.3×–2.6× |
| Highlight appear | 8 frames: opacity 0→1, scale 1.04→1 |
| Highlight style | 3 px `--accent` stroke, radius 10, 8 px padding, outer glow 12 px @ 35% |
| Highlight timing | only after zoom-in completes and before zoom-out starts |
| Blur | gaussian 14 px, padded 6 px, rounded 6 |
| Fast-forward | "▶▶ 4x fast-forward" badge bottom-left whenever playback rate > 1.5 |
| Chapter card | 2.2 s: number slides in, title fades up |

## Never
- Click ripples, label tags, arrows, emojis on UI scenes.
- Multiple highlight colours.
- Highlights while zooming.
- QA app name/icon, real customer data, real UPS/FedEx account numbers.
