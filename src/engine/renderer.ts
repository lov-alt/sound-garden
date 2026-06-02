import type { AudioState } from "./audio";

type Mode = "tree" | "wave" | "particles" | "circles";

interface RenderCtx {
  ctx: CanvasRenderingContext2D; w: number; h: number;
  state: AudioState; mode: Mode;
  frame: number; sensitivity: number;
}

const MODE_RENDERERS: Record<Mode, (r: RenderCtx) => void> = {
  tree: ({ ctx, w, h, state, frame, sensitivity }) => {
    const { volume, bass, lowMid, mid, treble } = state;
    ctx.clearRect(0, 0, w, h);

    const trunkW = 8 + bass * 30 * sensitivity;
    const branches = Math.min(7, Math.floor(3 + (lowMid + mid) * 4 * sensitivity));

    ctx.strokeStyle = `hsl(25, ${40 + Math.floor(treble * 30)}%, ${15 + Math.floor(volume * 30)}%)`;
    ctx.lineWidth = trunkW;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.lineTo(w / 2, h - 60 - volume * 120 * sensitivity);
    ctx.stroke();

    const drawBranch = (x: number, y: number, depth: number, angle: number, len: number) => {
      if (depth <= 0) return;
      const hue = 25 + depth * 20 + treble * 40 + (frame % 60) * 0.1;
      const lightness = Math.max(5, 15 + depth * 5 - volume * 10);
      const endX = x + Math.sin(angle) * len;
      const endY = y - Math.cos(angle) * len;
      const width = trunkW * (depth / branches) * 0.5;

      ctx.strokeStyle = `hsl(${hue}, ${40 + depth * 5}%, ${lightness}%)`;
      ctx.lineWidth = Math.max(1, width);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();

      const spread = 0.4 + bass * 0.6;
      drawBranch(endX, endY, depth - 1, angle - spread * 0.5, len * 0.75);
      drawBranch(endX, endY, depth - 1, angle + spread * 0.5, len * 0.75);
    };

    const startY = h - 60 - volume * 120 * sensitivity;
    drawBranch(w / 2, startY, branches, 0, 60 + volume * 60 * sensitivity);
  },

  wave: ({ ctx, w, h, state, sensitivity }) => {
    const { waveform, volume } = state;
    ctx.clearRect(0, 0, w, h);

    const hue = 200 + (sensitivity - 1) * 100;
    ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const step = waveform.length / w;
    for (let x = 0; x < w; x++) {
      const idx = Math.floor(x * step);
      const y = h / 2 + waveform[idx] * h * 0.8 * sensitivity * 2;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    glow.addColorStop(0, `hsla(${hue}, 70%, 60%, ${volume * 0.3})`);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  },

  particles: ({ ctx, w, h, state, frame, sensitivity }) => {
    const { bass, mid, treble, volume } = state;
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, w, h);

    const count = Math.floor(8 + volume * 40 * sensitivity);
    for (let i = 0; i < count; i++) {
      const hue = i / count * 360 + frame * 2 + treble * 120;
      const angle = i / count * Math.PI * 2 + frame * 0.01 * (1 + mid * 2);
      const radius = 40 + bass * w * 0.3 * sensitivity + (i % 3) * 30 + Math.sin(frame * 0.05 + i) * 20;
      const x = w / 2 + Math.cos(angle) * radius;
      const y = h / 2 + Math.sin(angle) * radius;
      const size = 3 + volume * 14 * sensitivity * (1 + Math.sin(i) * 0.3);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${0.6 + volume * 0.4})`;
      ctx.fill();
    }
  },

  circles: ({ ctx, w, h, state, frame, sensitivity }) => {
    const { bass, lowMid, mid, highMid, treble } = state;
    ctx.clearRect(0, 0, w, h);

    const bands = [bass, lowMid, mid, highMid, treble];
    const hues = [280, 220, 180, 40, 0]; // purple → blue → teal → orange → red

    for (let i = bands.length - 1; i >= 0; i--) {
      const r = 30 + bands[i] * (w * 0.25 + i * 25) * sensitivity + Math.sin(frame * 0.03 + i) * 8;
      const alpha = 0.15 + bands[i] * 0.5 * sensitivity;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hues[i]}, 75%, 60%, ${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hues[i]}, 75%, 60%, ${alpha + 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  },
};

export function renderCanvas(
  canvas: HTMLCanvasElement,
  state: AudioState,
  mode: Mode,
  frame: number,
  sensitivity: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  const render = MODE_RENDERERS[mode] ?? MODE_RENDERERS.tree;
  render({ ctx, w, h, state, mode, frame, sensitivity });
}
