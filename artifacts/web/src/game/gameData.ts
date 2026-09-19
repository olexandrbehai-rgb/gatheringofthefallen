export type GameRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type EnemySeed = {
  x: number;
  y: number;
  minX: number;
  maxX: number;
  speed: number;
};

export type RelicSeed = {
  x: number;
  y: number;
};

export type GameLevel = {
  name: string;
  subtitle: string;
  width: number;
  palette: {
    skyTop: string;
    skyBottom: string;
    glow: string;
    ground: string;
    accent: string;
  };
  platforms: GameRect[];
  hazards: GameRect[];
  enemies: EnemySeed[];
  relics: RelicSeed[];
  goalX: number;
  checkpoint: string;
};

export const GAME_PHYSICS = {
  playerSpeed: 235,
  sprintMultiplier: 1.35,
  gravity: 1050,
  jumpSpeed: 640,
  playerWidth: 24,
  playerHeight: 40,
  coyoteTime: 0.12,
  jumpBufferTime: 0.14,
} as const;

const floor = (width: number): GameRect => ({ x: 0, y: 476, w: width, h: 64 });

const palettes = [
  { skyTop: "#0b1322", skyBottom: "#24161d", glow: "#d87543", ground: "#28202c", accent: "#59d2d6" },
  { skyTop: "#13102a", skyBottom: "#32192a", glow: "#a955cb", ground: "#302039", accent: "#d58cff" },
  { skyTop: "#081b20", skyBottom: "#182c25", glow: "#d6a74e", ground: "#24352d", accent: "#d9d173" },
  { skyTop: "#160c19", skyBottom: "#3d1820", glow: "#e45046", ground: "#321d28", accent: "#ff9366" },
];

