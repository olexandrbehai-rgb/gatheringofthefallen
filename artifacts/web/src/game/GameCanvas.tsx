import { useEffect, useRef, type MutableRefObject } from "react";
import { GAME_LEVELS, type GameLevel, type GameRect } from "./gameData";
import openingBackground from "@/assets/game-opening-background.png";

export type GameInput = {
  left: boolean;
  right: boolean;
  jump: boolean;
  strike: boolean;
  sprint: boolean;
};

export type GameHud = {
  level: number;
  totalLevels: number;
  levelName: string;
  health: number;
  lives: number;
  relics: number;
  totalRelics: number;
  checkpoint: string;
  gamepadConnected: boolean;
  gameOver: boolean;
  won: boolean;
};

type GameCanvasProps = {
  inputRef: MutableRefObject<GameInput>;
  paused: boolean;
  restartSignal: number;
  audioEnabled: boolean;
  onHudChange: (hud: GameHud) => void;
  onGamepadChange: (connected: boolean) => void;
  onRequestPause: () => void;
};

type Player = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
};

type Enemy = {
  x: number;
  y: number;
  w: number;
  h: number;
  minX: number;
  maxX: number;
  speed: number;
  direction: 1 | -1;
  alive: boolean;
};

type Runtime = {
  levelIndex: number;
  level: GameLevel;
  player: Player;
  enemies: Enemy[];
  collectedRelics: boolean[];
  health: number;
  lives: number;
  relics: number;
  lastCheckpointX: number;
  invulnerableFor: number;
  strikeFor: number;
  transitionFor: number;
  won: boolean;
  gameOver: boolean;
};

type AudioRuntime = {
  context: AudioContext;
  gain: GainNode;
  timer: number;
  step: number;
};

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;
const PLAYER_SPEED = 235;
const SPRINT_MULTIPLIER = 1.55;
const GRAVITY = 1180;
const JUMP_SPEED = 470;
const PLAYER_SIZE = { w: 24, h: 40 };

