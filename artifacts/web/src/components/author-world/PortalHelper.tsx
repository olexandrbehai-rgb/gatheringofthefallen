import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

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
  const parts = PHRASE_PARTS[language] ?? PHRASE_PARTS.ua;
  return Array.from({ length: 1600 }, (_, index) => {
    const opening = parts.openings[index % parts.openings.length];
    const target = parts.targets[Math.floor(index / parts.openings.length) % parts.targets.length];
    const action = parts.actions[Math.floor(index / (parts.openings.length * 2)) % parts.actions.length];
    const ending = parts.endings[Math.floor(index / (parts.openings.length * parts.targets.length)) % parts.endings.length];
    return `${opening}, ${target} ${action}. ${ending}`;
  });
}

const HELPER_HALF_SIZE = { x: 47, y: 43 };

export function PortalHelper({ language }: { language: HelperLanguage }) {
  const safeLanguage: HelperLanguage = language === "en" || language === "fr" ? language : "ua";
  const [sceneIndex, setSceneIndex] = useState(0);
  const [position, setPosition] = useState<Point>({ x: 180, y: 220 });
  const [isPhysicsActive, setIsPhysicsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const thoughts = useMemo(() => buildThoughts(safeLanguage), [safeLanguage]);
  const helperRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  const velocityRef = useRef<Velocity>({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    offset: Point;
    lastPoint: Point;
    lastTime: number;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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
    if (!isPhysicsActive || isDragging) return;

    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      const next = {
        x: positionRef.current.x + velocityRef.current.x * delta,
        y: positionRef.current.y + velocityRef.current.y * delta,
      };
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const minX = HELPER_HALF_SIZE.x;
      const minY = HELPER_HALF_SIZE.y;
      const maxX = Math.max(minX, viewportWidth - HELPER_HALF_SIZE.x);
      const maxY = Math.max(minY, viewportHeight - HELPER_HALF_SIZE.y);

      if (next.x <= minX || next.x >= maxX) {
        next.x = Math.max(minX, Math.min(maxX, next.x));
        velocityRef.current.x *= -0.92;
      }
      if (next.y <= minY || next.y >= maxY) {
        next.y = Math.max(minY, Math.min(maxY, next.y));
        velocityRef.current.y *= -0.92;
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
  }, [isDragging, isPhysicsActive]);

  useEffect(() => {
    return () => {
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

  const scene = SCENES[sceneIndex];
  const waypoint = WAYPOINTS[sceneIndex];
  const thought = thoughts[sceneIndex % thoughts.length];
  const actorStyle = {
    left: isPhysicsActive ? `${position.x}px` : `${waypoint.left}%`,
    top: isPhysicsActive ? `${position.y}px` : `${waypoint.top}%`,
    "--helper-tilt": `${waypoint.tilt}deg`,
  } as CSSProperties;
  return createPortal(
    <div className="authors-world-portal-helper-layer pointer-events-none fixed inset-0">
      <div
        ref={helperRef}
        className={`authors-world-portal-helper authors-world-portal-helper-phase-${scene.phase} ${isPhysicsActive ? "authors-world-portal-helper-interactive" : ""} ${isDragging ? "is-dragging" : ""}`}
        style={actorStyle}
        data-helper-scene={scene.phase}
        data-helper-side={waypoint.left > 60 ? "left" : "right"}
        role="button"
        tabIndex={0}
        aria-label={safeLanguage === "ua" ? "Схопити помічника" : safeLanguage === "fr" ? "Attraper l’assistant" : "Grab the helper"}
        onPointerDown={handleHelperPointerDown}
        onPointerMove={handleHelperPointerMove}
        onPointerUp={handleHelperPointerUp}
        onPointerCancel={handleHelperPointerUp}
      >
        <div className="authors-world-portal-helper-thought">
          <span className="authors-world-portal-helper-thought-tail" />
          <span className="authors-world-portal-helper-thought-label">{scene.label[safeLanguage]}</span>
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
    </div>,
    document.body,
  );
}