const BASE_LEVELS: GameLevel[] = [
  {
    name: "The Drowned Gate",
    subtitle: "Ворота, що пам’ятають кожен крок",
    width: 2400,
    palette: palettes[0],
    platforms: [
      floor(2400),
      { x: 270, y: 390, w: 170, h: 18 }, { x: 540, y: 330, w: 145, h: 18 },
      { x: 790, y: 405, w: 190, h: 18 }, { x: 1120, y: 350, w: 160, h: 18 },
      { x: 1400, y: 290, w: 180, h: 18 }, { x: 1710, y: 380, w: 200, h: 18 },
      { x: 2030, y: 320, w: 170, h: 18 },
    ],
    hazards: [{ x: 650, y: 452, w: 95, h: 24 }, { x: 1285, y: 450, w: 105, h: 26 }, { x: 1915, y: 450, w: 100, h: 26 }],
    enemies: [{ x: 520, y: 438, minX: 450, maxX: 760, speed: 38 }, { x: 1040, y: 438, minX: 950, maxX: 1320, speed: 44 }, { x: 1780, y: 438, minX: 1650, maxX: 2020, speed: 48 }],
    relics: [{ x: 350, y: 350 }, { x: 610, y: 290 }, { x: 1180, y: 310 }, { x: 1490, y: 250 }, { x: 1800, y: 340 }],
    goalX: 2260,
    checkpoint: "Затоплені ворота",
  },
  {
    name: "Ashen Orchard",
    subtitle: "Тут навіть коріння не забуло вогонь",
    width: 2550,
    palette: palettes[1],
    platforms: [
      floor(2550),
      { x: 190, y: 370, w: 160, h: 18 }, { x: 430, y: 270, w: 130, h: 18 },
      { x: 700, y: 350, w: 220, h: 18 }, { x: 1030, y: 245, w: 160, h: 18 },
      { x: 1280, y: 365, w: 170, h: 18 }, { x: 1580, y: 300, w: 200, h: 18 },
      { x: 1900, y: 390, w: 145, h: 18 }, { x: 2180, y: 280, w: 190, h: 18 },
    ],
    hazards: [{ x: 565, y: 450, w: 110, h: 28 }, { x: 1470, y: 450, w: 95, h: 28 }, { x: 2050, y: 450, w: 110, h: 28 }],
    enemies: [{ x: 340, y: 438, minX: 150, maxX: 600, speed: 46 }, { x: 900, y: 438, minX: 760, maxX: 1200, speed: 52 }, { x: 1650, y: 438, minX: 1500, maxX: 1880, speed: 48 }, { x: 2280, y: 438, minX: 2150, maxX: 2460, speed: 55 }],
    relics: [{ x: 270, y: 330 }, { x: 490, y: 230 }, { x: 820, y: 310 }, { x: 1100, y: 205 }, { x: 1670, y: 260 }, { x: 2260, y: 240 }],
    goalX: 2420,
    checkpoint: "Попелястий сад",
  },
  {
    name: "The Iron Psalms",
    subtitle: "Механізм мовчить, але його зуби ще рухаються",
    width: 2700,
    palette: palettes[2],
    platforms: [
      floor(2700),
      { x: 240, y: 320, w: 150, h: 18 }, { x: 500, y: 220, w: 155, h: 18 },
      { x: 770, y: 355, w: 180, h: 18 }, { x: 1060, y: 280, w: 125, h: 18 },
      { x: 1300, y: 185, w: 175, h: 18 }, { x: 1590, y: 340, w: 210, h: 18 },
      { x: 1920, y: 245, w: 145, h: 18 }, { x: 2200, y: 355, w: 180, h: 18 },
      { x: 2470, y: 260, w: 150, h: 18 },
    ],
    hazards: [{ x: 660, y: 450, w: 90, h: 28 }, { x: 1195, y: 450, w: 95, h: 28 }, { x: 1815, y: 450, w: 90, h: 28 }, { x: 2390, y: 450, w: 70, h: 28 }],
    enemies: [{ x: 600, y: 438, minX: 400, maxX: 730, speed: 50 }, { x: 980, y: 438, minX: 800, maxX: 1200, speed: 42 }, { x: 1500, y: 438, minX: 1350, maxX: 1880, speed: 54 }, { x: 2100, y: 438, minX: 1980, maxX: 2440, speed: 50 }],
    relics: [{ x: 305, y: 280 }, { x: 575, y: 180 }, { x: 1115, y: 240 }, { x: 1385, y: 145 }, { x: 1990, y: 205 }, { x: 2535, y: 220 }],
    goalX: 2580,
    checkpoint: "Залізні псалми",
  },
  {
    name: "Blackwater Bastion",
    subtitle: "Фортеця стоїть там, де вода стала чорною",
    width: 2850,
    palette: palettes[3],
    platforms: [
      floor(2850),
      { x: 160, y: 360, w: 180, h: 18 }, { x: 470, y: 300, w: 145, h: 18 },
      { x: 750, y: 210, w: 180, h: 18 }, { x: 1040, y: 375, w: 185, h: 18 },
      { x: 1360, y: 295, w: 160, h: 18 }, { x: 1630, y: 210, w: 180, h: 18 },
      { x: 1930, y: 350, w: 200, h: 18 }, { x: 2260, y: 265, w: 160, h: 18 },
      { x: 2520, y: 360, w: 190, h: 18 },
    ],
    hazards: [{ x: 360, y: 450, w: 90, h: 28 }, { x: 1235, y: 450, w: 110, h: 28 }, { x: 2140, y: 450, w: 110, h: 28 }],
    enemies: [{ x: 360, y: 438, minX: 120, maxX: 700, speed: 56 }, { x: 1150, y: 438, minX: 980, maxX: 1320, speed: 46 }, { x: 1780, y: 438, minX: 1550, maxX: 1880, speed: 58 }, { x: 2360, y: 438, minX: 2200, maxX: 2800, speed: 52 }],
    relics: [{ x: 230, y: 320 }, { x: 540, y: 260 }, { x: 820, y: 170 }, { x: 1430, y: 255 }, { x: 1700, y: 170 }, { x: 2350, y: 225 }, { x: 2600, y: 320 }],
    goalX: 2730,
    checkpoint: "Чорноводна фортеця",
  },
  {
    name: "Cinder Tunnels",
    subtitle: "Під землею попіл дихає повільніше",
    width: 3000,
    palette: palettes[0],
    platforms: [
      floor(3000),
      { x: 280, y: 275, w: 140, h: 18 }, { x: 530, y: 370, w: 170, h: 18 },
      { x: 800, y: 250, w: 180, h: 18 }, { x: 1110, y: 330, w: 145, h: 18 },
      { x: 1380, y: 230, w: 190, h: 18 }, { x: 1690, y: 360, w: 160, h: 18 },
      { x: 1980, y: 270, w: 180, h: 18 }, { x: 2270, y: 175, w: 150, h: 18 },
      { x: 2520, y: 320, w: 210, h: 18 }, { x: 2800, y: 240, w: 120, h: 18 },
    ],
    hazards: [{ x: 710, y: 450, w: 80, h: 28 }, { x: 1270, y: 450, w: 100, h: 28 }, { x: 1870, y: 450, w: 100, h: 28 }, { x: 2740, y: 450, w: 50, h: 28 }],
    enemies: [{ x: 450, y: 438, minX: 120, maxX: 760, speed: 58 }, { x: 1000, y: 438, minX: 820, maxX: 1320, speed: 60 }, { x: 1600, y: 438, minX: 1400, maxX: 1920, speed: 55 }, { x: 2200, y: 438, minX: 2000, maxX: 2480, speed: 62 }, { x: 2700, y: 438, minX: 2500, maxX: 2920, speed: 58 }],
    relics: [{ x: 340, y: 235 }, { x: 870, y: 210 }, { x: 1170, y: 290 }, { x: 1450, y: 190 }, { x: 2050, y: 230 }, { x: 2340, y: 135 }, { x: 2600, y: 280 }],
    goalX: 2860,
    checkpoint: "Попелясті тунелі",
  },
  {
    name: "The Empty Theatre",
    subtitle: "Глядачів немає. Завіса все одно підіймається",
    width: 3150,
    palette: palettes[1],
    platforms: [
      floor(3150),
      { x: 180, y: 330, w: 150, h: 18 }, { x: 430, y: 240, w: 150, h: 18 },
      { x: 690, y: 355, w: 200, h: 18 }, { x: 1000, y: 260, w: 170, h: 18 },
      { x: 1280, y: 170, w: 180, h: 18 }, { x: 1550, y: 310, w: 185, h: 18 },
      { x: 1840, y: 220, w: 155, h: 18 }, { x: 2110, y: 350, w: 210, h: 18 },
      { x: 2440, y: 250, w: 170, h: 18 }, { x: 2740, y: 165, w: 180, h: 18 },
    ],
    hazards: [{ x: 600, y: 450, w: 70, h: 28 }, { x: 1180, y: 450, w: 90, h: 28 }, { x: 1745, y: 450, w: 85, h: 28 }, { x: 2330, y: 450, w: 100, h: 28 }],
    enemies: [{ x: 350, y: 438, minX: 120, maxX: 620, speed: 54 }, { x: 900, y: 438, minX: 740, maxX: 1230, speed: 64 }, { x: 1500, y: 438, minX: 1300, maxX: 1780, speed: 58 }, { x: 2020, y: 438, minX: 1850, maxX: 2400, speed: 62 }, { x: 2650, y: 438, minX: 2500, maxX: 3080, speed: 66 }],
    relics: [{ x: 240, y: 285 }, { x: 500, y: 195 }, { x: 770, y: 310 }, { x: 1350, y: 125 }, { x: 1910, y: 175 }, { x: 2200, y: 305 }, { x: 2820, y: 120 }],
    goalX: 3000,
    checkpoint: "Порожній театр",
  },
  {
    name: "The Bone Orchard",
    subtitle: "У цій землі ростуть лише імена",
    width: 3300,
    palette: palettes[2],
    platforms: [
      floor(3300),
      { x: 220, y: 370, w: 185, h: 18 }, { x: 500, y: 275, w: 145, h: 18 },
      { x: 760, y: 185, w: 170, h: 18 }, { x: 1030, y: 340, w: 180, h: 18 },
      { x: 1320, y: 250, w: 150, h: 18 }, { x: 1600, y: 150, w: 210, h: 18 },
      { x: 1900, y: 360, w: 160, h: 18 }, { x: 2180, y: 275, w: 190, h: 18 },
      { x: 2490, y: 185, w: 160, h: 18 }, { x: 2790, y: 330, w: 210, h: 18 },
      { x: 3100, y: 220, w: 120, h: 18 },
    ],
    hazards: [{ x: 650, y: 450, w: 100, h: 28 }, { x: 1220, y: 450, w: 90, h: 28 }, { x: 1815, y: 450, w: 75, h: 28 }, { x: 2390, y: 450, w: 90, h: 28 }, { x: 3010, y: 450, w: 80, h: 28 }],
    enemies: [{ x: 400, y: 438, minX: 130, maxX: 720, speed: 62 }, { x: 970, y: 438, minX: 800, maxX: 1260, speed: 58 }, { x: 1500, y: 438, minX: 1320, maxX: 1840, speed: 68 }, { x: 2150, y: 438, minX: 1950, maxX: 2440, speed: 64 }, { x: 2700, y: 438, minX: 2500, maxX: 3080, speed: 72 }],
    relics: [{ x: 290, y: 330 }, { x: 560, y: 235 }, { x: 820, y: 145 }, { x: 1370, y: 210 }, { x: 1700, y: 110 }, { x: 2250, y: 235 }, { x: 2570, y: 145 }, { x: 2890, y: 290 }],
    goalX: 3170,
    checkpoint: "Кістяний сад",
  },
  {
    name: "Hromovy Vovky",
    subtitle: "Грім не питає, чи готові ви",
    width: 3450,
    palette: palettes[3],
    platforms: [
      floor(3450),
      { x: 150, y: 290, w: 145, h: 18 }, { x: 390, y: 180, w: 160, h: 18 },
      { x: 670, y: 345, w: 190, h: 18 }, { x: 980, y: 235, w: 175, h: 18 },
      { x: 1260, y: 130, w: 160, h: 18 }, { x: 1510, y: 330, w: 205, h: 18 },
      { x: 1810, y: 220, w: 160, h: 18 }, { x: 2100, y: 130, w: 180, h: 18 },
      { x: 2390, y: 350, w: 200, h: 18 }, { x: 2700, y: 245, w: 170, h: 18 },
      { x: 3000, y: 150, w: 190, h: 18 }, { x: 3270, y: 320, w: 120, h: 18 },
    ],
    hazards: [{ x: 560, y: 450, w: 100, h: 28 }, { x: 1165, y: 450, w: 85, h: 28 }, { x: 1725, y: 450, w: 75, h: 28 }, { x: 2290, y: 450, w: 85, h: 28 }, { x: 2600, y: 450, w: 90, h: 28 }],
    enemies: [{ x: 330, y: 438, minX: 100, maxX: 620, speed: 70 }, { x: 900, y: 438, minX: 700, maxX: 1190, speed: 65 }, { x: 1430, y: 438, minX: 1280, maxX: 1760, speed: 72 }, { x: 2020, y: 438, minX: 1840, maxX: 2340, speed: 78 }, { x: 2630, y: 438, minX: 2450, maxX: 2950, speed: 70 }, { x: 3150, y: 438, minX: 3000, maxX: 3400, speed: 76 }],
    relics: [{ x: 220, y: 250 }, { x: 470, y: 140 }, { x: 760, y: 305 }, { x: 1040, y: 195 }, { x: 1330, y: 90 }, { x: 1590, y: 290 }, { x: 2180, y: 90 }, { x: 2780, y: 205 }, { x: 3080, y: 110 }],
    goalX: 3340,
    checkpoint: "Громові вовки",
  },
  {
    name: "The Glass Chapel",
    subtitle: "Кожен дзвін розколює ще одну тишу",
    width: 3550,
    palette: palettes[1],
    platforms: [
      floor(3550),
      { x: 250, y: 350, w: 180, h: 18 }, { x: 520, y: 235, w: 160, h: 18 },
      { x: 800, y: 130, w: 170, h: 18 }, { x: 1080, y: 340, w: 195, h: 18 },
      { x: 1400, y: 250, w: 170, h: 18 }, { x: 1690, y: 155, w: 190, h: 18 },
      { x: 2010, y: 360, w: 180, h: 18 }, { x: 2290, y: 260, w: 175, h: 18 },
      { x: 2570, y: 165, w: 160, h: 18 }, { x: 2840, y: 350, w: 190, h: 18 },
      { x: 3140, y: 240, w: 150, h: 18 }, { x: 3370, y: 150, w: 130, h: 18 },
    ],
    hazards: [{ x: 690, y: 450, w: 90, h: 28 }, { x: 1285, y: 450, w: 100, h: 28 }, { x: 1890, y: 450, w: 110, h: 28 }, { x: 2475, y: 450, w: 80, h: 28 }, { x: 3040, y: 450, w: 90, h: 28 }],
    enemies: [{ x: 460, y: 438, minX: 140, maxX: 740, speed: 72 }, { x: 970, y: 438, minX: 820, maxX: 1320, speed: 70 }, { x: 1590, y: 438, minX: 1420, maxX: 1940, speed: 76 }, { x: 2200, y: 438, minX: 2020, maxX: 2500, speed: 78 }, { x: 2760, y: 438, minX: 2600, maxX: 3100, speed: 82 }, { x: 3300, y: 438, minX: 3150, maxX: 3500, speed: 80 }],
    relics: [{ x: 330, y: 310 }, { x: 600, y: 195 }, { x: 880, y: 90 }, { x: 1490, y: 210 }, { x: 1780, y: 115 }, { x: 2370, y: 220 }, { x: 2650, y: 125 }, { x: 2920, y: 310 }, { x: 3210, y: 200 }, { x: 3430, y: 110 }],
    goalX: 3450,
    checkpoint: "Скляна каплиця",
  },
  {
    name: "The Red Meridian",
    subtitle: "Лінія горизонту теж може бути шрамом",
    width: 3700,
    palette: palettes[0],
    platforms: [
      floor(3700),
      { x: 180, y: 270, w: 170, h: 18 }, { x: 470, y: 380, w: 180, h: 18 },
      { x: 760, y: 220, w: 145, h: 18 }, { x: 1030, y: 140, w: 190, h: 18 },
      { x: 1340, y: 350, w: 190, h: 18 }, { x: 1650, y: 240, w: 160, h: 18 },
      { x: 1940, y: 125, w: 180, h: 18 }, { x: 2240, y: 330, w: 210, h: 18 },
      { x: 2560, y: 230, w: 170, h: 18 }, { x: 2850, y: 140, w: 180, h: 18 },
      { x: 3150, y: 350, w: 200, h: 18 }, { x: 3450, y: 240, w: 170, h: 18 },
    ],
    hazards: [{ x: 660, y: 450, w: 90, h: 28 }, { x: 1235, y: 450, w: 90, h: 28 }, { x: 1830, y: 450, w: 100, h: 28 }, { x: 2460, y: 450, w: 80, h: 28 }, { x: 3040, y: 450, w: 100, h: 28 }],
    enemies: [{ x: 380, y: 438, minX: 110, maxX: 720, speed: 76 }, { x: 920, y: 438, minX: 800, maxX: 1280, speed: 78 }, { x: 1560, y: 438, minX: 1380, maxX: 1880, speed: 82 }, { x: 2160, y: 438, minX: 1980, maxX: 2540, speed: 86 }, { x: 2760, y: 438, minX: 2600, maxX: 3100, speed: 84 }, { x: 3320, y: 438, minX: 3150, maxX: 3650, speed: 90 }],
    relics: [{ x: 260, y: 230 }, { x: 540, y: 340 }, { x: 830, y: 180 }, { x: 1120, y: 100 }, { x: 1430, y: 310 }, { x: 1730, y: 200 }, { x: 2020, y: 85 }, { x: 2340, y: 290 }, { x: 2660, y: 190 }, { x: 2940, y: 100 }, { x: 3250, y: 310 }, { x: 3540, y: 200 }],
    goalX: 3600,
    checkpoint: "Червоний меридіан",
  },
  {
    name: "The Last Archive",
    subtitle: "Слова переживають тих, хто їх ховав",
    width: 3850,
    palette: palettes[2],
    platforms: [
      floor(3850),
      { x: 220, y: 350, w: 170, h: 18 }, { x: 500, y: 250, w: 180, h: 18 },
      { x: 780, y: 150, w: 160, h: 18 }, { x: 1070, y: 360, w: 190, h: 18 },
      { x: 1370, y: 270, w: 160, h: 18 }, { x: 1640, y: 170, w: 190, h: 18 },
      { x: 1950, y: 340, w: 170, h: 18 }, { x: 2230, y: 230, w: 180, h: 18 },
      { x: 2530, y: 120, w: 180, h: 18 }, { x: 2830, y: 350, w: 200, h: 18 },
      { x: 3150, y: 250, w: 170, h: 18 }, { x: 3420, y: 145, w: 190, h: 18 },
      { x: 3700, y: 325, w: 120, h: 18 },
    ],
    hazards: [{ x: 690, y: 450, w: 80, h: 28 }, { x: 1270, y: 450, w: 90, h: 28 }, { x: 1840, y: 450, w: 90, h: 28 }, { x: 2420, y: 450, w: 100, h: 28 }, { x: 2730, y: 450, w: 80, h: 28 }, { x: 3340, y: 450, w: 70, h: 28 }],
    enemies: [{ x: 420, y: 438, minX: 120, maxX: 750, speed: 86 }, { x: 1000, y: 438, minX: 820, maxX: 1320, speed: 84 }, { x: 1550, y: 438, minX: 1400, maxX: 1890, speed: 88 }, { x: 2110, y: 438, minX: 1980, maxX: 2470, speed: 92 }, { x: 2700, y: 438, minX: 2550, maxX: 3100, speed: 88 }, { x: 3280, y: 438, minX: 3150, maxX: 3600, speed: 96 }],
    relics: [{ x: 300, y: 310 }, { x: 590, y: 210 }, { x: 860, y: 110 }, { x: 1150, y: 320 }, { x: 1450, y: 230 }, { x: 1720, y: 130 }, { x: 2030, y: 300 }, { x: 2320, y: 190 }, { x: 2620, y: 80 }, { x: 2920, y: 310 }, { x: 3240, y: 210 }, { x: 3510, y: 105 }, { x: 3750, y: 285 }],
    goalX: 3760,
    checkpoint: "Останній архів",
  },
  {
    name: "The Unbroken Bridge",
    subtitle: "Міст тримається на тих, хто не відступив",
    width: 4050,
    palette: palettes[3],
    platforms: [
      floor(4050),
      { x: 160, y: 320, w: 180, h: 18 }, { x: 450, y: 190, w: 160, h: 18 },
      { x: 730, y: 330, w: 200, h: 18 }, { x: 1050, y: 235, w: 160, h: 18 },
      { x: 1320, y: 130, w: 190, h: 18 }, { x: 1630, y: 350, w: 180, h: 18 },
      { x: 1910, y: 250, w: 170, h: 18 }, { x: 2200, y: 150, w: 190, h: 18 },
      { x: 2510, y: 350, w: 190, h: 18 }, { x: 2810, y: 235, w: 180, h: 18 },
      { x: 3110, y: 120, w: 190, h: 18 }, { x: 3410, y: 330, w: 200, h: 18 },
      { x: 3740, y: 235, w: 170, h: 18 },
    ],
    hazards: [{ x: 620, y: 450, w: 90, h: 28 }, { x: 1220, y: 450, w: 85, h: 28 }, { x: 1815, y: 450, w: 85, h: 28 }, { x: 2400, y: 450, w: 100, h: 28 }, { x: 2710, y: 450, w: 90, h: 28 }, { x: 3320, y: 450, w: 80, h: 28 }],
    enemies: [{ x: 370, y: 438, minX: 110, maxX: 690, speed: 92 }, { x: 980, y: 438, minX: 760, maxX: 1280, speed: 96 }, { x: 1550, y: 438, minX: 1340, maxX: 1880, speed: 98 }, { x: 2100, y: 438, minX: 1920, maxX: 2460, speed: 102 }, { x: 2670, y: 438, minX: 2520, maxX: 3100, speed: 98 }, { x: 3290, y: 438, minX: 3150, maxX: 3650, speed: 105 }, { x: 3800, y: 438, minX: 3700, maxX: 4000, speed: 110 }],
    relics: [{ x: 250, y: 280 }, { x: 520, y: 150 }, { x: 820, y: 290 }, { x: 1110, y: 195 }, { x: 1415, y: 90 }, { x: 1710, y: 310 }, { x: 1990, y: 210 }, { x: 2290, y: 110 }, { x: 2600, y: 310 }, { x: 2900, y: 195 }, { x: 3200, y: 80 }, { x: 3500, y: 290 }, { x: 3820, y: 195 }],
    goalX: 3950,
    checkpoint: "Незламний міст",
  },
  {
    name: "Crown of Embers",
    subtitle: "Фінальний вогонь не просить дозволу",
    width: 4300,
    palette: palettes[0],
    platforms: [
      floor(4300),
      { x: 190, y: 350, w: 170, h: 18 }, { x: 460, y: 240, w: 170, h: 18 },
      { x: 740, y: 140, w: 180, h: 18 }, { x: 1040, y: 340, w: 200, h: 18 },
      { x: 1350, y: 230, w: 160, h: 18 }, { x: 1620, y: 125, w: 200, h: 18 },
      { x: 1940, y: 350, w: 190, h: 18 }, { x: 2240, y: 240, w: 180, h: 18 },
      { x: 2540, y: 130, w: 190, h: 18 }, { x: 2850, y: 360, w: 200, h: 18 },
      { x: 3170, y: 235, w: 180, h: 18 }, { x: 3470, y: 120, w: 210, h: 18 },
      { x: 3790, y: 330, w: 190, h: 18 }, { x: 4070, y: 220, w: 150, h: 18 },
    ],
    hazards: [{ x: 640, y: 450, w: 80, h: 28 }, { x: 1250, y: 450, w: 95, h: 28 }, { x: 1830, y: 450, w: 90, h: 28 }, { x: 2430, y: 450, w: 90, h: 28 }, { x: 2750, y: 450, w: 80, h: 28 }, { x: 3370, y: 450, w: 90, h: 28 }, { x: 3990, y: 450, w: 70, h: 28 }],
    enemies: [{ x: 400, y: 438, minX: 120, maxX: 700, speed: 104 }, { x: 970, y: 438, minX: 800, maxX: 1300, speed: 106 }, { x: 1550, y: 438, minX: 1360, maxX: 1880, speed: 110 }, { x: 2150, y: 438, minX: 1950, maxX: 2500, speed: 112 }, { x: 2700, y: 438, minX: 2550, maxX: 3100, speed: 108 }, { x: 3300, y: 438, minX: 3180, maxX: 3680, speed: 116 }, { x: 3900, y: 438, minX: 3820, maxX: 4250, speed: 122 }],
    relics: [{ x: 280, y: 310 }, { x: 540, y: 190 }, { x: 820, y: 90 }, { x: 1140, y: 300 }, { x: 1430, y: 180 }, { x: 1720, y: 75 }, { x: 2030, y: 310 }, { x: 2330, y: 190 }, { x: 2630, y: 80 }, { x: 2950, y: 320 }, { x: 3260, y: 185 }, { x: 3570, y: 70 }, { x: 3880, y: 290 }, { x: 4140, y: 170 }],
    goalX: 4180,
    checkpoint: "Корона жарин",
  },
];

