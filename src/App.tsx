import { useRef, useEffect, useState, useCallback } from "react";
import { useAudioLoop } from "./hooks/useAudioLoop";
import { renderCanvas } from "./engine/renderer";
import type { AudioState } from "./engine/audio";

type Mode = "tree" | "wave" | "particles" | "circles";

const MODES: { id: Mode; label: string; emoji: string }[] = [
  { id: "tree", label: "Tree", emoji: "🌳" },
  { id: "wave", label: "Wave", emoji: "🌊" },
  { id: "particles", label: "Particles", emoji: "✦" },
  { id: "circles", label: "Circles", emoji: "◎" },
];

const idleState: AudioState = {
  bass: 0.4, lowMid: 0.3, mid: 0.25, highMid: 0.15, treble: 0.1,
  volume: 0.35, waveform: new Float32Array(128), active: false,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, start, stop } = useAudioLoop();
  const [mode, setMode] = useState<Mode>("tree");
  const [sensitivity, setSensitivity] = useState(1.3);

  const stateRef = useRef(state);
  const modeRef = useRef(mode);
  const sensRef = useRef(sensitivity);
  stateRef.current = state;
  modeRef.current = mode;
  sensRef.current = sensitivity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    });
    obs.observe(canvas.parentElement!);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let id = 0;

    const loop = () => {
      frame++;
      const s = stateRef.current;
      const active = s.active ? s : {
        ...idleState,
        volume: idleState.volume + Math.sin(frame * 0.02) * 0.15,
        bass: idleState.bass + Math.sin(frame * 0.025) * 0.1,
        mid: idleState.mid + Math.sin(frame * 0.03) * 0.08,
      };
      renderCanvas(canvas, active, modeRef.current, frame, sensRef.current);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const toggleMic = useCallback(() => {
    (state.active ? stop : start)();
  }, [state.active, start, stop]);

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-950 select-none">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

        {!state.active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <p className="text-2xl font-light text-white/80 tracking-wide">Sound Garden</p>
            <p className="text-sm text-zinc-400">你的声音会变成一棵生长的树</p>
          </div>
        )}

        {!state.active && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto">
            <button onClick={toggleMic}
              className="px-10 py-4 rounded-2xl bg-green-500/20 hover:bg-green-500/30 ring-1 ring-green-500/40 hover:ring-green-500/60 text-green-400 font-medium text-lg transition-all duration-300 hover:scale-105 animate-pulse shadow-lg shadow-green-500/10">
              🎤 开启麦克风
            </button>
          </div>
        )}
      </div>

      {state.active && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                mode === m.id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}>{m.emoji} {m.label}</button>
          ))}

          <span className="w-px h-5 bg-zinc-800" />

          <span className="text-[10px] text-zinc-500">Sensitivity</span>
          <input type="range" min={0.5} max={3} step={0.1} value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="slider w-20" />

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
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all duration-200">⏹</button>
        </div>
      )}
    </div>
  );
}
