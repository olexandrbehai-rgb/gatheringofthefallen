import { useMemo } from "react";

type Bit = {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  ember: boolean;
  sway: number;
};

function makeBits(count: number): Bit[] {
  return Array.from({ length: count }).map(() => {
    const ember = Math.random() < 0.32;
    return {
      left: Math.random() * 100,
      size: ember ? Math.random() * 3 + 2 : Math.random() * 3 + 1,
      duration: Math.random() * 12 + 12,
      delay: Math.random() * 18,
      drift: (Math.random() - 0.5) * 120,
      sway: Math.random() * 2 + 1.5,
      ember,
    };
  });
}

export function FallingAsh({ count = 55 }: { count?: number }) {
  const bits = useMemo(() => makeBits(count), [count]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 3 }}
      aria-hidden="true"
    >
      {bits.map((b, i) => (
        <span
          key={i}
          className={b.ember ? "ash-bit ember" : "ash-bit"}
          style={
            {
              left: `${b.left}vw`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animationDuration: `${b.duration}s, ${b.sway}s`,
              animationDelay: `${b.delay}s, ${b.delay}s`,
              ["--drift" as string]: `${b.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