const EXPEDITION_NAMES = [
  "Ash Trial", "Iron Trial", "Blackwater Trial", "Cinder Trial", "Theatre Trial",
  "Bone Trial", "Thunder Trial", "Glass Trial", "Meridian Trial", "Archive Trial",
  "Bridge Trial", "Ember Trial", "Nightfall Trial", "Ruin Trial", "Wolf Trial",
  "Crown Trial", "Storm Trial", "Memory Trial", "Fire Trial", "Last Trial",
];

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const PLATFORM_PATTERNS = [
  [-55, -70, 35, -85, 60, -45, -65, 80],
  [-90, 45, -60, -55, 85, -70, 35, -80],
  [-40, -95, 65, -45, -75, 45, -55, 70],
  [-75, 25, -85, 55, -45, -70, 65, -50],
] as const;

function createExpeditionLevel(index: number): GameLevel {
  const random = seededRandom(0x7f4a7c15 + index * 7919);
  const width = 3200 + index * 75;
  const platformCount = 11 + (index % 5);
  const pattern = PLATFORM_PATTERNS[index % PLATFORM_PATTERNS.length];
  const platforms: GameRect[] = [floor(width)];
  const hazards: GameRect[] = [];
  const enemies: EnemySeed[] = [];
  const relics: RelicSeed[] = [];
  let cursorX = 150 + Math.round(random() * 45);
  let platformY = 390 - (index % 3) * 12;

  for (let platformIndex = 0; platformIndex < platformCount; platformIndex += 1) {
    const widthVariation = Math.round(random() * 70);
    const platformWidth = 135 + widthVariation + ((platformIndex + index) % 3) * 18;
    const deltaY = pattern[platformIndex % pattern.length] + Math.round((random() - 0.5) * 24);
    platformY = Math.max(155, Math.min(405, platformY + deltaY));
    const platform = { x: cursorX, y: platformY, w: platformWidth, h: 18 };
    platforms.push(platform);

    relics.push({
      x: Math.round(platform.x + platform.w * (0.35 + random() * 0.3)),
      y: platform.y - 38 - (platformIndex % 3) * 5,
    });

    if ((platformIndex + index) % 3 === 1) {
      const hazardX = Math.min(width - 100, platform.x + platform.w + 28);
      hazards.push({ x: hazardX, y: 450, w: 54 + (platformIndex % 3) * 14, h: 28 });
    }

    if ((platformIndex + index) % 2 === 0) {
      const patrolStart = Math.max(100, platform.x - 55);
      const patrolEnd = Math.min(width - 50, platform.x + platform.w + 80);
      enemies.push({
        x: patrolStart + 25,
        y: 438,
        minX: patrolStart,
        maxX: patrolEnd,
        speed: 50 + index * 2.2 + (platformIndex % 4) * 5,
      });
    }

    const horizontalStep = 205 + Math.round(random() * 85) + (platformIndex % 2) * 22;
    cursorX += horizontalStep;
  }

  const finalPlatform = platforms[platforms.length - 1];
  const goalX = Math.min(width - 110, Math.max(finalPlatform.x + finalPlatform.w + 90, width - 180));

  return {
    name: `${String(index + 13).padStart(2, "0")} — ${EXPEDITION_NAMES[index]}`,
    subtitle: [
      "Новий маршрут крізь уламки старого світу",
      "Платформи змінюють ритм, але шлях залишається чесним",
      "Кожен стрибок має опору, кожна висота має підхід",
      "Темрява перебудувала дорогу, а не скопіювала її",
    ][index % 4],
    width,
    palette: palettes[(index + 1) % palettes.length],
    platforms,
    hazards,
    enemies,
    relics,
    goalX,
    checkpoint: `Експедиція ${String(index + 1).padStart(2, "0")}`,
  };
}

