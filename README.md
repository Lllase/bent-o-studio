# Bento Studio

Generate, customize and export bento-grid layouts that mix still images and motion (video, GIF, Lottie).

A static site: plain HTML, CSS and JavaScript, no build step.

## Features

- Cell count, gap, padding, corner radius and four layout algorithms (Balanced, Hero left, Editorial, Asymmetric)
- Drag the seams between cells to resize; drag one cell onto another to swap
- Drop images, video, GIF or Lottie JSON into any cell; per-cell fit, speed, surface and text overlay
- Frames: Desktop, iPad, iPhone 16, and Instagram / LinkedIn / X social formats, with safe areas
- Export code as HTML + Tailwind, CSS Grid or React, or export an image (JPEG, PNG) or video (MP4, up to 15 s) at 1080 or 4K
- Keyboard accessible: sliders, cells and seams respond to the keyboard

## Run locally

Serve the folder with any static server:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Files

| File         | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| `index.html` | Page shell, export dialog                                 |
| `styles.css` | Design tokens and component styles                        |
| `app.js`     | State, layout algorithm, rendering, exporters, interaction |

Fonts (Geist, JetBrains Mono) load from Google Fonts and `lottie-web` from cdnjs, so an internet connection is needed.
