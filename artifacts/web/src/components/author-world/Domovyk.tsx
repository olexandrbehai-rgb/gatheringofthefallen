import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/LanguageContext";

type Gaze = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DomovykFigure({ gaze, alt }: { gaze: Gaze; alt: string }) {
  const headTilt = gaze.x * 6 + gaze.y * 1.5;
  const leftPupilX = 72 + gaze.x * 5.5;
  const rightPupilX = 108 + gaze.x * 5.5;
  const pupilY = 82 + gaze.y * 5;

  return (
    <div className="domovyk-character">
      <div className="domovyk-shadow" />
      <div className="domovyk-body-bob">
        <div className="domovyk-head-sway">
          <div className="domovyk-head" style={{ transform: `rotate(${headTilt.toFixed(2)}deg)` }}>
            <svg viewBox="0 0 180 280" role="img" aria-label={alt} className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="domovyk-hood" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#d9a86c" />
                  <stop offset="0.5" stopColor="#986146" />
                  <stop offset="1" stopColor="#422b38" />
                </linearGradient>
                <linearGradient id="domovyk-coat" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#70486d" />
                  <stop offset="0.52" stopColor="#34264d" />
                  <stop offset="1" stopColor="#111629" />
                </linearGradient>
                <radialGradient id="domovyk-eye" cx="36%" cy="28%" r="70%">
                  <stop offset="0" stopColor="#fff" />
                  <stop offset="0.72" stopColor="#d9faff" />
                  <stop offset="1" stopColor="#7fc9e4" />
                </radialGradient>
                <filter id="domovyk-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d="M48 91C23 84 22 58 40 48c8-5 17-3 25 5" fill="#8e5c56" stroke="#e3b676" strokeWidth="3" />
              <path d="M132 91c25-7 26-33 8-43-8-5-17-3-25 5" fill="#8e5c56" stroke="#e3b676" strokeWidth="3" />
              <ellipse cx="90" cy="78" rx="51" ry="58" fill="url(#domovyk-hood)" stroke="#f3c980" strokeWidth="3" />
              <path d="M38 68c2-31 23-56 52-57 32-1 53 23 53 58-13-9-25-13-37-13-23 0-43 10-68 12Z" fill="#4d3254" stroke="#d8a56b" strokeWidth="3" />
              <path d="M50 36c10-21 25-29 41-29 19 0 34 9 42 28l-15 6c-15-8-37-9-55 0Z" fill="#805071" opacity="0.82" />
              <path d="M78 13c8-12 20-14 31-7l-8 17Z" fill="#d8a56b" stroke="#f3c980" strokeWidth="2" />

              <path d="M62 123c-7 7-13 14-17 23l-23-13-9 14 29 31c11-5 22-13 32-24l-1-29Z" fill="#8e5c56" stroke="#e3b676" strokeWidth="2" className="domovyk-arm domovyk-arm-left" />
              <path d="M118 123c7 7 13 14 17 23l23-13 9 14-29 31c-11-5-22-13-32-24l1-29Z" fill="#8e5c56" stroke="#e3b676" strokeWidth="2" className="domovyk-arm domovyk-arm-right" />
              <path d="M52 125c10-12 23-18 38-18s28 6 38 18l17 93c-13 15-32 22-55 22s-42-7-55-22Z" fill="url(#domovyk-coat)" stroke="#a978b7" strokeWidth="3" />
              <path d="M58 183c19 15 45 15 64 0l6 35c-10 7-23 10-38 10s-28-3-38-10Z" fill="#6f467d" opacity="0.76" />
              <path d="M88 119h4v93h-4Z" fill="#f3c980" opacity="0.7" />
              <circle cx="90" cy="126" r="7" fill="#75eff4" filter="url(#domovyk-glow)" />
              <path d="M68 226v28h-19c-8 0-12-4-12-9 0-5 5-8 13-10l18-9Zm44 0 18 9c8 2 13 5 13 10 0 5-4 9-12 9h-19Z" fill="#182238" stroke="#75eff4" strokeWidth="2" />
              <path d="M43 253h27M111 253h27" stroke="#f3c980" strokeWidth="4" strokeLinecap="round" />

              <ellipse cx="72" cy="82" rx="20" ry="26" fill="url(#domovyk-eye)" stroke="#9ef8ff" strokeWidth="2.5" />
              <ellipse cx="108" cy="82" rx="20" ry="26" fill="url(#domovyk-eye)" stroke="#9ef8ff" strokeWidth="2.5" />
              <circle cx={leftPupilX} cy={pupilY} r="9" fill="#211b38" />
              <circle cx={rightPupilX} cy={pupilY} r="9" fill="#211b38" />
              <circle cx={leftPupilX - 3} cy={pupilY - 4} r="3.5" fill="#fff" />
              <circle cx={rightPupilX - 3} cy={pupilY - 4} r="3.5" fill="#fff" />
              <circle cx={leftPupilX + 4} cy={pupilY + 4} r="1.5" fill="#75eff4" />
              <circle cx={rightPupilX + 4} cy={pupilY + 4} r="1.5" fill="#75eff4" />
              <path d="M50 53c10-8 20-10 31-6M99 47c11-4 21-2 31 6" fill="none" stroke="#3a2845" strokeWidth="4" strokeLinecap="round" />
              <path d="M87 100c2 3 5 3 7 0" fill="none" stroke="#9a5b64" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M75 111c9 8 21 8 30 0" fill="none" stroke="#4d273e" strokeWidth="4" strokeLinecap="round" />
              <path d="M80 111c7 4 13 4 20 0" fill="none" stroke="#ffd1d7" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="50" cy="101" rx="9" ry="5" fill="#ff9a9f" opacity="0.62" />
              <ellipse cx="130" cy="101" rx="9" ry="5" fill="#ff9a9f" opacity="0.62" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Domovyk({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pointerRef = useRef({ clientX: 0, clientY: 0 });
  const [gaze, setGaze] = useState<Gaze>({ x: 0, y: -0.12 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = { clientX: event.clientX, clientY: event.clientY };
      if (pointerFrameRef.current !== null) return;
      pointerFrameRef.current = window.requestAnimationFrame(() => {
        pointerFrameRef.current = null;
        const rect = rootRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height * 0.3;
        setGaze({
          x: clamp((pointerRef.current.clientX - centerX) / (rect.width * 0.55), -1, 1),
          y: clamp((pointerRef.current.clientY - centerY) / (rect.height * 0.7), -1, 1),
        });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className={`domovyk-layer ${compact ? "domovyk-layer-compact" : ""}`}>
      <div ref={rootRef} className={`domovyk-patrol ${compact ? "domovyk-patrol-compact" : ""}`}>
          <DomovykFigure gaze={gaze} alt={t("ui.domovykAlt")} />
      </div>
    </div>
  );
}