function overlaps(a: GameRect, b: GameRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function playerRect(player: Player): GameRect {
  return { x: player.x, y: player.y, w: player.w, h: player.h };
}

function createRuntime(levelIndex: number, lives = 4, relics = 0): Runtime {
  const level = GAME_LEVELS[levelIndex];
  return {
    levelIndex,
    level,
    player: {
      x: 72,
      y: 420,
      w: PLAYER_SIZE.w,
      h: PLAYER_SIZE.h,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
    },
    enemies: level.enemies.map((enemy) => ({
      ...enemy,
      w: 26,
      h: 32,
      direction: 1,
      alive: true,
    })),
    collectedRelics: level.relics.map(() => false),
    health: 100,
    lives,
    relics,
    lastCheckpointX: 72,
    invulnerableFor: 0,
    strikeFor: 0,
    transitionFor: 0,
    won: false,
    gameOver: false,
  };
}

function drawRect(ctx: CanvasRenderingContext2D, rect: GameRect, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawPlatform(ctx: CanvasRenderingContext2D, platform: GameRect, accent: string, seed: number) {
  const material = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.h);
  material.addColorStop(0, "#3d2b35");
  material.addColorStop(0.08, "#271d29");
  material.addColorStop(1, "#110f19");
  ctx.fillStyle = material;
  ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
  ctx.fillStyle = "rgba(255, 225, 175, .12)";
  ctx.fillRect(platform.x, platform.y + 5, platform.w, 2);
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 8;
  ctx.fillRect(platform.x, platform.y, platform.w, 4);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(238, 199, 142, .12)";
  ctx.lineWidth = 1;
  for (let x = platform.x + 8; x < platform.x + platform.w; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, platform.y + 8);
    ctx.lineTo(x - 7, platform.y + platform.h - 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(4, 7, 15, .46)";
    ctx.fillRect(x + ((seed * 7) % 5), platform.y + 13 + ((x + seed) % 11), 3, 2);
  }
  ctx.strokeStyle = "rgba(4, 6, 12, .75)";
  ctx.beginPath();
  ctx.moveTo(platform.x + 2, platform.y + platform.h - 1);
  ctx.lineTo(platform.x + platform.w - 2, platform.y + platform.h - 1);
  ctx.stroke();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, time: number, strikeFor: number) {
  const bob = player.onGround ? Math.sin(time * 0.012) * 1.5 : 0;
  const walking = player.onGround && Math.abs(player.vx) > 12;
  const walkPhase = walking ? Math.sin(time * 0.028) : 0;
  const cloakWave = Math.sin(time * 0.021 + player.x * 0.035) * (walking ? 4 : 1.2);
  const cloakLift = walking ? Math.abs(Math.sin(time * 0.014)) * 2.5 : 0;
  const legSwing = walking ? walkPhase * 2.5 : 0;
  const x = player.x;
  const y = player.y + bob;
  const centerX = x + player.w / 2;
  ctx.save();
  ctx.translate(centerX, 0);
  ctx.scale(player.facing, 1);
  ctx.translate(-centerX, 0);

  // Ground shadow makes the character read as a body instead of a floating tile.
  ctx.fillStyle = "rgba(0, 0, 0, .4)";
  ctx.beginPath();
  ctx.ellipse(centerX, y + player.h + 3, 16, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "rgba(79, 220, 222, .8)";
  ctx.shadowBlur = 16;
  const bodyGradient = ctx.createLinearGradient(x - 5, y + 13, x + player.w + 8, y + 37);
  bodyGradient.addColorStop(0, "#6ec6c5");
  bodyGradient.addColorStop(0.48, "#28747f");
  bodyGradient.addColorStop(1, "#153c50");

  // Hood and shoulders.
  ctx.fillStyle = "#132a3a";
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 18);
  ctx.quadraticCurveTo(x + 12, y + 10, x + 20, y + 18);
  ctx.lineTo(x + 27, y + 29);
  ctx.lineTo(x + 22, y + 35);
  ctx.lineTo(x + 2, y + 35);
  ctx.lineTo(x - 3, y + 29);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Tapered cloak gives the silhouette a distinct 3D, non-square shape.
  const cloakGradient = ctx.createLinearGradient(x - 7, y + 18, x + 27, y + 43);
  cloakGradient.addColorStop(0, "#421d3b");
  cloakGradient.addColorStop(0.6, "#1b2341");
  cloakGradient.addColorStop(1, "#0b1327");
  ctx.fillStyle = cloakGradient;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 20);
  ctx.lineTo(x + 22, y + 20);
  ctx.lineTo(x + 29, y + 41 + cloakWave * 0.3);
  ctx.lineTo(x + 16, y + 37 + cloakWave * 0.45);
  ctx.lineTo(x + 5, y + 40 + cloakWave * 0.25);
  ctx.lineTo(x - 7 - cloakLift, y + 31 + cloakWave);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(108, 211, 210, .45)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 21);
  ctx.quadraticCurveTo(x - 1 - cloakLift * 0.4, y + 28 + cloakWave * 0.45, x - 5 - cloakLift, y + 31 + cloakWave);
  ctx.stroke();
  ctx.strokeStyle = "rgba(224, 161, 93, .32)";
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 24);
  ctx.quadraticCurveTo(x + 2 - cloakLift * 0.3, y + 31 + cloakWave * 0.2, x + 2, y + 38 + cloakWave * 0.3);
  ctx.stroke();

  // Head, visor and small cyan eye-light.
  ctx.fillStyle = "#bd8b70";
  ctx.beginPath();
  ctx.arc(x + 12, y + 12, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#162637";
  roundedRect(ctx, x + 4, y + 8, 16, 8, 3);
  ctx.fill();
  ctx.fillStyle = "#bafcff";
  ctx.shadowColor = "#59d2d6";
  ctx.shadowBlur = 7;
  roundedRect(ctx, x + 14, y + 10, 4, 2, 1);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Chest plate, belt and split boots.
  ctx.fillStyle = bodyGradient;
  roundedRect(ctx, x + 4, y + 17, 17, 20, 5);
  ctx.fill();
  ctx.fillStyle = "#e0a15d";
  roundedRect(ctx, x + 4, y + 29, 18, 4, 1.5);
  ctx.fill();
  ctx.fillStyle = "#f5d38c";
  ctx.beginPath();
  ctx.arc(x + 13, y + 31, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#121b2b";
  roundedRect(ctx, x + 4 - legSwing, y + 35, 7, 8, 2);
  ctx.fill();
  roundedRect(ctx, x + 15 + legSwing, y + 35, 7, 8, 2);
  ctx.fill();
  ctx.fillStyle = "#4fc1c7";
  roundedRect(ctx, x + 3 - legSwing, y + 42, 9, 2.5, 1);
  ctx.fill();
  roundedRect(ctx, x + 15 + legSwing, y + 42, 9, 2.5, 1);
  ctx.fill();

  if (strikeFor > 0) {
    ctx.strokeStyle = "#f2c47e";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#e78e54";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(player.facing > 0 ? x + player.w + 7 : x - 7, y + 20, 25, player.facing > 0 ? -0.75 : 2.39, player.facing > 0 ? 0.75 : 3.89);
    ctx.stroke();
  }
  ctx.restore();
}

function startAudio(): AudioRuntime | null {
  const AudioConstructor = (
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  ) as typeof AudioContext | undefined;
  if (!AudioConstructor) return null;

  const context = new AudioConstructor();
  const gain = context.createGain();
  gain.gain.value = 0.045;
  gain.connect(context.destination);
  const melody = [220, 277.18, 329.63, 277.18, 246.94, 329.63, 369.99, 329.63];
  const bass = [110, 110, 123.47, 92.5];
  const audio: AudioRuntime = { context, gain, timer: 0, step: 0 };

  const playNote = () => {
    const now = context.currentTime;
    const tone = context.createOscillator();
    const toneGain = context.createGain();
    tone.type = "triangle";
    tone.frequency.value = melody[audio.step % melody.length];
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.17, now + 0.025);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    tone.connect(toneGain);
    toneGain.connect(gain);
    tone.start(now);
    tone.stop(now + 0.26);

    if (audio.step % 2 === 0) {
      const low = context.createOscillator();
      const lowGain = context.createGain();
      low.type = "sine";
      low.frequency.value = bass[(audio.step / 2) % bass.length];
      lowGain.gain.setValueAtTime(0.0001, now);
      lowGain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      low.connect(lowGain);
      lowGain.connect(gain);
      low.start(now);
      low.stop(now + 0.32);
    }
    audio.step += 1;
  };

  playNote();
  audio.timer = window.setInterval(playNote, 280);
  return audio;
}

