import { useMemo, useState } from "react";
import { Check, ChevronDown, Hammer, Paintbrush, RotateCcw, Sparkles, WandSparkles, Wrench } from "lucide-react";

type Gender = "woman" | "man";
type Outfit = "workshop" | "neon" | "atelier";
type Hair = "short" | "long" | "curl";
type Skin = "light" | "warm" | "deep";
type Accessory = "none" | "glasses" | "headphones" | "crown";
type Tool = "none" | "hammer" | "brush" | "lantern";
type Action = "wave" | "hammer" | "paint" | "build";

const palette = { cyan: "#63f7ff", pink: "#ff5cad", gold: "#ffd18a" };
const skinColors: Record<Skin, { base: string; shadow: string; highlight: string }> = {
  light: { base: "#f1c7aa", shadow: "#bd806b", highlight: "#ffe4cb" },
  warm: { base: "#be805f", shadow: "#7c4438", highlight: "#e4a77b" },
  deep: { base: "#754638", shadow: "#442721", highlight: "#a9694f" },
};
const outfitColors: Record<Outfit, { main: string; accent: string; label: string }> = {
  workshop: { main: "#244965", accent: "#ffbf68", label: "Майстерня" },
  neon: { main: "#6e2b86", accent: "#5cf5ed", label: "Неон" },
  atelier: { main: "#8f2747", accent: "#ffc1db", label: "Ательє" },
};

