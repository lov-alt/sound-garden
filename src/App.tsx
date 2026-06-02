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

const idle: AudioState = {
  bass: 0.4, lowMid: 0.3, mid: 0.25, highMid: 0.15, treble: 0.1,
  volume: 0.35, waveform: new Float32Array(128), active: false,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, start, stop } = useAudioLoop();
  const [mode, setMode] = useState<Mode>("tree");
  const [sensitivity, setSensitivity] = useState(1.3);
  const [error, setError] = useState("");

  const sRef = useRef(state); const mRef = useRef(mode); const senRef = useRef(sensitivity);
  sRef.current = state; mRef.current = mode; senRef.current = sensitivity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio || window.innerWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio || window.innerHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0, rid = 0;
    const loop = () => {
      frame++;
      const s = sRef.current;
      const cur = s.active ? s : {
        ...idle,
        volume: idle.volume + Math.sin(frame * 0.02) * 0.12,
        bass: idle.bass + Math.sin(frame * 0.025) * 0.08,
        mid: idle.mid + Math.sin(frame * 0.03) * 0.06,
      };
      renderCanvas(canvas, cur, mRef.current, frame, senRef.current);
      rid = requestAnimationFrame(loop);
    };
    rid = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rid);
  }, []);

  const toggleMic = useCallback(async () => {
    setError("");
    if (state.active) return stop();
    try {
      await start();
    } catch (err: any) {
      setError(err?.message || "Microphone unavailable. Please allow access in your browser.");
    }
  }, [state.active, start, stop]);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#09090b", userSelect: "none" }}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

        {!state.active && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(9,9,11,0.85)" }}>
            <p style={{ fontSize: 28, fontWeight: 300, color: "#fff", margin: 0, letterSpacing: "0.02em" }}>Sound Garden</p>
            <p style={{ fontSize: 13, color: "#71717a", margin: 0 }}>Your voice grows a tree</p>
            <button onClick={toggleMic}
              style={{ marginTop: 16, padding: "14px 36px", borderRadius: 16, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
              🎤 Tap to Start
            </button>
            {error && <p style={{ fontSize: 12, color: "#ef4444", margin: 0, maxWidth: 300, textAlign: "center" }}>{error}</p>}
            <p style={{ fontSize: 10, color: "#52525b", margin: 0 }}>Requires microphone permission</p>
          </div>
        )}
      </div>

      {state.active && (
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 12, background: "rgba(24,24,27,0.95)", backdropFilter: "blur(20px)", border: "1px solid #27272a", borderRadius: 16, padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              style={{ padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none", background: mode === m.id ? "rgba(255,255,255,0.1)" : "transparent", color: mode === m.id ? "#fff" : "#71717a" }}>
              {m.emoji} {m.label}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: "#27272a" }} />
          <span style={{ fontSize: 10, color: "#52525b" }}>Sensitivity</span>
          <input type="range" min={0.5} max={3} step={0.1} value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            style={{ width: 72, cursor: "pointer", accentColor: "#6366f1" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#52525b" }}>Vol</span>
            <div style={{ width: 56, height: 3, background: "#27272a", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #6366f1, #ec4899)", borderRadius: 99, width: `${Math.min(100, state.volume * 120)}%`, transition: "width 0.1s" }} />
            </div>
          </div>
          <button onClick={toggleMic}
            style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(239,68,68,0.15)", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14 }}>
            ⏹
          </button>
        </div>
      )}
    </div>
  );
}
