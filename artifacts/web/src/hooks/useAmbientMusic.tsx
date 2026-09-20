import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type AmbientEngine = {
  context: AudioContext;
  master: GainNode;
  timer: number;
  nextNoteTime: number;
  step: number;
};

type AmbientMusicContextValue = {
  enabled: boolean;
  playing: boolean;
  play: () => void;
  toggle: () => void;
  setRouteMuted: (muted: boolean) => void;
};

const AmbientMusicContext = createContext<AmbientMusicContextValue | null>(null);
const STORAGE_KEY = "gtf-ambient-music-muted";
const BPM = 72;
const STEP_DURATION = 60 / BPM;

const chordRoots = [146.83, 130.81, 174.61, 164.81];
const chordVoicings = [
  [0, 3, 7, 12],
  [0, 4, 7, 11],
  [0, 3, 7, 10],
  [0, 4, 7, 12],
] as const;
const melody = [
  7, null, 10, 12, null, 10, 7, null,
  5, null, 3, 5, 7, null, 10, null,
  7, null, 10, 12, 14, 12, 10, null,
  7, 5, 3, null, 5, 7, 3, null,
] as const;

function audioConstructor() {
  return (
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  ) as typeof AudioContext | undefined;
}

function frequencyFromOffset(root: number, semitones: number, octave = 1) {
  return root * octave * 2 ** (semitones / 12);
}

function playTone(
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  peak: number,
  type: OscillatorType,
  detune = 0,
) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.detune.value = detune;
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.08, duration * 0.2));
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function scheduleStep(engine: AmbientEngine, step: number, start: number) {
  const { context, master } = engine;
  const chordIndex = Math.floor(step / 8) % chordRoots.length;
  const root = chordRoots[chordIndex];
  const offset = melody[step % melody.length];

  if (step % 8 === 0) {
    chordVoicings[chordIndex].forEach((chordOffset, index) => {
      playTone(
        context,
        master,
        frequencyFromOffset(root, chordOffset, 0.5),
        start,
        STEP_DURATION * 7.6,
        0.018 - index * 0.002,
        index === 0 ? "sine" : "triangle",
        index % 2 === 0 ? -4 : 4,
      );
    });
  }

  if (offset !== null) {
    const note = frequencyFromOffset(root, offset, 2);
    playTone(context, master, note, start, STEP_DURATION * 0.78, 0.055, "triangle");
    playTone(context, master, note * 2, start + 0.015, STEP_DURATION * 0.42, 0.012, "sine", -5);
  }

  if (step % 4 === 0) {
    playTone(context, master, frequencyFromOffset(root, step % 8 === 0 ? 0 : 7, 0.5), start, STEP_DURATION * 1.6, 0.03, "sine");
  }

  if (step % 8 === 4) {
    playTone(context, master, frequencyFromOffset(root, 19, 3), start, STEP_DURATION * 0.5, 0.016, "sine", 7);
  }
}

function createAmbientEngine(): AmbientEngine | null {
  const Constructor = audioConstructor();
  if (!Constructor) return null;

  const context = new Constructor();
  const master = context.createGain();
  const warmth = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();

  master.gain.value = 0.11;
  warmth.type = "lowpass";
  warmth.frequency.value = 5600;
  warmth.Q.value = 0.55;
  compressor.threshold.value = -24;
  compressor.knee.value = 20;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.02;
  compressor.release.value = 0.3;

  master.connect(warmth);
  warmth.connect(compressor);
  compressor.connect(context.destination);

  return {
    context,
    master,
    timer: 0,
    nextNoteTime: context.currentTime + 0.06,
    step: 0,
  };
}

function fillSchedule(engine: AmbientEngine) {
  while (engine.nextNoteTime < engine.context.currentTime + 1.2) {
    scheduleStep(engine, engine.step, engine.nextNoteTime);
    engine.nextNoteTime += STEP_DURATION;
    engine.step += 1;
  }
}

function startEngine(engine: AmbientEngine) {
  if (engine.context.state === "suspended") void engine.context.resume();
  if (engine.timer) return;
  fillSchedule(engine);
  engine.timer = window.setInterval(() => fillSchedule(engine), 120);
}

function pauseEngine(engine: AmbientEngine) {
  if (engine.timer) {
    window.clearInterval(engine.timer);
    engine.timer = 0;
  }
  void engine.context.suspend();
}

function readMutedPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeMutedPreference(muted: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // Private browsing can disable localStorage; audio still works for this session.
  }
}

export function AmbientMusicProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => !readMutedPreference());
  const [playing, setPlaying] = useState(false);
  const [routeMuted, setRouteMutedState] = useState(false);
  const engineRef = useRef<AmbientEngine | null>(null);

  const play = useCallback(() => {
    if (routeMuted) return;
    const engine = engineRef.current ?? createAmbientEngine();
    if (!engine) return;
    engineRef.current = engine;
    startEngine(engine);
    setEnabled(true);
    setPlaying(true);
    writeMutedPreference(false);
  }, [routeMuted]);

  const pause = useCallback(() => {
    if (engineRef.current) pauseEngine(engineRef.current);
    setPlaying(false);
    setEnabled(false);
    writeMutedPreference(true);
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      pause();
    } else {
      play();
    }
  }, [pause, play, playing]);

  const setRouteMuted = useCallback((muted: boolean) => {
    setRouteMutedState(muted);
  }, []);

  useEffect(() => {
    if (routeMuted) {
      if (engineRef.current && playing) {
        pauseEngine(engineRef.current);
        setPlaying(false);
      }
      return;
    }
    if (enabled && !playing) {
      if (engineRef.current) {
        play();
        return undefined;
      }
      const resumeAfterGesture = () => play();
      window.addEventListener("click", resumeAfterGesture, { once: true });
      window.addEventListener("keydown", resumeAfterGesture, { once: true });
      return () => {
        window.removeEventListener("click", resumeAfterGesture);
        window.removeEventListener("keydown", resumeAfterGesture);
      };
    }
    return undefined;
  }, [enabled, play, playing, routeMuted]);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        if (engineRef.current.timer) window.clearInterval(engineRef.current.timer);
        void engineRef.current.context.close();
      }
    };
  }, []);

  const value = useMemo(
    () => ({ enabled, playing, play, toggle, setRouteMuted }),
    [enabled, play, playing, setRouteMuted, toggle],
  );

  return <AmbientMusicContext.Provider value={value}>{children}</AmbientMusicContext.Provider>;
}

export function useAmbientMusic() {
  const context = useContext(AmbientMusicContext);
  if (!context) throw new Error("useAmbientMusic must be used inside AmbientMusicProvider");
  return context;
}