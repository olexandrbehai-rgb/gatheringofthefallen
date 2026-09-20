import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import firelightRoadsLoop from "@/assets/firelight-roads-loop.mp3";

type AmbientMusicContextValue = {
  enabled: boolean;
  playing: boolean;
  volume: number;
  play: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  setRouteMuted: (muted: boolean) => void;
};

const AmbientMusicContext = createContext<AmbientMusicContextValue | null>(null);
const STORAGE_KEY = "gtf-ambient-music-muted";
const VOLUME_STORAGE_KEY = "gtf-ambient-music-volume";
const DEFAULT_VOLUME = 0.32;

function createAudioElement(volume: number) {
  const audio = new Audio(firelightRoadsLoop);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = volume;
  return audio;
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

function readVolumePreference() {
  try {
    const stored = Number(window.localStorage.getItem(VOLUME_STORAGE_KEY));
    return Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

function writeVolumePreference(volume: number) {
  try {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  } catch {
    // Private browsing can disable localStorage; volume still works for this session.
  }
}

export function AmbientMusicProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => !readMutedPreference());
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(readVolumePreference);
  const [routeMuted, setRouteMutedState] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (routeMuted) return;
    const audio = audioRef.current ?? createAudioElement(volume);
    audioRef.current = audio;
    audio.volume = volume;
    void audio.play()
      .then(() => {
        setEnabled(true);
        setPlaying(true);
        writeMutedPreference(false);
      })
      .catch(() => {
        setPlaying(false);
      });
  }, [routeMuted, volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
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

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = Number.isFinite(nextVolume) ? Math.min(1, Math.max(0, nextVolume)) : DEFAULT_VOLUME;
    setVolumeState(safeVolume);
    if (audioRef.current) audioRef.current.volume = safeVolume;
    writeVolumePreference(safeVolume);
  }, []);

  const setRouteMuted = useCallback((muted: boolean) => {
    setRouteMutedState(muted);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [audioRef.current]);

  useEffect(() => {
    if (routeMuted) {
      if (audioRef.current && playing) {
        audioRef.current.pause();
        setPlaying(false);
      }
      return;
    }

    if (enabled && !playing) {
      if (audioRef.current) {
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const value = useMemo(
    () => ({ enabled, playing, volume, play, toggle, setVolume, setRouteMuted }),
    [enabled, play, playing, setRouteMuted, setVolume, toggle, volume],
  );

  return <AmbientMusicContext.Provider value={value}>{children}</AmbientMusicContext.Provider>;
}

export function useAmbientMusic() {
  const context = useContext(AmbientMusicContext);
  if (!context) throw new Error("useAmbientMusic must be used inside AmbientMusicProvider");
  return context;
}