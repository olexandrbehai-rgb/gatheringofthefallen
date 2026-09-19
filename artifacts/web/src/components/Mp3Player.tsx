import { Pause, Play, RotateCcw, SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Mp3PlayerProps = {
  src: string;
  title: string;
  durationSeconds?: number | null;
};

const EQ_FREQUENCIES = [80, 250, 1000, 4000, 10000];
const EQ_LABELS = ["БАС", "ТІЛО", "СЕРЕДИНА", "АТАКА", "ВЕРХ"];

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function Mp3Player({ src, title, durationSeconds }: Mp3PlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [volume, setVolume] = useState(0.9);
  const [equalizer, setEqualizer] = useState(EQ_FREQUENCIES.map(() => 0));
  const [error, setError] = useState<string | null>(null);

  const setupAudioGraph = () => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;

    const AudioContextConstructor = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;
    if (!AudioContextConstructor) {
      setError("Цей браузер не підтримує аудіоефекти.");
      return;
    }

    const context = new AudioContextConstructor();
    const source = context.createMediaElementSource(audio);
    const filters = EQ_FREQUENCIES.map((frequency, index) => {
      const filter = context.createBiquadFilter();
      filter.type = index === 0 ? "lowshelf" : index === EQ_FREQUENCIES.length - 1 ? "highshelf" : "peaking";
      filter.frequency.value = frequency;
      filter.Q.value = index === 0 || index === EQ_FREQUENCIES.length - 1 ? 0.7 : 1;
      return filter;
    });
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;

    source.connect(filters[0]);
    filters.slice(1).forEach((filter, index) => filters[index].connect(filter));
    filters.at(-1)?.connect(analyser);
    analyser.connect(context.destination);
    audioContextRef.current = context;
    analyserRef.current = analyser;
    filtersRef.current = filters;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    return () => {
      audio.pause();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    const draw = () => {
      const width = canvas.clientWidth || 600;
      const height = canvas.clientHeight || 110;
      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(0, 240, 255, 0.2)");
      gradient.addColorStop(0.5, "rgba(138, 43, 226, 0.18)");
      gradient.addColorStop(1, "rgba(255, 173, 127, 0.15)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const analyser = analyserRef.current;
      const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
      if (data && analyser) analyser.getByteFrequencyData(data);
      const bars = 44;
      const gap = 3;
      const barWidth = Math.max(2, (width - gap * (bars - 1)) / bars);
      for (let index = 0; index < bars; index += 1) {
        const sourceIndex = data ? Math.min(data.length - 1, Math.floor((index / bars) * data.length * 0.7)) : 0;
        const idle = 0.12 + Math.abs(Math.sin((Date.now() / 900) + index * 0.7)) * 0.08;
        const level = data ? Math.max(idle, (data[sourceIndex] ?? 0) / 255) : idle;
        const barHeight = Math.max(3, level * height * 0.82);
        const x = index * (barWidth + gap);
        const y = height - barHeight;
        context.fillStyle = index % 3 === 0 ? "#00f0ff" : index % 3 === 1 ? "#8a2be2" : "#ffad7f";
        context.globalAlpha = 0.58 + level * 0.42;
        context.fillRect(x, y, barWidth, barHeight);
      }
      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    };
    draw();
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    setupAudioGraph();
    if (audioContextRef.current?.state === "suspended") await audioContextRef.current.resume();
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setError("Не вдалося відтворити MP3.");
      }
    } else {
      audio.pause();
    }
  };

  const updateEqualizer = (index: number, value: number) => {
    setEqualizer((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
    const filter = filtersRef.current[index];
    if (filter) filter.gain.value = value;
  };

  const resetEqualizer = () => {
    EQ_FREQUENCIES.forEach((_, index) => {
      const filter = filtersRef.current[index];
      if (filter) filter.gain.value = 0;
    });
    setEqualizer(EQ_FREQUENCIES.map(() => 0));
  };

  return (
    <div className="border border-[#00f0ff]/35 bg-[#020811]/90 p-3 shadow-[inset_0_0_24px_rgba(0,240,255,0.06)]">
      <audio
        ref={audioRef}
        src={src}
        crossOrigin="anonymous"
        preload="metadata"
        onLoadedMetadata={(event) => {
          setIsReady(true);
          setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : durationSeconds ?? 0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => setError("Цей MP3 тимчасово недоступний.")}
      />
      <div className="relative overflow-hidden border border-white/10 bg-black/30">
        <canvas ref={canvasRef} className="h-24 w-full" aria-label={`Візуалізація звуку: ${title}`} />
        <span className="pointer-events-none absolute inset-x-3 top-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.18em] text-white/45">
          <span>MP3 // LIVE SPECTRUM</span>
          <span>{isPlaying ? "PLAYING" : "READY"}</span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={() => void togglePlay()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#b9f7ff] shadow-[0_0_14px_rgba(0,240,255,0.2)] hover:bg-[#00f0ff]/20" aria-label={isPlaying ? `Пауза: ${title}` : `Відтворити: ${title}`}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#b9f7ff]">{title}</p>
          <input type="range" min={0} max={Math.max(duration, 0.01)} step="0.01" value={Math.min(currentTime, duration || 0)} onChange={(event) => {
            const next = Number(event.target.value);
            if (audioRef.current) audioRef.current.currentTime = next;
            setCurrentTime(next);
          }} className="mt-2 h-1 w-full accent-[#00f0ff]" aria-label={`Позиція у треку ${title}`} />
          <div className="mt-1 flex justify-between font-mono text-[9px] text-white/45">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button type="button" onClick={() => {
          const next = volume > 0 ? 0 : 0.9;
          setVolume(next);
          if (audioRef.current) audioRef.current.volume = next;
        }} className="text-[#b9f7ff] hover:text-white" aria-label={volume > 0 ? "Вимкнути звук" : "Увімкнути звук"}>
          {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">{isReady ? "Готово до відтворення" : "Завантаження метаданих..."}</span>
        <button type="button" onClick={() => setShowEqualizer((value) => !value)} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#d7b6ff] hover:text-white">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Еквалайзер
        </button>
      </div>
      {showEqualizer && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#ffad7f]">Особистий звук слухача</span>
            <button type="button" onClick={resetEqualizer} className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-white/50 hover:text-white">
              <RotateCcw className="h-3 w-3" /> Скинути
            </button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {equalizer.map((value, index) => (
              <label key={EQ_FREQUENCIES[index]} className="flex flex-col items-center gap-1">
                <input type="range" min="-12" max="12" step="1" value={value} onChange={(event) => updateEqualizer(index, Number(event.target.value))} className="h-16 accent-[#8a2be2] [writing-mode:vertical-lr] [direction:rtl]" aria-label={`${EQ_LABELS[index]} еквалайзера`} />
                <span className="font-mono text-[8px] text-white/45">{EQ_LABELS[index]}</span>
                <span className="font-mono text-[8px] text-[#8ceeff]">{value > 0 ? "+" : ""}{value}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 font-mono text-[10px] text-[#ffb184]">{error}</p>}
    </div>
  );
}