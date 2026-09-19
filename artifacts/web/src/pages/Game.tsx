import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crosshair, Expand, FastForward, Heart, Maximize2, Pause, Play, Shield, Volume2, VolumeX, Gamepad2, X } from "lucide-react";
import { Link } from "wouter";
import { GameCanvas, type GameHud, type GameInput } from "@/game/GameCanvas";
import { GAME_LEVELS } from "@/game/gameData";

function IconButton({
  label,
  children,
  onClick,
  pressed,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center border border-[#b59d84]/25 bg-[#120f12]/80 text-[#cdbda9] transition-colors hover:border-[#d98c4d]/75 hover:bg-[#251820] hover:text-[#f1c68c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98c4d]/70"
    >
      {children}
    </button>
  );
}

function TouchButton({
  label,
  children,
  active,
  onPressStart,
  onPressEnd,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  active?: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPressStart();
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        onPressEnd();
      }}
      onPointerCancel={onPressEnd}
      onPointerLeave={onPressEnd}
      className={`inline-flex h-12 w-12 touch-manipulation select-none items-center justify-center border text-[#d6c4ad] transition-[transform,background-color,border-color,color] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98c4d]/70 ${
        active
          ? "border-[#e1a45c] bg-[#8d4d35]/70 text-[#ffe0ae]"
          : "border-[#b59d84]/35 bg-[#151014]/85 hover:border-[#d98c4d]/70 hover:bg-[#291b21]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

const emptyHud: GameHud = {
  level: 1,
  totalLevels: GAME_LEVELS.length,
  levelName: "The Drowned Gate",
  health: 100,
  lives: 4,
  relics: 0,
  totalRelics: GAME_LEVELS.reduce((total, level) => total + level.relics.length, 0),
  checkpoint: "Затоплені ворота",
  gamepadConnected: false,
  gameOver: false,
  won: false,
};

export default function Game() {
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<GameInput>({ left: false, right: false, jump: false, strike: false, sprint: false });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [restartSignal, setRestartSignal] = useState(0);
  const [hud, setHud] = useState(emptyHud);

  const handleHudChange = useCallback((nextHud: GameHud) => setHud(nextHud), []);
  const handleGamepadChange = useCallback((connected: boolean) => {
    setHud((current) => ({ ...current, gamepadConnected: connected }));
  }, []);
  const handleRequestPause = useCallback(() => setPaused((value) => !value), []);
  const restartGame = useCallback(() => {
    setPaused(false);
    setRestartSignal((value) => value + 1);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = document.fullscreenElement === stageRef.current;
      setIsFullscreen(active);
      if (active && (window.matchMedia("(max-width: 767px)").matches || window.matchMedia("(max-height: 767px)").matches)) {
        const orientation = screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
        if (orientation.lock) {
          void orientation.lock("landscape").catch(() => undefined);
        }
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await stageRef.current.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {
      // Fullscreen can be denied by browser policy; the inline stage remains playable.
    }
  };

  const setInput = (key: keyof GameInput, value: boolean) => {
    inputRef.current[key] = value;
  };

  return (
    <main className="min-h-[100dvh] bg-[#080709] px-3 py-5 text-[#e8ddcf] sm:px-6 sm:py-8 lg:px-10">
      <style>{`
        .game-stage-shell:fullscreen {
          box-sizing: border-box;
          display: flex;
          width: 100vw;
          height: 100dvh;
          min-height: 100dvh;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #080709;
          padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
        }
        .game-stage-shell:fullscreen .game-stage {
          width: 100%;
          height: 100%;
          max-height: none;
          aspect-ratio: auto;
          border-width: 0;
        }
        .game-portrait-warning { display: none; }
        .game-touch-controls { display: none; }
        @media (max-width: 767px), (orientation: landscape) and (max-height: 767px) {
          .game-touch-controls { display: flex; }
        }
        @media (orientation: portrait) and (max-width: 767px) {
          .game-stage-shell:fullscreen .game-portrait-warning { display: flex; }
          .game-stage-shell:not(:fullscreen) .game-portrait-warning { display: flex; }
        }
        @media (prefers-reduced-motion: reduce) {
          .game-ambient-motion { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1440px]">
        <header className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
          <div>
            <Link href="/" className="mb-2 inline-flex font-mono text-[9px] uppercase tracking-[0.22em] text-[#9e7f68] transition-colors hover:text-[#e2c59e]">
              ← Повернутися до Gathering Of The Fallen
            </Link>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-[#9e7f68]">
              <span className="inline-block h-1.5 w-1.5 bg-[#cb7044]" />
              Interactive fragment / 01
            </div>
            <h1 className="font-creepster text-3xl tracking-[0.08em] text-[#e2c59e] sm:text-4xl">
              The Ashen Crossing
            </h1>
          </div>
          <div className="hidden text-right font-mono text-[10px] uppercase tracking-[0.2em] text-[#806d61] sm:block">
            <p>Gathering of the Fallen</p>
            <p className="mt-1 text-[#b3563c]">{hud.totalLevels} levels // signal unstable</p>
          </div>
        </header>

        <div ref={stageRef} className="game-stage-shell relative">
          <section className="game-stage relative aspect-video w-full overflow-hidden border border-[#9b6c50]/60 bg-[#0c0b0e] shadow-[0_18px_70px_rgba(0,0,0,0.65)]" aria-label="The Ashen Crossing game stage">
            <GameCanvas
              inputRef={inputRef}
              paused={paused}
              restartSignal={restartSignal}
              audioEnabled={audioEnabled}
              onHudChange={handleHudChange}
              onGamepadChange={handleGamepadChange}
              onRequestPause={handleRequestPause}
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3 sm:p-5">
              <div className="flex items-start gap-2.5 sm:gap-4">
                <div className="relative flex h-10 w-10 items-center justify-center border border-[#c67b50]/70 bg-[#170f14]/90 text-[#d69a63] sm:h-12 sm:w-12">
                  <Shield size={20} strokeWidth={1.4} />
                  <span className="absolute -bottom-1 -right-1 bg-[#c67b50] px-1 font-mono text-[8px] text-[#170f14]">{String(hud.lives).padStart(2, "0")}</span>
                </div>
                <div className="min-w-[120px] sm:min-w-[170px]">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-[#bca18a]">
                    <span>Vitality</span>
                    <span className="text-[#d98556]">{hud.health} / 100</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-[#382027]">
                    <div className="h-full bg-[#b75b40] transition-[width] duration-200" style={{ width: `${hud.health}%` }} />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[#e2a56a]">
                    {[0, 1, 2, 3].map((heart) => (
                      <Heart key={heart} size={11} fill={heart < hud.lives ? "currentColor" : "none"} strokeWidth={1.5} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pointer-events-auto flex items-center gap-1.5">
                <div className="mr-1 hidden border-r border-[#b59d84]/20 pr-3 font-mono text-right text-[9px] uppercase tracking-[0.14em] text-[#9f8878] sm:block">
                  <p>Level {String(hud.level).padStart(2, "0")} / {hud.totalLevels}</p>
                  <p className="mt-1 max-w-[150px] truncate text-[#cf744b]">{hud.levelName}</p>
                </div>
                <Link
                  href="/"
                  aria-label="Закрити гру"
                  title="Закрити гру"
                  className="inline-flex h-9 w-9 items-center justify-center border border-[#b59d84]/25 bg-[#120f12]/80 text-[#cdbda9] transition-colors hover:border-[#d8846b]/80 hover:bg-[#3a1720] hover:text-[#ffd2aa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98c4d]/70"
                >
                  <X size={17} />
                </Link>
                <IconButton label={audioEnabled ? "Вимкнути звук" : "Увімкнути звук"} pressed={audioEnabled} onClick={() => setAudioEnabled((value) => !value)}>
                  {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </IconButton>
                <IconButton label={paused ? "Продовжити гру" : "Поставити гру на паузу"} pressed={paused} onClick={() => setPaused((value) => !value)}>
                  {paused ? <Play size={16} /> : <Pause size={16} />}
                </IconButton>
                <IconButton label={isFullscreen ? "Вийти з повного екрана" : "Повний екран"} pressed={isFullscreen} onClick={toggleFullscreen}>
                  {isFullscreen ? <Expand size={16} /> : <Maximize2 size={16} />}
                </IconButton>
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 border border-[#b59d84]/20 bg-[#0b090d]/70 px-3 py-1 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-[#a99484] sm:top-5">
              {hud.levelName}
            </div>

            <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#a38b79] sm:bottom-5 sm:left-5">
              <span className="h-1.5 w-1.5 bg-[#d88451]" />
              <span>Checkpoint: {hud.checkpoint}</span>
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#a38b79] sm:bottom-5 sm:right-5 sm:flex">
              <span>Relics</span>
              <span className="text-[#e1ae70]">{String(hud.relics).padStart(2, "0")}</span>
              <span className="text-[#6c584f]">/</span>
              <span>{hud.totalRelics}</span>
              {hud.gamepadConnected && <Gamepad2 size={12} className="ml-2 text-[#70d5c5]" aria-label="Геймпад підключено" />}
            </div>

            {paused && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#09080b]/60 p-4 backdrop-blur-[2px]">
                <div className="pointer-events-auto border border-[#c67b50]/60 bg-[#130e13]/95 px-7 py-5 text-center shadow-[0_12px_40px_rgba(0,0,0,.45)]">
                  <Pause className="mx-auto mb-3 text-[#d98c4d]" size={20} />
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d9c0a3]">Гру призупинено</p>
                  <p className="mt-2 font-mono text-[9px] text-[#927b6c]">Натисніть кнопку нижче або Escape</p>
                  <button
                    type="button"
                    onClick={() => setPaused(false)}
                    className="mt-4 border border-[#d98c4d]/70 bg-[#8d4d35]/35 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffe0ae] transition-colors hover:bg-[#8d4d35]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98c4d]"
                  >
                    Продовжити
                  </button>
                </div>
              </div>
            )}

            <div className="game-portrait-warning pointer-events-none absolute left-1/2 top-2 z-40 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded border border-[#d98c4d]/55 bg-[#100c11]/90 px-2.5 py-1.5 text-left shadow-[0_0_18px_rgba(217,140,77,.2)]">
              <ArrowLeft className="shrink-0 rotate-90 text-[#e1ae70]" size={16} />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#e2c59e]">Горизонтальний режим 16:9</p>
                <p className="font-mono text-[8px] text-[#9e7f68]">Так грати зручніше</p>
              </div>
            </div>

            {(hud.gameOver || hud.won) && (
              <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-4">
                <div className="pointer-events-auto w-full max-w-xs border border-[#c67b50]/70 bg-[#130e13]/95 px-5 py-4 text-center shadow-[0_12px_40px_rgba(0,0,0,.55)]">
                  <p className="font-creepster text-2xl tracking-[0.12em] text-[#e2c59e]">
                    {hud.won ? "Шлях завершено" : "Темрява наздогнала"}
                  </p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#a99484]">
                    {hud.won ? "Можна почати новий похід" : "Спробуй пройти цей рівень ще раз"}
                  </p>
                  <button
                    type="button"
                    onClick={restartGame}
                    className="mt-4 border border-[#d98c4d]/70 bg-[#8d4d35]/35 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffe0ae] transition-colors hover:bg-[#8d4d35]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98c4d]"
                  >
                    Почати заново
                  </button>
                </div>
              </div>
            )}

            <div className="game-touch-controls pointer-events-none absolute inset-x-0 bottom-0 z-20 items-end justify-between p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="pointer-events-auto flex items-end gap-1.5">
                <div className="grid grid-cols-3 gap-1.5">
                  <TouchButton label="Рух ліворуч" active={inputRef.current.left} onPressStart={() => setInput("left", true)} onPressEnd={() => setInput("left", false)}>
                    <ArrowLeft size={18} />
                  </TouchButton>
                  <TouchButton label="Рух праворуч / вперед" active={inputRef.current.right} onPressStart={() => setInput("right", true)} onPressEnd={() => setInput("right", false)}>
                    <ArrowRight size={18} />
                  </TouchButton>
                  <TouchButton label="Прискорення" active={inputRef.current.sprint} onPressStart={() => setInput("sprint", true)} onPressEnd={() => setInput("sprint", false)}>
                    <FastForward size={18} />
                  </TouchButton>
                </div>
              </div>
              <div className="pointer-events-auto flex items-end gap-1.5">
                <TouchButton label="Стрибок" active={inputRef.current.jump} onPressStart={() => setInput("jump", true)} onPressEnd={() => setInput("jump", false)} className="h-14 w-14 rounded-full border-[#d98c4d]/70 bg-[#6d3b32]/90 text-[#ffd39a]">
                  <ArrowUp size={21} />
                </TouchButton>
                <TouchButton label="Удар" active={inputRef.current.strike} onPressStart={() => setInput("strike", true)} onPressEnd={() => setInput("strike", false)} className="h-14 w-14 rounded-full border-[#c67b50]/65 bg-[#3a2023]/90 text-[#df9d63]">
                  <Crosshair size={20} />
                </TouchButton>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-3 flex flex-col gap-3 border-t border-[#9b6c50]/25 pt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#806d61] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[#bf6e49]">Controls</span>
            <span className="hidden sm:inline">A / D або ← / → рух</span>
            <span className="hidden sm:inline">Space стрибок</span>
            <span className="hidden sm:inline">J / X удар</span>
            <span className="hidden sm:inline text-[#d98c4d]">Left Shift біг</span>
            <span className="sm:hidden">Палець — рух, стрибок та удар</span>
          </div>
          <div className="flex items-center gap-2 text-[#9d8270]">
            <span className="h-1.5 w-1.5 bg-[#bf6e49]" />
            <span>{hud.gamepadConnected ? "Gamepad connected" : "Mouse / keyboard / touch ready"}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
