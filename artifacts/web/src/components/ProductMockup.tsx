/**
 * ProductMockup — рендерить SVG-силует виробу (футболка / худі / кепка / чашка ...)
 * заданого кольору з накладеним зверху лого або артом.
 * Так у каталозі видно саме виріб, а не просто картинку арту.
 */

export type MockupShape =
  | "tee"
  | "tee-crop"
  | "longsleeve"
  | "hoodie"
  | "zip-hoodie"
  | "bomber"
  | "cap"
  | "beanie"
  | "scarf"
  | "tote"
  | "mug"
  | "case"
  | "notebook"
  | "poster"
  | "vinyl"
  | "flag"
  | "tapestry"
  | "box"
  | "patch"
  | "mask"
  | "socks"
  | "bracelet"
  | "necklace"
  | "pin"
  | "sticker"
  | "pick"
  | "key"
  | "figurine";

const PRINT_BOX: Record<MockupShape, { x: number; y: number; w: number; h: number }> = {
  tee: { x: 110, y: 110, w: 180, h: 180 },
  "tee-crop": { x: 110, y: 110, w: 180, h: 130 },
  longsleeve: { x: 130, y: 110, w: 140, h: 180 },
  hoodie: { x: 120, y: 140, w: 160, h: 170 },
  "zip-hoodie": { x: 120, y: 150, w: 75, h: 160 },
  bomber: { x: 120, y: 140, w: 160, h: 150 },
  cap: { x: 130, y: 130, w: 140, h: 70 },
  beanie: { x: 130, y: 130, w: 140, h: 100 },
  scarf: { x: 90, y: 150, w: 220, h: 100 },
  tote: { x: 120, y: 130, w: 160, h: 180 },
  mug: { x: 110, y: 130, w: 140, h: 150 },
  case: { x: 150, y: 110, w: 100, h: 200 },
  notebook: { x: 130, y: 110, w: 140, h: 200 },
  poster: { x: 100, y: 90, w: 200, h: 240 },
  vinyl: { x: 110, y: 110, w: 180, h: 180 },
  flag: { x: 100, y: 110, w: 200, h: 200 },
  tapestry: { x: 110, y: 100, w: 180, h: 220 },
  box: { x: 110, y: 130, w: 180, h: 160 },
  patch: { x: 120, y: 120, w: 160, h: 160 },
  mask: { x: 110, y: 140, w: 180, h: 80 },
  socks: { x: 150, y: 200, w: 100, h: 80 },
  bracelet: { x: 130, y: 190, w: 140, h: 40 },
  necklace: { x: 170, y: 200, w: 60, h: 60 },
  pin: { x: 140, y: 140, w: 120, h: 120 },
  sticker: { x: 120, y: 120, w: 160, h: 160 },
  pick: { x: 160, y: 160, w: 80, h: 80 },
  key: { x: 160, y: 170, w: 80, h: 80 },
  figurine: { x: 150, y: 130, w: 100, h: 200 },
};

interface Props {
  shape: MockupShape;
  color: string;
  print?: string;
  printOpacity?: number;
}

export function ProductMockup({ shape, color, print, printOpacity = 0.9 }: Props) {
  const isLight = ["#f3f4f6", "#ffffff", "#e5e7eb", "#d6c7b2"].includes(color.toLowerCase());
  const stroke = isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.18)";
  const shade = isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.08)";
  const box = PRINT_BOX[shape];

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`bg-${shape}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0014" />
          <stop offset="100%" stopColor="#10001f" />
        </linearGradient>
        <radialGradient id={`glow-${shape}`} cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="rgba(138,43,226,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <clipPath id={`clip-${shape}`}>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="6" />
        </clipPath>
      </defs>

      <rect width="400" height="400" fill={`url(#bg-${shape})`} />
      <rect width="400" height="400" fill={`url(#glow-${shape})`} />

      <g fill={color} stroke={stroke} strokeWidth="2" strokeLinejoin="round">
        {renderShape(shape, shade)}
      </g>

      {print && (
        <image
          href={print}
          x={box.x}
          y={box.y}
          width={box.w}
          height={box.h}
          preserveAspectRatio="xMidYMid meet"
          opacity={printOpacity}
          clipPath={`url(#clip-${shape})`}
          style={{ mixBlendMode: isLight ? "multiply" : "screen" }}
        />
      )}
    </svg>
  );
}