function AvatarFigure({ gender, outfit, hair, skin, accent, action, accessory, tool }: {
  gender: Gender; outfit: Outfit; hair: Hair; skin: Skin; accent: string; action: Action; accessory: Accessory; tool: Tool;
}) {
  const tone = skinColors[skin];
  const clothes = outfitColors[outfit];
  const isWoman = gender === "woman";
  return (
    <svg viewBox="0 0 360 500" role="img" aria-label={`${isWoman ? "Жіночий" : "Чоловічий"} аватар у стилі ${clothes.label}`} className="h-full w-full overflow-visible drop-shadow-[0_24px_30px_rgba(0,0,0,0.45)]">
      <defs>
        <linearGradient id="avatar-preview-glow" x1="0" x2="1"><stop offset="0" stopColor={accent} stopOpacity="0.3" /><stop offset="1" stopColor="#fff" stopOpacity="0.08" /></linearGradient>
        <linearGradient id="avatar-preview-clothes" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor={clothes.main} /><stop offset="1" stopColor="#090f26" /></linearGradient>
      </defs>
      <ellipse cx="180" cy="466" rx="92" ry="17" fill="#000" opacity="0.35" />
      <path d="M133 392h35v64h-45c-5-18-2-44 10-64Zm59 0h35c12 20 15 46 10 64h-45v-64Z" fill="#121a2d" />
      <path d="M120 451c19-7 34-4 48 1v12h-62c0-6 5-10 14-13Zm105 1c14-5 29-8 48-1 9 3 14 7 14 13h-62v-12Z" fill={clothes.accent} />
      <path d="M110 270c10-28 35-44 70-45 35 1 60 17 70 45l17 121c-20 18-50 25-87 25s-67-7-87-25l17-121Z" fill="url(#avatar-preview-clothes)" stroke={accent} strokeWidth="2" />
      <path d="M142 251c12 17 25 27 38 27s26-10 38-27l-5-28h-66l-5 28Z" fill={tone.shadow} opacity="0.8" />
      <path d="M151 237c9 11 19 17 29 17s20-6 29-17v31c-9 10-19 15-29 15s-20-5-29-15v-31Z" fill={tone.base} />
      <path d="M153 293h54l-27 48-27-48Z" fill={clothes.accent} opacity="0.82" />
      <path d="M133 316h94M180 344v66" stroke={accent} strokeWidth="3" opacity="0.5" />
      {outfit === "workshop" && <><path d="M151 300h58v57h-58Z" fill="#172c44" opacity="0.75" /><path d="M169 313h22v27h-22Z" fill="#08121e" stroke={clothes.accent} strokeWidth="2" /></>}
      {outfit === "neon" && <path d="M122 321h116M126 339h108" stroke={clothes.accent} strokeWidth="4" opacity="0.8" />}
      {outfit === "atelier" && <path d="M144 295c24 21 48 21 72 0l16 104h-104l16-104Z" fill="#a22d55" opacity="0.65" />}
      <g className={action === "wave" ? "animate-[avatar-wave_0.8s_ease-in-out_infinite]" : action === "hammer" ? "animate-[avatar-hammer_0.55s_ease-in-out_infinite]" : action === "paint" ? "animate-[avatar-paint_1.2s_ease-in-out_infinite]" : ""} style={{ transformOrigin: "245px 288px" }}>
        <path d="M232 284c23 4 35 17 46 34l24-17 13 17-36 36c-14-10-30-19-44-30l-3-40Z" fill={tone.base} stroke={tone.shadow} strokeWidth="2" />
        <path d="M298 302c15-11 16-28 13-43-1-6 5-10 9-5 8 10 10 23 7 34 4-13 9-22 14-20 5 2 3 14 0 22 6-10 12-16 16-12 4 5-4 18-9 25 7-7 13-9 15-4 2 6-9 18-20 25-11 7-22 7-33 2l-12-24Z" fill={tone.base} stroke={tone.shadow} strokeWidth="2" />
        {tool === "hammer" && <><path d="M326 279l24-35" stroke="#c99768" strokeWidth="7" strokeLinecap="round" /><path d="M341 252l18 8-8 16-18-8Z" fill="#526276" stroke={accent} strokeWidth="2" /></>}
        {tool === "brush" && <><path d="M326 281l24-42" stroke="#b47b52" strokeWidth="5" strokeLinecap="round" /><path d="M347 241l10-16 8 5-10 16Z" fill={accent} /></>}
        {tool === "lantern" && <><path d="M326 283v-36" stroke="#c99768" strokeWidth="5" strokeLinecap="round" /><path d="M317 240h18l5 25h-28l5-25Z" fill="#ffd66f" fillOpacity="0.8" stroke={accent} strokeWidth="2" /></>}
      </g>
      <path d="M128 286c-20 10-32 27-41 48l-28-19-12 18 42 36c16-10 30-22 43-35l-4-48Z" fill={tone.base} stroke={tone.shadow} strokeWidth="2" />
      <ellipse cx="180" cy="178" rx="62" ry="74" fill={tone.base} stroke={tone.shadow} strokeWidth="3" />
      <path d="M120 177c-8-60 14-99 62-99 43 0 68 33 60 89-17-25-38-33-65-35-19-1-40 16-57 45Z" fill="#111525" stroke={accent} strokeWidth="2" />
      {hair === "long" && <path d="M123 148c-26 30-26 90 5 124l27-12c-20-31-24-67-10-103l-22-9Zm112 0 22 10c14 36 10 72-10 103l27 12c31-34 31-94 5-124l-22-1Z" fill="#111525" stroke={accent} strokeWidth="2" />}
      {hair === "curl" && <path d="M119 150c-11-38 14-78 61-78 47 0 72 40 61 78l-17-16-17-23-29 17-34-12-18 34-7 0Z" fill="#57344a" stroke={accent} strokeWidth="2" />}
      {accessory === "glasses" && <><path d="M139 178h29c4 0 7 3 7 7v4c0 5-3 8-7 8h-22c-5 0-8-3-8-8v-4c0-4 3-7 8-7Zm43 0h29c5 0 8 3 8 7v4c0 5-3 8-8 8h-22c-4 0-7-3-7-8v-4c0-4 3-7 7-7Z" fill="#10172a" fillOpacity="0.65" stroke={accent} strokeWidth="2" /><path d="M175 184h10" stroke={accent} strokeWidth="2" /></>}
      {accessory === "headphones" && <path d="M116 186c-2-45 25-72 64-72s66 27 64 72" fill="none" stroke={accent} strokeWidth="8" />}
      {accessory === "crown" && <><path d="m137 105 14-25 29 20 29-20 14 25-6 23h-74l-6-23Z" fill="#ffd166" stroke={accent} strokeWidth="3" /><path d="M145 121h70" stroke="#fff2a8" strokeWidth="3" /></>}
      <path d="M148 172c9-7 18-7 27 0M185 172c9-7 18-7 27 0" stroke="#271b28" strokeWidth="4" strokeLinecap="round" />
      <circle cx="164" cy="183" r="3.5" fill="#211827" /><circle cx="196" cy="183" r="3.5" fill="#211827" />
      <path d="M180 183v20l-9 4" stroke={tone.shadow} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d={isWoman ? "M163 221c10 8 24 8 34 0" : "M166 221c8 4 20 4 28 0"} stroke="#7d3e51" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="131" cy="202" r="6" fill={accent} opacity="0.65" /><circle cx="229" cy="202" r="6" fill={accent} opacity="0.65" />
      <path d="M112 391c19 17 42 25 68 25s49-8 68-25" fill="none" stroke={accent} strokeWidth="3" opacity="0.7" />
      <circle cx="180" cy="344" r="7" fill={accent} /><circle cx="180" cy="344" r="3" fill="#fff" />
      <path d="M105 410h150" stroke="url(#avatar-preview-glow)" strokeWidth="8" strokeLinecap="round" />
      {action === "build" && <><path d="M69 411h222M88 410v-31m166 31v-31" stroke={accent} strokeWidth="4" opacity="0.55" /><path d="M82 379h176" stroke="#b8835a" strokeWidth="8" /></>}
    </svg>
  );
}

