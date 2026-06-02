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

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, `hsl(260, 20%, ${8 + volume * 8}%)`);
    skyGrad.addColorStop(0.6, `hsl(260, 15%, ${6 + volume * 6}%)`);
    skyGrad.addColorStop(1, `hsl(240, 10%, ${4 + bass * 5}%)`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Ground
    ctx.fillStyle = `hsl(140, ${15 + bass * 15}%, ${3 + bass * 8}%)`;
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 20, w * 0.7 + bass * 80, 50 + bass * 30, 0, Math.PI, 0);
    ctx.fill();

    // Grass blades
    const grassCount = Math.floor(10 + bass * 20);
    for (let i = 0; i < grassCount; i++) {
      const gx = w / 2 + (i - grassCount / 2) * (12 + bass * 8) + Math.sin(i * 2.7 + frame * 0.01) * 8;
      const gy = h - 10 - Math.random() * 5;
      const gh = 10 + bass * 25 + Math.sin(i * 1.3 + frame * 0.015) * 8;
      ctx.strokeStyle = `hsla(${120 + Math.random() * 40}, ${40 + bass * 30}%, ${8 + bass * 15}%, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + (i % 2 ? 4 : -4), gy - gh * 0.6, gx + (i % 2 ? 6 : -6), gy - gh);
      ctx.stroke();
    }

    const trunkW = 12 + bass * 25 * sensitivity;
    const maxDepth = Math.min(6, Math.floor(3 + (lowMid + mid) * 4 * sensitivity));

    // Trunk (wider at bottom)
    ctx.strokeStyle = `hsl(20, 40%, ${10 + bass * 8}%)`;
    ctx.lineWidth = trunkW;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    const trunkTop = h - 70 - volume * 100 * sensitivity;
    ctx.quadraticCurveTo(w / 2 - 4 + bass * 3, h - 35, w / 2 - 2, trunkTop);
    ctx.stroke();

    // Roots
    for (let i = -1; i <= 1; i += 2) {
      ctx.strokeStyle = `hsl(20, 30%, ${8 + bass * 5}%)`;
      ctx.lineWidth = trunkW * 0.3;
      ctx.beginPath();
      ctx.moveTo(w / 2, h - 5);
      ctx.quadraticCurveTo(w / 2 + i * trunkW * 2, h - 2, w / 2 + i * trunkW * 3.5, h - 15);
      ctx.stroke();
    }

    // Branch system
    const drawBranch = (x: number, y: number, depth: number, angle: number, len: number, width: number) => {
      if (depth <= 0) return;
      const endX = x + Math.sin(angle) * len;
      const endY = y - Math.cos(angle) * len;

      // Branch stroke
      ctx.strokeStyle = `hsl(${20 + depth * 8}, ${30 + depth * 5}%, ${8 + depth * 4 + bass * 4}%)`;
      ctx.lineWidth = Math.max(1.2, width);
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();

      // Sub-branches
      const subLen = len * 0.7;
      const subW = width * 0.65;
      const spread = 0.35 + bass * 0.25 + (1 - depth / maxDepth) * 0.2;
      drawBranch(endX, endY, depth - 1, angle - spread, subLen, subW);
      drawBranch(endX, endY, depth - 1, angle + spread, subLen, subW);

      // Foliage at branch tips
      if (depth <= 2) {
        const leafCount = Math.floor(3 + volume * 6);
        const leafSize = 3 + volume * 6 + mid * 4;
        for (let i = 0; i < leafCount; i++) {
          const lx = endX + Math.sin(i * 2.4 + frame * 0.03) * leafSize * 2;
          const ly = endY - Math.cos(i * 1.8 + frame * 0.02) * leafSize * 2;
          const hue = 80 + depth * 30 + treble * 60 + Math.sin(i * 2 + frame * 0.01) * 15;
          const sat = 50 + volume * 30 + mid * 20;
          const light = 25 + volume * 20 + depth * 5;
          ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.75)`;
          ctx.beginPath();
          ctx.arc(lx, ly, leafSize * (0.5 + Math.random() * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    drawBranch(w / 2, trunkTop, maxDepth, 0, 55 + volume * 45 * sensitivity, trunkW * 0.6);

    // Falling particles
    const partCount = Math.floor(volume * 15);
    for (let i = 0; i < partCount; i++) {
      const px = w / 2 + Math.sin(i * 1.7 + frame * 0.02) * (40 + volume * 60);
      const py = trunkTop + ((frame * 0.5 + i * 40) % (h - trunkTop));
      ctx.fillStyle = `hsla(${80 + treble * 60}, 60%, ${40 + volume * 30}%, 0.5)`;
      ctx.beginPath();
      ctx.arc(px, py, 1.5 + volume * 2, 0, Math.PI * 2);
      ctx.fill();
    }
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
