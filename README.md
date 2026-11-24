# NOVAL HD Studio

**Your Video. Maximum Quality.**

NOVAL HD Studio is a browser-based video workflow for preparing creator videos, with a focus on TikTok-friendly exports. The first milestone includes a responsive studio interface, local video preview and an FFmpeg WebAssembly H.264/MP4 export path.

## Current milestone

- [x] Premium dark studio UI and responsive layout
- [x] Drag-and-drop / file picker for MP4, MOV, MKV and WebM
- [x] Local source preview and basic metadata
- [x] Quality profiles and output controls
- [x] Browser-side FFmpeg WebAssembly export to MP4 (H.264 + AAC)
- [ ] Multiple-file queue
- [ ] H.265 / AV1 support after validating the selected FFmpeg build
- [ ] Advanced TikTok aspect-ratio and crop controls
- [ ] Double Vision comparison mode
- [ ] Export history and performance safeguards

## Requirements

- Node.js 20.19+ or 22.12+
- A modern desktop browser
- Internet connection on first load to fetch the FFmpeg WebAssembly core

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

Create a production build:

```bash
npm run build
npm run preview
```

## Notes

- Video processing runs in the browser; the source file is not sent to a NOVAL backend.
- Browser memory and CPU limits apply. Large 4K files can be slow or fail on devices with limited RAM.
- The initial transcoder exports H.264 in an MP4 container. It does not currently preserve every HDR / Dolby Vision metadata path.
- TikTok may re-encode uploaded videos. NOVAL HD Studio can prepare a high-quality source but cannot guarantee bypassing platform recompression.
- The current resolution option scales down to a maximum long-edge target; it never upscales a smaller source.

## Project structure

```text
noval-hd-studio/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    └── lib/
        └── ffmpeg.js
```
