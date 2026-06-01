<p align="center">
  <img src="public/favicon.svg" width="64" alt="Sound Garden" />
</p>

<h1 align="center">Sound Garden</h1>

<p align="center">
  <strong>Your voice grows a tree</strong><br/>
  Real-time microphone → generative visual landscape<br/>
  Web Audio API · Canvas · Zero dependencies
</p>

<p align="center">
  <a href="https://lov-alt.github.io/sound-garden/"><img src="https://img.shields.io/badge/demo-live-22c55e?style=flat-square" /></a>
  <a href="https://github.com/lov-alt/sound-garden/stargazers"><img src="https://img.shields.io/github/stars/lov-alt/sound-garden?style=flat-square&color=f59e0b" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/lov-alt/sound-garden?style=flat-square&color=6366f1" /></a>
</p>

---

## How it works

```
Microphone → 5-band frequency analysis → Canvas rendering → Your voice becomes visual
```

1. Click the mic button and allow microphone access
2. Make sound — speak, hum, sing, clap, play music
3. Watch your voice grow into trees, waves, particles, or circles
4. Switch modes with the floating toolbar

## Visual Modes

| Mode | Description | Best with |
|---|---|---|
| **Tree** | Recursive branches grow from your voice. Bass = trunk thickness, mid = branch count, treble = hue shift | Steady humming, talking |
| **Wave** | Real-time oscilloscope waveform. Centered, glowing. Most direct representation of sound | Any sound |
| **Particles** | Orbiting particles. Bass = orbit radius, volume = count + size, mid = rotation speed | Music, clapping |
| **Circles** | Five concentric rings mapping to five frequency bands. Bass = outer, treble = inner | Music with bass |

## Controls

- **Mode selector** — Tree / Wave / Particles / Circles
- **Sensitivity** — 0.5× to 3.0×, adjust for quiet or loud environments
- **Volume bar** — Real-time volume indicator
- **Mic toggle** — Start / stop the microphone

## Tech

- **Web Audio API** — `AudioContext` + `AnalyserNode` (FFT 1024) + `getByteFrequencyData`
- **5-band decomposition** — bass (20–140Hz) / lowMid (140–400Hz) / mid (400–1.2kHz) / highMid (1.2–4kHz) / treble (4–16kHz)
- **Canvas 2D** — `requestAnimationFrame` render loop at 60fps
- **ResizeObserver** — Responsive canvas, pixel-ratio aware
- **Zero runtime dependencies** — pure browser APIs

## Quick Start

```bash
git clone https://github.com/lov-alt/sound-garden.git
cd sound-garden
npm install
npm run dev          # http://localhost:5173
```

Open in a browser that supports `getUserMedia` (Chrome, Firefox, Edge, Safari).

## License

[MIT](./LICENSE) © 2026 lov-alt — Use freely, modify freely, distribute freely. Software provided "as is", without warranty of any kind.
