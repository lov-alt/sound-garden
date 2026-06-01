type FreqBand = "bass" | "lowMid" | "mid" | "highMid" | "treble";

export interface AudioState {
  bass: number; lowMid: number; mid: number; highMid: number; treble: number;
  volume: number; waveform: Float32Array;
  active: boolean;
}

const BAND_RANGES: Record<FreqBand, [number, number]> = {
  bass: [20, 140], lowMid: [140, 400], mid: [400, 1200],
  highMid: [1200, 4000], treble: [4000, 16000],
};

export function createAudioEngine() {
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let running = false;
  let stream: MediaStream | null = null;

  const freqData = new Uint8Array(512);
  const waveData = new Float32Array(128);

  const start = async (): Promise<void> => {
    ctx = new AudioContext();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.7;

    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
    source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    running = true;
  };

  const stop = () => {
    stream?.getTracks().forEach((t) => t.stop());
    source?.disconnect();
    ctx?.close();
    ctx = null; analyser = null; source = null; stream = null;
    running = false;
  };

  const getAverageInRange = (start: number, end: number): number => {
    if (!analyser) return 0;
    const binCount = analyser.frequencyBinCount;
    const binStart = Math.floor((start / 22050) * binCount);
    const binEnd = Math.ceil((end / 22050) * binCount);
    let sum = 0, count = 0;
    for (let i = binStart; i <= binEnd && i < freqData.length; i++) {
      sum += freqData[i];
      count++;
    }
    return sum / count / 255;
  };

  const getState = (): AudioState => {
    if (!analyser) return { bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0, volume: 0, waveform: new Float32Array(128), active: false };
    (analyser.getByteFrequencyData as any)(freqData);
    analyser.getFloatTimeDomainData(waveData);

    const bands: Partial<Record<FreqBand, number>> = {};
    for (const band of Object.keys(BAND_RANGES) as FreqBand[]) {
      bands[band] = getAverageInRange(...BAND_RANGES[band]);
    }

    const vol = Math.sqrt(waveData.reduce((s, v) => s + v * v, 0) / waveData.length);

    return {
      ...bands as Record<FreqBand, number>,
      volume: vol,
      waveform: new Float32Array(waveData),
      active: running,
    };
  };

  return { start, stop, getState };
}