function landingTime(sourceY: number, targetY: number): number | null {
  const verticalDisplacement = targetY - sourceY;
  const discriminant =
    GAME_PHYSICS.jumpSpeed ** 2 +
    2 * GAME_PHYSICS.gravity * verticalDisplacement;
  if (discriminant < 0) return null;
  return (
    GAME_PHYSICS.jumpSpeed + Math.sqrt(discriminant)
  ) / GAME_PHYSICS.gravity;
}

function horizontalGap(source: GameRect, target: GameRect): number {
  if (target.x > source.x + source.w) return target.x - (source.x + source.w);
  if (source.x > target.x + target.w) return source.x - (target.x + target.w);
  return 0;
}

function canReachPlatform(source: GameRect, target: GameRect): boolean {
  const time = landingTime(source.y, target.y);
  if (time === null) return false;
  const maximumTravel =
    GAME_PHYSICS.playerSpeed *
      GAME_PHYSICS.sprintMultiplier *
      time +
    GAME_PHYSICS.playerWidth;
  return horizontalGap(source, target) <= maximumTravel;
}

export type LevelReachabilityReport = {
  reachable: boolean;
  unreachablePlatformIndexes: number[];
  unreachableRelicIndexes: number[];
  goalReachable: boolean;
};

export function validateLevelReachability(level: GameLevel): LevelReachabilityReport {
  const reachablePlatforms = new Set<number>([0]);
  let changed = true;

  while (changed) {
    changed = false;
    level.platforms.forEach((target, targetIndex) => {
      if (reachablePlatforms.has(targetIndex)) return;
      const canReach = [...reachablePlatforms].some((sourceIndex) =>
        canReachPlatform(level.platforms[sourceIndex], target),
      );
      if (canReach) {
        reachablePlatforms.add(targetIndex);
        changed = true;
      }
    });
  }

  const unreachablePlatformIndexes = level.platforms
    .map((_, index) => index)
    .filter((index) => !reachablePlatforms.has(index));

  const reachableSurfaces = level.platforms.filter((_, index) =>
    reachablePlatforms.has(index),
  );
  const unreachableRelicIndexes = level.relics
    .map((relic, index) => ({ relic, index }))
    .filter(({ relic }) =>
      !reachableSurfaces.some((surface) => {
        const target = { x: relic.x - 12, y: relic.y + 12, w: 24, h: 1 };
        return canReachPlatform(surface, target);
      }),
    )
    .map(({ index }) => index);

  const goalTarget = { x: level.goalX - 28, y: 476, w: 56, h: 1 };
  const goalReachable = reachableSurfaces.some((surface) =>
    canReachPlatform(surface, goalTarget),
  );

  return {
    reachable:
      unreachablePlatformIndexes.length === 0 &&
      unreachableRelicIndexes.length === 0 &&
      goalReachable,
    unreachablePlatformIndexes,
    unreachableRelicIndexes,
    goalReachable,
  };
}

export const GAME_LEVELS: GameLevel[] = [
  ...BASE_LEVELS,
  ...Array.from({ length: 20 }, (_, index) => createExpeditionLevel(index)),
];