function renderShape(shape: MockupShape, shade: string) {
  switch (shape) {
    case "tee":
      return (
        <>
          <path d="M120,90 L160,70 Q200,100 240,70 L280,90 L320,140 L290,170 L290,330 Q290,340 280,340 L120,340 Q110,340 110,330 L110,170 L80,140 Z" />
          <path d="M160,70 Q200,100 240,70" fill="none" stroke={shade} strokeWidth="2" />
        </>
      );
    case "tee-crop":
      return (
        <>
          <path d="M120,90 L160,70 Q200,100 240,70 L280,90 L320,140 L290,170 L290,240 Q290,250 280,250 L120,250 Q110,250 110,240 L110,170 L80,140 Z" />
          <path d="M160,70 Q200,100 240,70" fill="none" stroke={shade} strokeWidth="2" />
        </>
      );
    case "longsleeve":
      return (
        <>
          <path d="M130,90 L160,75 Q200,100 240,75 L270,90 L320,120 L340,260 L300,270 L300,340 Q300,348 292,348 L108,348 Q100,348 100,340 L100,270 L60,260 L80,120 Z" />
          <path d="M160,75 Q200,100 240,75" fill="none" stroke={shade} strokeWidth="2" />
        </>
      );
    case "hoodie":
      return (
        <>
          <path d="M150,90 Q200,50 250,90 L290,110 L330,160 L300,190 L300,340 Q300,350 290,350 L110,350 Q100,350 100,340 L100,190 L70,160 L110,110 Z" />
          <path d="M150,90 Q200,130 250,90 Q220,150 200,160 Q180,150 150,90 Z" fill={shade} stroke="none" />
          <line x1="200" y1="160" x2="200" y2="240" stroke={shade} strokeWidth="2" />
        </>
      );
    case "zip-hoodie":
      return (
        <>
          <path d="M150,90 Q200,50 250,90 L290,110 L330,160 L300,190 L300,340 Q300,350 290,350 L110,350 Q100,350 100,340 L100,190 L70,160 L110,110 Z" />
          <path d="M150,90 Q200,130 250,90 Q220,150 200,160 Q180,150 150,90 Z" fill={shade} stroke="none" />
          <line x1="200" y1="150" x2="200" y2="345" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeDasharray="4 3" />
        </>
      );
    case "bomber":
      return (
        <>
          <path d="M130,90 L160,75 L240,75 L270,90 L310,130 L290,170 L290,320 Q290,330 280,330 L120,330 Q110,330 110,320 L110,170 L90,130 Z" />
          <line x1="200" y1="80" x2="200" y2="325" stroke={shade} strokeWidth="2" />
          <rect x="110" y="310" width="180" height="20" fill={shade} stroke="none" />
        </>
      );
    case "cap":
      return (
        <>
          <path d="M80,210 Q200,90 320,210 L320,230 Q200,210 80,230 Z" />
          <path d="M80,230 Q200,290 320,230 L320,250 Q200,270 80,250 Z" fill={shade} stroke="none" />
        </>
      );
    case "beanie":
      return (
        <>
          <path d="M110,150 Q200,80 290,150 L290,250 Q200,270 110,250 Z" />
          <rect x="110" y="240" width="180" height="22" fill={shade} stroke="none" />
        </>
      );
    case "scarf":
      return <rect x="60" y="140" width="280" height="120" rx="6" />;
    case "tote":
      return (
        <>
          <path d="M120,140 Q145,90 175,140" fill="none" />
          <path d="M225,140 Q255,90 280,140" fill="none" />
          <rect x="100" y="140" width="200" height="200" rx="6" />
        </>
      );
    case "mug":
      return (
        <>
          <rect x="100" y="120" width="170" height="170" rx="14" />
          <path d="M270,150 q40,0 40,45 q0,45 -40,45" fill="none" />
        </>
      );
    case "case":
      return <rect x="140" y="80" width="120" height="240" rx="22" />;
    case "notebook":
      return (
        <>
          <rect x="120" y="80" width="160" height="240" rx="6" />
          <line x1="140" y1="80" x2="140" y2="320" stroke={shade} strokeWidth="2" />
        </>
      );
    case "poster":
      return <rect x="90" y="70" width="220" height="280" rx="4" />;
    case "vinyl":
      return (
        <>
          <circle cx="200" cy="200" r="150" />
          <circle cx="200" cy="200" r="55" fill={shade} stroke="none" />
          <circle cx="200" cy="200" r="6" fill="#000" />
        </>
      );
    case "flag":
      return <rect x="80" y="90" width="240" height="220" rx="2" />;
    case "tapestry":
      return (
        <>
          <rect x="100" y="80" width="200" height="250" rx="2" />
          <rect x="100" y="80" width="200" height="10" fill={shade} stroke="none" />
        </>
      );
    case "box":
      return (
        <>
          <rect x="90" y="120" width="220" height="190" rx="4" />
          <rect x="90" y="120" width="220" height="40" fill={shade} stroke="none" />
        </>
      );
    case "patch":
      return <rect x="110" y="110" width="180" height="180" rx="14" />;
    case "mask":
      return <path d="M70,140 Q200,100 330,140 Q310,230 200,240 Q90,230 70,140 Z" />;
    case "socks":
      return (
        <>
          <path d="M150,100 L250,100 L250,260 Q250,290 290,300 L290,330 L150,330 L150,300 Q190,290 190,260 Z" />
        </>
      );
    case "bracelet":
      return <path d="M70,200 Q200,160 330,200 Q200,240 70,200 Z" />;
    case "necklace":
      return (
        <>
          <path d="M100,100 Q200,260 300,100" fill="none" stroke={shade} strokeWidth="3" />
          <circle cx="200" cy="245" r="40" />
        </>
      );
    case "pin":
      return <circle cx="200" cy="200" r="100" />;
    case "sticker":
      return <rect x="110" y="110" width="180" height="180" rx="20" />;
    case "pick":
      return <path d="M200,140 Q260,160 240,240 Q200,290 160,240 Q140,160 200,140 Z" />;
    case "key":
      return (
        <>
          <circle cx="200" cy="170" r="50" />
          <rect x="190" y="200" width="20" height="100" />
        </>
      );
    case "figurine":
      return (
        <>
          <ellipse cx="200" cy="320" rx="80" ry="14" fill={shade} stroke="none" />
          <path d="M160,100 Q200,70 240,100 L260,200 L250,310 L150,310 L140,200 Z" />
        </>
      );
  }
}
