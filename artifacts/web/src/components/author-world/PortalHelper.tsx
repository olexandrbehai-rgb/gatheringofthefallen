import { useEffect, useState, type CSSProperties } from "react";

type HelperPhase = "cruise" | "notice" | "inspect" | "think" | "write" | "celebrate";

type HelperScene = {
  phase: HelperPhase;
  symbol: string;
  label: string;
};

type HelperWaypoint = {
  left: number;
  top: number;
  tilt: number;
};

const SCENES: HelperScene[] = [
  { phase: "cruise", symbol: "✦", label: "мандрую" },
  { phase: "notice", symbol: "!", label: "помітив" },
  { phase: "inspect", symbol: "?", label: "розглядаю" },
  { phase: "think", symbol: "…", label: "думаю" },
  { phase: "write", symbol: "✎", label: "занотовую" },
  { phase: "celebrate", symbol: "✧", label: "готово" },
  { phase: "cruise", symbol: "♡", label: "перевіряю" },
  { phase: "think", symbol: "☼", label: "вигадую" },
];

const WAYPOINTS: HelperWaypoint[] = [
  { left: 13, top: 18, tilt: -8 },
  { left: 74, top: 17, tilt: 8 },
  { left: 84, top: 44, tilt: 12 },
  { left: 68, top: 76, tilt: -8 },
  { left: 28, top: 80, tilt: 5 },
  { left: 16, top: 52, tilt: -12 },
  { left: 47, top: 30, tilt: 5 },
  { left: 52, top: 66, tilt: -5 },
];

const DEFAULT_THOUGHTS = [
  "Що тут сьогодні змінилося?",
  "О, нова робота!",
  "Цікаво, що автор хотів сказати...",
  "Треба це запам’ятати.",
  "Записую у свою маленьку пам’ять.",
  "Здається, я знайшов ідею!",
];

export function PortalHelper({
  thoughts = DEFAULT_THOUGHTS,
}: {
  thoughts?: string[];
}) {
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % SCENES.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  const scene = SCENES[sceneIndex];
  const waypoint = WAYPOINTS[sceneIndex];
  const thought = thoughts[sceneIndex % thoughts.length] ?? DEFAULT_THOUGHTS[sceneIndex % DEFAULT_THOUGHTS.length];
  const actorStyle = {
    left: `${waypoint.left}%`,
    top: `${waypoint.top}%`,
    "--helper-tilt": `${waypoint.tilt}deg`,
  } as CSSProperties;

  return (
    <div aria-hidden="true" className="authors-world-portal-helper-layer pointer-events-none fixed inset-0">
      <div
        className={`authors-world-portal-helper authors-world-portal-helper-phase-${scene.phase}`}
        style={actorStyle}
        data-helper-scene={scene.phase}
        data-helper-side={waypoint.left > 60 ? "left" : "right"}
      >
        <div className="authors-world-portal-helper-thought">
          <span className="authors-world-portal-helper-thought-tail" />
          <span className="authors-world-portal-helper-thought-label">{scene.label}</span>
          <span className="authors-world-portal-helper-thought-text">{thought}</span>
          {scene.phase === "think" && <span className="authors-world-portal-helper-thought-dots">•••</span>}
        </div>
        <span className="authors-world-portal-helper-signal">{scene.symbol}</span>
        <span className="authors-world-portal-helper-trail authors-world-portal-helper-trail-one" />
        <span className="authors-world-portal-helper-trail authors-world-portal-helper-trail-two" />
        <span className="authors-world-portal-helper-trail authors-world-portal-helper-trail-three" />
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
    </div>
  );
}