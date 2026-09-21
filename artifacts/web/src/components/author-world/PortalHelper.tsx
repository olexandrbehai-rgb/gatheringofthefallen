import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

type HelperLanguage = "ua" | "en" | "fr";
type HelperPhase =
  | "cruise"
  | "notice"
  | "inspect"
  | "think"
  | "write"
  | "celebrate"
  | "cling"
  | "freeze"
  | "smoke"
  | "peek"
  | "doze"
  | "giggle";

type HelperScene = {
  phase: HelperPhase;
  symbol: string;
  label: Record<HelperLanguage, string>;
};

type HelperWaypoint = {
  left: number;
  top: number;
  tilt: number;
};

type Point = {
  x: number;
  y: number;
};

type Velocity = Point;

const SCENES: HelperScene[] = [
  { phase: "cruise", symbol: "✦", label: { ua: "пливу", en: "drifting", fr: "je flotte" } },
  { phase: "cruise", symbol: "♡", label: { ua: "патрулюю", en: "patrolling", fr: "je patrouille" } },
  { phase: "notice", symbol: "!", label: { ua: "помітив", en: "noticed", fr: "j’ai vu" } },
  { phase: "inspect", symbol: "?", label: { ua: "розглядаю", en: "inspecting", fr: "j’observe" } },
  { phase: "cling", symbol: "⌁", label: { ua: "причепився", en: "sticking close", fr: "je m’accroche" } },
  { phase: "think", symbol: "…", label: { ua: "думаю", en: "thinking", fr: "je réfléchis" } },
  { phase: "freeze", symbol: "❄", label: { ua: "морозиво", en: "frosting", fr: "je gèle" } },
  { phase: "smoke", symbol: "☁", label: { ua: "пускаю димок", en: "making a puff", fr: "je fais de la fumée" } },
  { phase: "write", symbol: "✎", label: { ua: "занотовую", en: "taking notes", fr: "je note" } },
  { phase: "peek", symbol: "◉", label: { ua: "підглядаю", en: "peeking", fr: "je jette un œil" } },
  { phase: "doze", symbol: "z", label: { ua: "дрімаю", en: "dozing", fr: "je somnole" } },
  { phase: "giggle", symbol: "♫", label: { ua: "хихочу", en: "giggling", fr: "je glousse" } },
  { phase: "celebrate", symbol: "✧", label: { ua: "готово", en: "all done", fr: "c’est prêt" } },
  { phase: "inspect", symbol: "⌕", label: { ua: "сканую", en: "scanning", fr: "je scanne" } },
  { phase: "freeze", symbol: "✺", label: { ua: "чаклую холод", en: "casting frost", fr: "je lance du givre" } },
  { phase: "cruise", symbol: "✦", label: { ua: "пливу далі", en: "drifting on", fr: "je continue" } },
];

const WAYPOINTS: HelperWaypoint[] = [
  { left: 12, top: 18, tilt: -8 },
  { left: 34, top: 14, tilt: 5 },
  { left: 73, top: 17, tilt: 8 },
  { left: 87, top: 34, tilt: 12 },
  { left: 78, top: 48, tilt: -6 },
  { left: 62, top: 30, tilt: 5 },
  { left: 84, top: 70, tilt: -10 },
  { left: 67, top: 82, tilt: 4 },
  { left: 43, top: 72, tilt: -5 },
  { left: 25, top: 84, tilt: 8 },
  { left: 12, top: 69, tilt: -12 },
  { left: 28, top: 50, tilt: 6 },
  { left: 45, top: 42, tilt: -4 },
  { left: 57, top: 57, tilt: 10 },
  { left: 36, top: 28, tilt: -8 },
  { left: 17, top: 38, tilt: 8 },
];

