import { useRef, useEffect, useState, useCallback } from "react";
import { useAudioLoop } from "./hooks/useAudioLoop";
import { renderCanvas } from "./engine/renderer";

type Mode = "tree" | "wave" | "particles" | "circles";

const MODES: { id: Mode; label: string; emoji: string }[] = [
  { id: "tree", label: "Tree", emoji: "🌳" },
  { id: "wave", label: "Wave", emoji: "🌊" },
  { id: "particles", label: "Particles", emoji: "✦" },
  { id: "circles", label: "Circles", emoji: "◎" },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, start, stop } = useAudioLoop();
  const [mode, setMode] = useState<Mode>("tree");
  const [sensitivity, setSensitivity] = useState(1);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const obs = new ResizeObserver(() => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    });
    if (canvas) obs.observe(canvas.parentElement!);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const active = state.active;
    if (!canvas || !active) return;

    let id = 0;
    const loop = () => { frameRef.current++; renderCanvas(canvas, state, mode, frameRef.current, sensitivity); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [state, mode, sensitivity]);

  const toggleMic = useCallback(() => {
    (state.active ? stop : start)();
  }, [state.active, start, stop]);

  const isIdle = !state.active;

  return (
    <div className="relative h-screen flex flex-col bg-zinc-950 select-none">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {isIdle && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 backdrop-blur-sm">
            <p className="text-2xl font-light text-zinc-500 tracking-wide">Sound Garden</p>
            <p className="text-sm text-zinc-600">你的声音会变成一棵生长的树</p>
            <button onClick={toggleMic}
              className="mt-4 px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all duration-300 hover:scale-105">
              开启麦克风
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
              mode === m.id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}>{m.emoji} {m.label}</button>
        ))}

        <span className="w-px h-5 bg-zinc-800" />

        <span className="text-[10px] text-zinc-500 mr-2">Sensitivity</span>
        <input type="range" min={0.5} max={3} step={0.1} value={sensitivity}
          onChange={(e) => setSensitivity(Number(e.target.value))}
          className="slider w-20" />
        <span className="text-[10px] text-zinc-500 tabular-nums w-5">{sensitivity.toFixed(1)}</span>

        <span className="w-px h-5 bg-zinc-800" />

        <div className="flex items-center gap-2 text-zinc-500">
          <span className="text-[10px]">Vol</span>
          <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-rose-400 rounded-full transition-all duration-100"
              style={{ width: `${Math.min(100, state.volume * 120)}%` }} />
          </div>
        </div>

        <span className="w-px h-5 bg-zinc-800" />

        <button onClick={toggleMic}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
            state.active ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" : "bg-white/10 text-zinc-400 hover:bg-white/15"
          }`}>{state.active ? "⏹" : "🎤"}</button>
      </div>
    </div>
  );
}