export function HumanAvatarBuilder() {
  const [gender, setGender] = useState<Gender>("woman");
  const [outfit, setOutfit] = useState<Outfit>("neon");
  const [hair, setHair] = useState<Hair>("long");
  const [skin, setSkin] = useState<Skin>("warm");
  const [accent, setAccent] = useState(palette.cyan);
  const [accessory, setAccessory] = useState<Accessory>("none");
  const [tool, setTool] = useState<Tool>("none");
  const [action, setAction] = useState<Action>("wave");
  const currentLabel = useMemo(() => `${gender === "woman" ? "Жінка" : "Чоловік"} // ${outfitColors[outfit].label}`, [gender, outfit]);
  const reset = () => { setGender("woman"); setOutfit("neon"); setHair("long"); setSkin("warm"); setAccent(palette.cyan); setAccessory("none"); setTool("none"); setAction("wave"); };
  return (
    <main className="min-h-screen bg-[#05070d] p-5 text-[#f3f5ff] selection:bg-cyan-300 selection:text-slate-950">
      <style>{`@keyframes avatar-wave { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-12deg); } } @keyframes avatar-hammer { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(13deg); } } @keyframes avatar-paint { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-7deg) translateY(-5px); } }`}</style>
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#63f7ff]/70">Авторський портал // prototype 02</p><h1 className="mt-2 font-['Cinzel'] text-3xl tracking-[0.06em] text-white md:text-4xl">Живий помічник</h1><p className="mt-2 max-w-xl font-mono text-xs leading-relaxed text-white/50">Людський персонаж, якого автор зможе переодягати, фарбувати та налаштовувати для власного світу.</p></div><div className="flex items-center gap-2 rounded-full border border-[#63f7ff]/25 bg-[#63f7ff]/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#bdfcff]"><span className="h-2 w-2 rounded-full bg-[#63f7ff] shadow-[0_0_12px_#63f7ff]" />{currentLabel}</div></header>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.78fr]">
          <section className="relative min-h-[540px] overflow-hidden rounded-[2rem] border border-[#63f7ff]/20 bg-[radial-gradient(circle_at_50%_35%,rgba(99,247,255,0.17),transparent_30%),radial-gradient(circle_at_75%_75%,rgba(255,92,173,0.17),transparent_36%),linear-gradient(145deg,#0c1324,#090711)] p-5"><div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(99,247,255,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(99,247,255,0.13)_1px,transparent_1px)] [background-size:34px_34px]" /><div className="relative flex min-h-[500px] items-center justify-center"><div className="absolute bottom-8 left-1/2 h-24 w-64 -translate-x-1/2 rounded-full border border-[#63f7ff]/20 bg-[#63f7ff]/5 blur-xl" /><div className="relative h-[470px] w-[338px]"><AvatarFigure gender={gender} outfit={outfit} hair={hair} skin={skin} accent={accent} action={action} accessory={accessory} tool={tool} /></div><div className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">preview // full body</div><div className="absolute bottom-0 right-2 rounded-full border border-[#ff5cad]/25 bg-[#ff5cad]/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#ffc3e1]">human scale</div></div></section>
          <section className="rounded-[2rem] border border-white/10 bg-[#0b0f1b]/90 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ffcf9e]">Конструктор</p><h2 className="mt-2 font-['Cinzel'] text-2xl tracking-[0.06em]">Збери свого</h2></div><button type="button" onClick={reset} className="rounded-full border border-white/10 p-2 text-white/45 transition hover:border-[#63f7ff]/50 hover:text-[#63f7ff]" aria-label="Скинути налаштування"><RotateCcw className="h-4 w-4" /></button></div>
            <div className="mt-6 space-y-5">
              <div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Представлення</p><div className="grid grid-cols-2 gap-2">{([["woman", "Жінка"], ["man", "Чоловік"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setGender(value)} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left font-mono text-xs transition ${gender === value ? "border-[#63f7ff] bg-[#63f7ff]/10 text-[#d9feff]" : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25"}`}>{label} {gender === value && <Check className="h-4 w-4 text-[#63f7ff]" />}</button>)}</div></div>
              <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Одяг</span><span className="relative block"><select value={outfit} onChange={(event) => setOutfit(event.target.value as Outfit)} className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-xs text-white outline-none focus:border-[#63f7ff]"><option value="workshop">Майстерня — куртка та пояс</option><option value="neon">Неон — світний костюм</option><option value="atelier">Ательє — довгий жакет</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-white/40" /></span></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Волосся</span><select value={hair} onChange={(event) => setHair(event.target.value as Hair)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-xs text-white outline-none focus:border-[#63f7ff]"><option value="short">Коротке</option><option value="long">Довге</option><option value="curl">Кучеряве</option></select></label><label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Тон шкіри</span><select value={skin} onChange={(event) => setSkin(event.target.value as Skin)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-xs text-white outline-none focus:border-[#63f7ff]"><option value="light">Світлий</option><option value="warm">Теплий</option><option value="deep">Глибокий</option></select></label></div>
              <div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Колір енергії</p><div className="flex gap-3">{[palette.cyan, palette.pink, palette.gold, "#a8ff78"].map((color) => <button key={color} type="button" onClick={() => setAccent(color)} aria-label={`Обрати колір ${color}`} className={`h-9 w-9 rounded-full border-2 transition ${accent === color ? "scale-110 border-white" : "border-transparent"}`} style={{ backgroundColor: color, boxShadow: `0 0 18px ${color}66` }} />)}</div></div>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Аксесуар</span><select value={accessory} onChange={(event) => setAccessory(event.target.value as Accessory)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-xs text-white outline-none focus:border-[#63f7ff]"><option value="none">Без аксесуара</option><option value="glasses">Неонові окуляри</option><option value="headphones">Навушники</option><option value="crown">Кришталева корона</option></select></label><label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Інструмент</span><select value={tool} onChange={(event) => setTool(event.target.value as Tool)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-xs text-white outline-none focus:border-[#63f7ff]"><option value="none">Без інструмента</option><option value="hammer">Молоток</option><option value="brush">Пензель</option><option value="lantern">Ліхтар</option></select></label></div>
              <div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Стан помічника</p><div className="grid grid-cols-2 gap-2">{([["wave", "Махає", WandSparkles], ["hammer", "Будує", Hammer], ["paint", "Фарбує", Paintbrush], ["build", "Портал", Wrench]] as const).map(([value, label, Icon]) => <button key={value} type="button" onClick={() => setAction(value)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left font-mono text-[11px] transition ${action === value ? "border-[#ff5cad]/70 bg-[#ff5cad]/10 text-[#ffd1e8]" : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25"}`}><Icon className="h-4 w-4" /> {label}</button>)}</div></div>
            </div>
            <div className="mt-7 rounded-xl border border-[#63f7ff]/15 bg-[#63f7ff]/[0.04] p-3"><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#bdfcff]"><Sparkles className="h-3.5 w-3.5" /> Наступний шар</p><p className="mt-2 font-mono text-[11px] leading-relaxed text-white/45">Далі перенесемо конфігурацію в кабінет автора, додамо збереження, мобільну позицію та окремі набори одягу без перезавантаження профілю.</p></div>
          </section>
        </div>
      </div>
    </main>
  );
}