const PHRASE_PARTS: Record<HelperLanguage, {
  openings: string[];
  targets: string[];
  actions: string[];
  endings: string[];
}> = {
  ua: {
    openings: ["Ого", "Ой", "Так-так", "Ага", "Хм", "Ух ти", "Псс", "Між іншим", "Неймовірно", "Секундочку", "Маю питання", "Тихенько"],
    targets: ["ця картинка", "ця обкладинка", "цей рядок", "цей ярличок", "ця кнопка", "це фото на фоні", "цей маленький напис", "цей блиск", "ця музична картка", "цей дивний колір", "ця пам’ятка", "ця робота автора", "цей куточок сторінки", "ця красива плямка світла", "ця іконка", "ця загадкова тінь"],
    actions: ["виглядає дуже цікаво", "проситься ближче", "має власний характер", "щось мені шепоче", "пахне новою історією", "наче чекає на пригоду", "потребує уважного погляду", "ховає маленький секрет", "заслуговує на оплески", "підказує мені ідею", "ледь не підморгнула", "пливе просто в пам’ять"],
    endings: ["Підійду ще раз.", "Не буду заважати.", "Записую!", "Я це бачив першим.", "Яка краса.", "Тільки нікому не кажіть.", "Треба подумати.", "Оце так знахідка."],
  },
  en: {
    openings: ["Oh", "Well well", "Aha", "Hmm", "Wow", "Psst", "Between us", "Incredible", "One moment", "I have a question", "Quietly now", "Look here"],
    targets: ["this picture", "this cover", "this line", "this label", "this button", "that background photo", "this tiny caption", "that glow", "this music card", "this strange color", "this memory", "this author’s work", "this corner", "that patch of light", "this icon", "that mysterious shadow"],
    actions: ["looks very curious", "is asking me to come closer", "has its own personality", "seems to whisper", "smells like a new story", "is waiting for an adventure", "needs a careful look", "is hiding a tiny secret", "deserves applause", "is giving me an idea", "almost winked at me", "is floating into memory"],
    endings: ["I’ll come back.", "I won’t disturb it.", "Writing that down!", "I saw it first.", "How lovely.", "Don’t tell anyone.", "Let me think.", "What a find."],
  },
  fr: {
    openings: ["Oh", "Tiens tiens", "Ah", "Hmm", "Waouh", "Chut", "Entre nous", "Incroyable", "Un instant", "J’ai une question", "Tout doucement", "Regardez"],
    targets: ["cette image", "cette couverture", "cette ligne", "cette étiquette", "ce bouton", "cette photo de fond", "ce petit texte", "cette lumière", "cette carte musicale", "cette couleur étrange", "ce souvenir", "cette œuvre", "ce coin de page", "cette tache de lumière", "cette icône", "cette ombre mystérieuse"],
    actions: ["a l’air très curieux", "m’appelle doucement", "a sa propre personnalité", "semble me murmurer quelque chose", "sent une nouvelle histoire", "attend une aventure", "mérite un regard attentif", "cache un petit secret", "mérite des applaudissements", "me donne une idée", "a presque fait un clin d’œil", "flotte dans ma mémoire"],
    endings: ["Je reviendrai.", "Je ne dérange pas.", "Je note ça !", "Je l’ai vu en premier.", "Quelle merveille.", "Ne le dites à personne.", "Je réfléchis.", "Quelle trouvaille."],
  },
};

function buildThoughts(language: HelperLanguage) {
  const parts = PHRASE_PARTS[language];
  return Array.from({ length: 1600 }, (_, index) => {
    const opening = parts.openings[index % parts.openings.length];
    const target = parts.targets[Math.floor(index / parts.openings.length) % parts.targets.length];
    const action = parts.actions[Math.floor(index / (parts.openings.length * 2)) % parts.actions.length];
    const ending = parts.endings[Math.floor(index / (parts.openings.length * parts.targets.length)) % parts.endings.length];
    return `${opening}, ${target} ${action}. ${ending}`;
  });
}

const RACKET_COPY: Record<HelperLanguage, { idle: string; active: string }> = {
  ua: { idle: "Взяти ракетку й пограти", active: "Зупинити гру" },
  en: { idle: "Pick up the racket and play", active: "Stop the game" },
  fr: { idle: "Prendre la raquette et jouer", active: "Arrêter le jeu" },
};

const HELPER_HALF_SIZE = { x: 47, y: 43 };
const RACKET_HIT_DISTANCE = 78;

