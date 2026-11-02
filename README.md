# NOCTIS — The Light in the Dark

A premium, minimal, single-page scrollytelling website for **NOCTIS**, an electric performance vehicle brand. 

> *Mood: A city in total blackout at night where the car's light is the only light in the world. Quiet, expensive, and precise: huge empty space, few words, perfect motion.*

---

## Technical Highlights

- **Pure Vanilla Stack**: Built with plain HTML5, CSS3, and vanilla JavaScript (ES6+). Zero frameworks, zero build tools, zero npm dependencies (no React, Vite, GSAP, Lenis, Tailwind).
- **Canvas-Scrubbed Scrollytelling**: Image sequences are rendered directly onto a `<canvas>` dynamically scaled with `devicePixelRatio` (capped at 2). Nearest-loaded frame fallback prevents frame flash during fast scrub.
- **Responsive Viewport Fitting**:
  - Landscape screens: Cover-fit centering.
  - Portrait screens: Contain-fit vertically centered on `--asphalt` (#07080A) background so vehicles are never cropped, flanked by text above and below.
- **Film Grain Overlay**: Fixed 256×256 offscreen noise tile shifted ~8 times per second at 3.5% opacity with `pointer-events: none`.
- **Custom Headlight Cursor**: 6px solid xenon dot inside a 28px ring with 1px stroke (lerp `0.18`). Morphs into a 44×2px horizontal light bar with contextual mono label (`VIEW`, `OPEN`, `CONFIGURE`, `RESERVE`) and a 120ms mousedown brightness pulse.
- **Progressive Preloader**: Loads critical initial frames (1–40) with a center-outward expanding xenon progress line and mono counter (`000%`–`100%`) before revealing the page; remaining hero and dismantle frames stream smoothly in background queues.
- **Interactive Model Accordion**: 5 full-height vertical slides with debounced hover (80ms), animated `flex-grow` transitions, swatch selection, and keyboard navigation.

---

## Design Tokens

- `--asphalt`: `#07080A` (Background)
- `--graphite`: `#121418`
- `--fog`: `#8A8F98`
- `--bone`: `#EDEAE4` (Text)
- `--xenon`: `#CFE3FF` (Light accent)
- `--taillight`: `#E1251B` (Telemetry / accent tick)
- `--hairline`: `rgba(237, 234, 228, 0.12)`

### Typography
- **Display**: Archivo variable font (`wdth 125`, weights 300/400, uppercase, letter-spacing `0.02em`)
- **Body**: Inter 400 (line-height 1.6, max 52ch)
- **HUD**: JetBrains Mono 400 (uppercase, letter-spacing `0.12em`)

### Architectural Rules
- Zero gradients (no linear, radial, or conic gradients)
- Zero glassmorphism (no blur, no backdrop-filter)
- Zero glows, drop shadows, or rounded bubbly cards
- Flat solid planes, photography, and 1px hairlines only

---

## File Structure

```text
├── assets/
│   ├── cars/                 # WebP 1600px studio lineup renders (GT-E, S, X, R, ONE)
│   └── frames/
│       ├── hero/             # 598 WebP frames (1600x900, quality 78)
│       ├── hero-mobile/      # 598 WebP frames (960x540, quality 72)
│       ├── dismantle/        # 200 WebP frames (1600x900, quality 78)
│       └── dismantle-mobile/ # 200 WebP frames (960x540, quality 72)
├── config.js                 # Tuning parameters, heights, chapters, callouts
├── index.html                # Semantic HTML structure & sticky canvas stages
├── main.js                   # Scrollytelling engine, cursor, preloader, audio/HUD
├── styles.css                # Architectural styling and typography
└── README.md
```

---

## Running Locally

Run directly with any static local HTTP server:

```bash
# Using Python
python3 -m http.server 3000

# Or open with VS Code Live Server extension
```

Navigate to [http://localhost:3000](http://localhost:3000).
