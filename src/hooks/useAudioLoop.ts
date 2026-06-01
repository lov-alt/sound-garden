import { useEffect, useRef, useState, useCallback } from "react";
import { createAudioEngine, type AudioState } from "../engine/audio";

export function useAudioLoop() {
  const engine = useRef(createAudioEngine());
  const raf = useRef(0);
  const [state, setState] = useState<AudioState>({
    bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0,
    volume: 0, waveform: new Float32Array(128), active: false,
  });

  const tick = useCallback(() => {
    setState(engine.current.getState());
    raf.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    await engine.current.start();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    engine.current.stop();
    setState((s) => ({ ...s, active: false, volume: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0 }));
  }, []);

  useEffect(() => () => { cancelAnimationFrame(raf.current); engine.current.stop(); }, []);

  return { state, start, stop };
}