export function GameCanvas({
  inputRef,
  paused,
  restartSignal,
  audioEnabled,
  onHudChange,
  onGamepadChange,
  onRequestPause,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const audioEnabledRef = useRef(audioEnabled);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const keyboard = { left: false, right: false, jump: false, strike: false, sprint: false };
    const mouseControl = { active: false, button: 0 };
    const viewport = { width: WORLD_WIDTH, height: WORLD_HEIGHT, dpr: 1, scale: 1, offsetX: 0, offsetY: 0 };
    const audioRef: { current: AudioRuntime | null } = { current: null };
    let runtime = createRuntime(0);
    let previousTime = performance.now();
    let lastHudUpdate = 0;
    let jumpWasDown = false;
    let connectedBefore = false;
    let animationFrame = 0;
    const openingImage = new Image();
    openingImage.decoding = "async";
    openingImage.src = openingBackground;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      viewport.width = WORLD_WIDTH;
      viewport.height = WORLD_HEIGHT;
      viewport.dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewport.scale = Math.min(rect.width / WORLD_WIDTH, rect.height / WORLD_HEIGHT);
      viewport.offsetX = (rect.width - WORLD_WIDTH * viewport.scale) / 2;
      viewport.offsetY = (rect.height - WORLD_HEIGHT * viewport.scale) / 2;
      canvas.width = Math.max(1, Math.floor(rect.width * viewport.dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * viewport.dpr));
    };

    const ensureAudio = () => {
      if (!audioRef.current) audioRef.current = startAudio();
      if (audioRef.current?.context.state === "suspended") {
        void audioRef.current.context.resume();
      }
    };

    const setKey = (code: string, pressed: boolean) => {
      if (code === "ArrowLeft" || code === "KeyA") keyboard.left = pressed;
      if (code === "ArrowRight" || code === "KeyD") keyboard.right = pressed;
      if (code === "ArrowUp" || code === "KeyW" || code === "Space") keyboard.jump = pressed;
      if (code === "KeyJ" || code === "KeyX" || code === "Control") keyboard.strike = pressed;
      if (code === "ShiftLeft") keyboard.sprint = pressed;
      if (pressed) ensureAudio();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      if (event.code === "Escape") {
        onRequestPause();
        return;
      }
      setKey(event.code, true);
    };
    const onKeyUp = (event: KeyboardEvent) => setKey(event.code, false);
    const onBlur = () => {
      keyboard.left = false;
      keyboard.right = false;
      keyboard.jump = false;
      keyboard.strike = false;
      keyboard.sprint = false;
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jump = false;
      inputRef.current.strike = false;
      inputRef.current.sprint = false;
    };

    const resetMouseInput = () => {
      mouseControl.active = false;
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jump = false;
      inputRef.current.strike = false;
    };

    const updateMouseInput = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left - viewport.offsetX) / (WORLD_WIDTH * viewport.scale)));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top - viewport.offsetY) / (WORLD_HEIGHT * viewport.scale)));
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jump = false;
      inputRef.current.strike = mouseControl.button === 2;
      if (mouseControl.button === 0) {
        inputRef.current.jump = y < 0.38;
        if (!inputRef.current.jump) {
          inputRef.current.left = x < 0.48;
          inputRef.current.right = x > 0.52;
        }
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      ensureAudio();
      mouseControl.active = true;
      mouseControl.button = event.button;
      canvas.setPointerCapture?.(event.pointerId);
      updateMouseInput(event);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (mouseControl.active && event.pointerType !== "touch") updateMouseInput(event);
    };
    const onPointerUp = (event?: PointerEvent) => {
      if (event?.pointerType === "touch") return;
      resetMouseInput();
    };
    const onContextMenu = (event: MouseEvent) => event.preventDefault();

    const emitHud = (gamepadConnected: boolean) => {
      onHudChange({
        level: runtime.levelIndex + 1,
        totalLevels: GAME_LEVELS.length,
        levelName: runtime.level.name,
        health: Math.max(0, Math.round(runtime.health)),
        lives: runtime.lives,
        relics: runtime.relics,
        totalRelics: GAME_LEVELS.reduce((total, level) => total + level.relics.length, 0),
        checkpoint: runtime.level.checkpoint,
        gamepadConnected,
        gameOver: runtime.gameOver,
        won: runtime.won,
      });
    };

    const damagePlayer = () => {
      if (runtime.invulnerableFor > 0 || runtime.gameOver) return;
      runtime.health -= 34;
      runtime.invulnerableFor = 1.1;
      runtime.player.x = runtime.lastCheckpointX;
      runtime.player.y = 410;
      runtime.player.vx = 0;
      runtime.player.vy = -180;
      if (runtime.health <= 0) {
        runtime.lives -= 1;
        if (runtime.lives <= 0) {
          runtime.gameOver = true;
        } else {
          runtime.health = 100;
        }
      }
    };

    const nextLevel = () => {
      if (runtime.levelIndex >= GAME_LEVELS.length - 1) {
        runtime.won = true;
        return;
      }
      const next = createRuntime(runtime.levelIndex + 1, runtime.lives, runtime.relics);
      runtime = next;
    };

    const getGamepadInput = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const pad = Array.from(pads).find(Boolean);
      const connected = Boolean(pad);
      if (connected !== connectedBefore) {
        connectedBefore = connected;
        onGamepadChange(connected);
      }
      if (!pad) return { left: false, right: false, jump: false, strike: false };
      return {
        left: (pad.axes[0] ?? 0) < -0.25 || Boolean(pad.buttons[14]?.pressed),
        right: (pad.axes[0] ?? 0) > 0.25 || Boolean(pad.buttons[15]?.pressed),
        jump: Boolean(pad.buttons[0]?.pressed || pad.buttons[12]?.pressed),
        strike: Boolean(pad.buttons[2]?.pressed || pad.buttons[1]?.pressed),
      };
    };

    const draw = (time: number) => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      const scale = viewport.dpr * viewport.scale;
      context.setTransform(scale, 0, 0, scale, viewport.offsetX * viewport.dpr, viewport.offsetY * viewport.dpr);

      const level = runtime.level;
      const camera = Math.max(
        0,
        Math.min(level.width - WORLD_WIDTH, runtime.player.x - 265),
      );
      const gradient = context.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
      gradient.addColorStop(0, level.palette.skyTop);
      gradient.addColorStop(1, level.palette.skyBottom);
      context.fillStyle = gradient;
      context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      const backgroundImage = openingImage;
      const hasBackgroundImage = Boolean(backgroundImage?.complete && backgroundImage.naturalWidth > 0);
      if (hasBackgroundImage && backgroundImage) {
        context.save();
        context.globalAlpha = 0.82;
        context.drawImage(backgroundImage, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        context.globalAlpha = 1;
        context.fillStyle = "rgba(7, 8, 17, .28)";
        context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        context.restore();
      }

      if (!hasBackgroundImage) {
        context.save();
        context.translate(-camera * 0.25, 0);
        for (let i = 0; i < Math.ceil(level.width / 170) + 4; i += 1) {
          const x = i * 170 + 40;
          const height = 45 + ((i * 37) % 90);
          context.fillStyle = "rgba(12, 10, 18, .48)";
          context.beginPath();
          context.moveTo(x - 120, 410);
          context.lineTo(x - 55, 410 - height);
          context.lineTo(x + 10, 410);
          context.lineTo(x + 62, 410 - height * 0.6);
          context.lineTo(x + 140, 410);
          context.closePath();
          context.fill();
        }
        context.restore();
      }

      context.save();
      context.translate(-camera, 0);
      const glow = context.createRadialGradient(runtime.player.x + 120, 160, 8, runtime.player.x + 120, 160, 230);
      glow.addColorStop(0, `${level.palette.glow}34`);
      glow.addColorStop(1, "transparent");
      context.fillStyle = glow;
      context.fillRect(runtime.player.x - 120, 0, 500, 430);

      for (let i = 0; i < Math.ceil(level.width / 120); i += 1) {
        const x = i * 120 + 40;
        const y = 60 + ((i * 53) % 170);
        context.fillStyle = i % 4 === 0 ? `${level.palette.accent}99` : "rgba(224, 192, 133, .28)";
        context.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
      }

      level.platforms.forEach((platform, index) => drawPlatform(context, platform, level.palette.accent, index));
      level.hazards.forEach((hazard) => {
        context.fillStyle = "#6b2631";
        for (let x = hazard.x; x < hazard.x + hazard.w; x += 12) {
          context.beginPath();
          context.moveTo(x, hazard.y + hazard.h);
          context.lineTo(x + 6, hazard.y);
          context.lineTo(x + 12, hazard.y + hazard.h);
          context.closePath();
          context.fill();
        }
      });

      level.relics.forEach((relic, index) => {
        if (!runtime.collectedRelics[index]) {
          drawDiamond(context, relic.x, relic.y, 12 + Math.sin(time * 0.006 + index) * 2, level.palette.accent);
          context.fillStyle = "#e7d69a";
          context.fillRect(relic.x - 1, relic.y - 6, 2, 12);
        }
      });

      context.fillStyle = "#b66748";
      context.fillRect(level.goalX, 270, 8, 206);
      context.fillStyle = `${level.palette.accent}aa`;
      context.fillRect(level.goalX + 8, 280, 56, 3);
      context.fillRect(level.goalX + 8, 306, 42, 3);
      context.fillRect(level.goalX + 8, 332, 52, 3);
      context.strokeStyle = level.palette.glow;
      context.lineWidth = 2;
      context.strokeRect(level.goalX - 16, 242, 90, 234);

      runtime.enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        context.save();
        context.shadowColor = "#a44a5c";
        context.shadowBlur = 10;
        drawRect(context, { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h }, "#5b3044");
        context.shadowBlur = 0;
        drawRect(context, { x: enemy.x + 5, y: enemy.y + 7, w: 5, h: 4 }, "#ffad6a");
        drawRect(context, { x: enemy.x + 16, y: enemy.y + 7, w: 5, h: 4 }, "#ffad6a");
        context.restore();
      });

      context.restore();

      // Foreground pass: keep the hero above platforms, hazards, enemies, and parallax layers.
      if (!runtime.gameOver && !runtime.won) {
        context.save();
        context.translate(-camera, 0);
        if (runtime.invulnerableFor <= 0 || Math.floor(time / 90) % 2 === 0) {
          drawPlayer(context, runtime.player, time, runtime.strikeFor);
        }
        context.restore();
      }

      const vignette = context.createRadialGradient(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 160, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 600);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "rgba(2, 2, 6, .62)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      if (runtime.transitionFor > 0) {
        context.fillStyle = `rgba(3, 3, 6, ${Math.min(0.82, runtime.transitionFor / 0.8)})`;
        context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }
      if (runtime.gameOver || runtime.won) {
        context.fillStyle = "rgba(5, 4, 8, .74)";
        context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        context.textAlign = "center";
        context.fillStyle = runtime.won ? "#e4bd7a" : "#d8846b";
        context.font = "28px Creepster, cursive";
        context.fillText(runtime.won ? "THE FIRE REMAINS" : "THE DARKNESS TAKES YOU", WORLD_WIDTH / 2, 235);
        context.fillStyle = "#d2bca1";
        context.font = "11px monospace";
        context.fillText(runtime.won ? `Усі ${GAME_LEVELS.length} рівні пройдено. Натисніть Enter для нового походу.` : "Натисніть Enter, щоб почати знову.", WORLD_WIDTH / 2, 268);
      }
    };

    const tick = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.034);
      previousTime = time;
      const gamepad = getGamepadInput();
      const activeInput = {
        left: keyboard.left || inputRef.current.left || gamepad.left,
        right: keyboard.right || inputRef.current.right || gamepad.right,
        jump: keyboard.jump || inputRef.current.jump || gamepad.jump,
        strike: keyboard.strike || inputRef.current.strike || gamepad.strike,
        sprint: keyboard.sprint || inputRef.current.sprint,
      };
      if (activeInput.jump || activeInput.strike) ensureAudio();

      if ((runtime.gameOver || runtime.won) && keyboard.jump) {
        runtime = createRuntime(0);
        keyboard.jump = false;
      }

      if (!pausedRef.current && !runtime.gameOver && !runtime.won) {
        runtime.invulnerableFor = Math.max(0, runtime.invulnerableFor - delta);
        runtime.strikeFor = activeInput.strike ? 0.18 : Math.max(0, runtime.strikeFor - delta);
        if (runtime.transitionFor > 0) {
          runtime.transitionFor -= delta;
          if (runtime.transitionFor <= 0) nextLevel();
        } else {
          const direction = (activeInput.right ? 1 : 0) - (activeInput.left ? 1 : 0);
          if (direction !== 0) {
            runtime.player.vx = direction * PLAYER_SPEED * (activeInput.sprint ? SPRINT_MULTIPLIER : 1);
            runtime.player.facing = direction > 0 ? 1 : -1;
          } else {
            runtime.player.vx *= Math.pow(0.001, delta);
          }

          const jumpDown = activeInput.jump;
          if (jumpDown && !jumpWasDown && runtime.player.onGround) {
            runtime.player.vy = -JUMP_SPEED;
            runtime.player.onGround = false;
          }
          jumpWasDown = jumpDown;

          const previousBottom = runtime.player.y + runtime.player.h;
          runtime.player.x = Math.max(0, Math.min(runtime.level.width - runtime.player.w, runtime.player.x + runtime.player.vx * delta));
          runtime.player.vy += GRAVITY * delta;
          runtime.player.y += runtime.player.vy * delta;
          runtime.player.onGround = false;

          for (const platform of runtime.level.platforms) {
            const horizontal = runtime.player.x + runtime.player.w > platform.x && runtime.player.x < platform.x + platform.w;
            if (horizontal && runtime.player.vy >= 0 && previousBottom <= platform.y && runtime.player.y + runtime.player.h >= platform.y) {
              runtime.player.y = platform.y - runtime.player.h;
              runtime.player.vy = 0;
              runtime.player.onGround = true;
            }
          }

          const currentRect = playerRect(runtime.player);
          if (runtime.level.hazards.some((hazard) => overlaps(currentRect, hazard)) || runtime.player.y > WORLD_HEIGHT + 30) {
            damagePlayer();
          }

          for (const enemy of runtime.enemies) {
            if (!enemy.alive) continue;
            enemy.x += enemy.direction * enemy.speed * delta;
            if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) enemy.direction = enemy.direction === 1 ? -1 : 1;
            const enemyRect = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
            if (runtime.strikeFor > 0) {
              const strikeRect = {
                x: runtime.player.facing > 0 ? runtime.player.x + runtime.player.w : runtime.player.x - 34,
                y: runtime.player.y + 8,
                w: 34,
                h: 25,
              };
              if (overlaps(strikeRect, enemyRect)) enemy.alive = false;
            }
            if (enemy.alive && overlaps(currentRect, enemyRect)) {
              if (runtime.player.vy > 0 && previousBottom <= enemy.y + 10) {
                enemy.alive = false;
                runtime.player.vy = -JUMP_SPEED * 0.55;
              } else {
                damagePlayer();
              }
            }
          }

          runtime.level.relics.forEach((relic, index) => {
            if (!runtime.collectedRelics[index] && overlaps(currentRect, { x: relic.x - 12, y: relic.y - 12, w: 24, h: 24 })) {
              runtime.collectedRelics[index] = true;
              runtime.relics += 1;
            }
          });

          if (runtime.player.x > runtime.level.goalX - 28) {
            runtime.transitionFor = 0.9;
          }
        }
      } else {
        jumpWasDown = activeInput.jump;
      }

      const gamepadConnected = connectedBefore;
      if (audioRef.current) {
        const targetGain = audioEnabledRef.current ? 0.045 : 0.0001;
        audioRef.current.gain.gain.setTargetAtTime(targetGain, audioRef.current.context.currentTime, 0.04);
      }
      if (time - lastHudUpdate > 100) {
        emitHud(gamepadConnected);
        lastHudUpdate = time;
      }
      draw(time);
      animationFrame = window.requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();
    emitHud(false);
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("contextmenu", onContextMenu);
    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
      if (audioRef.current) {
        window.clearInterval(audioRef.current.timer);
        void audioRef.current.context.close();
      }
    };
  }, [inputRef, onGamepadChange, onHudChange, onRequestPause, restartSignal]);

  return <canvas ref={canvasRef} data-game-canvas aria-label="The Ashen Crossing platform game" className="absolute inset-0 h-full w-full touch-none select-none" />;
}