export function PortalHelper({ language }: { language: HelperLanguage }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [position, setPosition] = useState<Point>({ x: 180, y: 220 });
  const [racketPosition, setRacketPosition] = useState<Point>({ x: 0, y: 0 });
  const [isPhysicsActive, setIsPhysicsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const thoughts = useMemo(() => buildThoughts(language), [language]);
  const helperRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  const racketPositionRef = useRef(racketPosition);
  const velocityRef = useRef<Velocity>({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    offset: Point;
    lastPoint: Point;
    lastTime: number;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastRacketHitRef = useRef(0);
  const hitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % SCENES.length);
    }, 9800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    racketPositionRef.current = racketPosition;
  }, [racketPosition]);

  useEffect(() => {
    if (!isPhysicsActive || isDragging) return;

    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      const next = {
        x: positionRef.current.x + velocityRef.current.x * delta,
        y: positionRef.current.y + velocityRef.current.y * delta,
      };
      const minX = HELPER_HALF_SIZE.x + 8;
      const minY = HELPER_HALF_SIZE.y + 8;
      const maxX = Math.max(minX, window.innerWidth - HELPER_HALF_SIZE.x - 8);
      const maxY = Math.max(minY, window.innerHeight - HELPER_HALF_SIZE.y - 8);

      if (next.x <= minX || next.x >= maxX) {
        next.x = Math.max(minX, Math.min(maxX, next.x));
        velocityRef.current.x *= -0.92;
      }
      if (next.y <= minY || next.y >= maxY) {
        next.y = Math.max(minY, Math.min(maxY, next.y));
        velocityRef.current.y *= -0.92;
      }

      if (isGameActive && time - lastRacketHitRef.current > 180) {
        const dx = next.x - racketPositionRef.current.x;
        const dy = next.y - racketPositionRef.current.y;
        const distance = Math.hypot(dx, dy);
        if (distance < RACKET_HIT_DISTANCE) {
          const length = distance || 1;
          const speed = Math.max(390, Math.hypot(velocityRef.current.x, velocityRef.current.y) * 1.04);
          velocityRef.current = {
            x: (dx / length) * speed,
            y: (dy / length) * speed,
          };
          next.x = racketPositionRef.current.x + (dx / length) * (RACKET_HIT_DISTANCE + 4);
          next.y = racketPositionRef.current.y + (dy / length) * (RACKET_HIT_DISTANCE + 4);
          lastRacketHitRef.current = time;
          setIsHit(true);
          if (hitTimerRef.current !== null) window.clearTimeout(hitTimerRef.current);
          hitTimerRef.current = window.setTimeout(() => setIsHit(false), 260);
        }
      }

      positionRef.current = next;
      setPosition(next);
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    };
  }, [isDragging, isGameActive, isPhysicsActive]);

  useEffect(() => {
    if (!isGameActive) return;
    const handlePointerMove = (event: PointerEvent) => {
      const next = { x: event.clientX, y: event.clientY };
      racketPositionRef.current = next;
      setRacketPosition(next);
    };
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      setIsGameActive(false);
      setIsPhysicsActive(false);
      setIsHit(false);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isGameActive]);

  useEffect(() => {
    return () => {
      if (hitTimerRef.current !== null) window.clearTimeout(hitTimerRef.current);
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const readHelperCenter = () => {
    const rect = helperRef.current?.getBoundingClientRect();
    return rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : positionRef.current;
  };

  const handleHelperPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const center = readHelperCenter();
    const point = { x: event.clientX, y: event.clientY };
    positionRef.current = center;
    setPosition(center);
    setIsPhysicsActive(true);
    setIsDragging(true);
    dragRef.current = {
      pointerId: event.pointerId,
      offset: { x: point.x - center.x, y: point.y - center.y },
      lastPoint: point,
      lastTime: performance.now(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHelperPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const now = performance.now();
    const next = {
      x: event.clientX - drag.offset.x,
      y: event.clientY - drag.offset.y,
    };
    const elapsed = Math.max(8, now - drag.lastTime);
    velocityRef.current = {
      x: ((event.clientX - drag.lastPoint.x) / elapsed) * 1000,
      y: ((event.clientY - drag.lastPoint.y) / elapsed) * 1000,
    };
    drag.lastPoint = { x: event.clientX, y: event.clientY };
    drag.lastTime = now;
    positionRef.current = next;
    setPosition(next);
  };

  const handleHelperPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setIsDragging(false);
    setIsPhysicsActive(true);
    velocityRef.current = {
      x: Math.max(-950, Math.min(950, velocityRef.current.x)),
      y: Math.max(-950, Math.min(950, velocityRef.current.y)),
    };
  };

  const handleRacketClick = () => {
    if (isGameActive) {
      setIsGameActive(false);
      setIsPhysicsActive(false);
      setIsHit(false);
      return;
    }
    const center = readHelperCenter();
    const nextRacketPosition = {
      x: Math.min(window.innerWidth - 52, Math.max(52, center.x + 150)),
      y: Math.min(window.innerHeight - 70, Math.max(70, center.y + 30)),
    };
    positionRef.current = center;
    setPosition(center);
    racketPositionRef.current = nextRacketPosition;
    setRacketPosition(nextRacketPosition);
    velocityRef.current = { x: 250, y: -180 };
    setIsPhysicsActive(true);
    setIsGameActive(true);
  };

  const scene = SCENES[sceneIndex];
  const waypoint = WAYPOINTS[sceneIndex];
  const thought = thoughts[sceneIndex % thoughts.length];
  const actorStyle = {
    left: isPhysicsActive ? `${position.x}px` : `${waypoint.left}%`,
    top: isPhysicsActive ? `${position.y}px` : `${waypoint.top}%`,
    "--helper-tilt": `${waypoint.tilt}deg`,
  } as CSSProperties;
  const racketStyle = isGameActive
    ? {
        left: `${racketPosition.x}px`,
        top: `${racketPosition.y}px`,
        "--racket-angle": `${Math.atan2(velocityRef.current.y, velocityRef.current.x) * (180 / Math.PI) + 90}deg`,
      } as CSSProperties
    : undefined;

  return (
    <div className="authors-world-portal-helper-layer pointer-events-none fixed inset-0">
      <div
        ref={helperRef}
        className={`authors-world-portal-helper authors-world-portal-helper-phase-${scene.phase} ${isPhysicsActive ? "authors-world-portal-helper-interactive" : ""} ${isDragging ? "is-dragging" : ""} ${isHit ? "is-hit" : ""}`}
        style={actorStyle}
        data-helper-scene={scene.phase}
        data-helper-side={waypoint.left > 60 ? "left" : "right"}
        role="button"
        tabIndex={0}
        aria-label={language === "ua" ? "Схопити помічника" : language === "fr" ? "Attraper l’assistant" : "Grab the helper"}
        onPointerDown={handleHelperPointerDown}
        onPointerMove={handleHelperPointerMove}
        onPointerUp={handleHelperPointerUp}
        onPointerCancel={handleHelperPointerUp}
      >
        <div className="authors-world-portal-helper-thought">
          <span className="authors-world-portal-helper-thought-tail" />
          <span className="authors-world-portal-helper-thought-label">{scene.label[language]}</span>
          <span className="authors-world-portal-helper-thought-text">{thought}</span>
          {scene.phase === "think" && <span className="authors-world-portal-helper-thought-dots">•••</span>}
        </div>
        <span className="authors-world-portal-helper-signal">{scene.symbol}</span>
        <span className="authors-world-portal-helper-trail authors-world-portal-helper-trail-one" />
        <span className="authors-world-portal-helper-trail authors-world-portal-helper-trail-two" />
        <span className="authors-world-portal-helper-trail authors-world-portal-helper-trail-three" />
        <span className="authors-world-portal-helper-frost" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
        <span className="authors-world-portal-helper-smoke authors-world-portal-helper-smoke-one" />
        <span className="authors-world-portal-helper-smoke authors-world-portal-helper-smoke-two" />
        <span className="authors-world-portal-helper-smoke authors-world-portal-helper-smoke-three" />
        <span className="authors-world-portal-helper-cling-lines" aria-hidden="true">⌁</span>
        <span className="authors-world-portal-helper-wing authors-world-portal-helper-wing-left" />
        <span className="authors-world-portal-helper-wing authors-world-portal-helper-wing-right" />
        <span className="authors-world-portal-helper-body">
          <span className="authors-world-portal-helper-eye authors-world-portal-helper-eye-left" />
          <span className="authors-world-portal-helper-eye authors-world-portal-helper-eye-right" />
          <span className="authors-world-portal-helper-brow authors-world-portal-helper-brow-left" />
          <span className="authors-world-portal-helper-brow authors-world-portal-helper-brow-right" />
          <span className="authors-world-portal-helper-cheek authors-world-portal-helper-cheek-left" />
          <span className="authors-world-portal-helper-cheek authors-world-portal-helper-cheek-right" />
          <span className="authors-world-portal-helper-smile" />
        </span>
        <span className="authors-world-portal-helper-orbit authors-world-portal-helper-orbit-one">·</span>
        <span className="authors-world-portal-helper-orbit authors-world-portal-helper-orbit-two">✦</span>
      </div>
      <button
        type="button"
        className={`authors-world-portal-racket ${isGameActive ? "is-active" : ""}`}
        style={racketStyle}
        onClick={handleRacketClick}
        onContextMenu={(event) => event.preventDefault()}
        aria-pressed={isGameActive}
        aria-label={isGameActive ? RACKET_COPY[language].active : RACKET_COPY[language].idle}
        title={isGameActive ? RACKET_COPY[language].active : RACKET_COPY[language].idle}
      >
        <span className="authors-world-portal-racket-art" aria-hidden="true">
          <span className="authors-world-portal-racket-head"><span /></span>
          <span className="authors-world-portal-racket-handle" />
        </span>
      </button>
    </div>
  );
}