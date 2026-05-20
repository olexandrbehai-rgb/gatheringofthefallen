import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { ProductMockup, type MockupShape } from "@/components/ProductMockup";
import { ProductModal, type ModalProduct, type ProductColor } from "@/components/ProductModal";

import tshirtAngelFront from "@assets/grok-991a2d3c-06ad-4ee7-a665-a3b4c2d1948f_1779282522766.jpg";
import tshirtAngelBack from "@assets/grok-b4a9d081-9274-42db-9074-319f1b8ae94a_1779282522766.jpg";
import tshirtPurpleBack from "@assets/grok-eb168b15-a8fd-485f-87b0-6a6e78936ff8_1779282522767.jpg";
import tshirtGtfLogoBack from "@assets/grok-e4486323-2796-4b7c-b1fc-7d8484dbb2cd_1779282522767.jpg";
import tshirtRedAngel from "@assets/grok-d2da9d56-5ce6-429a-b6fd-005521590e2b_1779282522767.jpg";
import hoodieRedAngel from "@assets/grok-62f1c14f-7ee4-4589-ad3f-2e4568fdfcba_1779282522766.jpg";
import hoodieDarkCastle from "@assets/grok-27084c76-2b65-453a-8662-ea1dab68ff29_1779282522766.jpg";
import hoodiePurpleAngel from "@assets/grok-f5aaf40a-1ced-416e-8573-df8b2f9ecc7f_1779282522767.jpg";
import bomberLogoFront from "@assets/grok-facb31e0-2ffb-4b4a-8b65-bf04c6396de1_1779282522767.jpg";
import bomberAngelBack from "@assets/grok-1f76129b-b460-4b4a-80e7-c812c3e98e1a_1779282522766.jpg";

import legacyArt1 from "@assets/grok-991a2d3c-06ad-4ee7-a665-a3b4c2d1948f_1779281475325.jpg";
import legacyArt2 from "@assets/grok-5877c3fa-402a-4e00-971f-c52708d24989_1779281475325.jpg";
import legacyArt3 from "@assets/grok-27084c76-2b65-453a-8662-ea1dab68ff29_1779281475325.jpg";
import legacyArt4 from "@assets/grok-b4a9d081-9274-42db-9074-319f1b8ae94a_1779281475326.jpg";
import legacyArt5 from "@assets/grok-62f1c14f-7ee4-4589-ad3f-2e4568fdfcba_1779281475325.jpg";
import legacyArt6 from "@assets/grok-1f76129b-b460-4b4a-80e7-c812c3e98e1a_1779281475325.jpg";

const CLOTHING_COLORS: ProductColor[] = [
  { id: "black", label: "Чорний", hex: "#0a0a0a" },
  { id: "charcoal", label: "Графіт", hex: "#1f2937" },
];

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["36", "38", "40", "42", "44"];
const POSTER_SIZES = ["A2", "A1"];
const PHONE_MODELS = ["iPhone 13", "iPhone 14", "iPhone 15", "Galaxy S23", "Galaxy S24"];

type Category = "clothing" | "accessories" | "collectibles";

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  shape: MockupShape;
  print?: string;
  images?: string[];
  colors?: ProductColor[];
  sizes?: string[];
  sizeLabel?: string;
  badge?: string;
}

const CATEGORIES: { id: Category; label: string; items: Item[] }[] = [
  {
    id: "clothing",
    label: "Одяг",
    items: [
      {
        id: "tshirt-angel",
        name: "Оверсайз футболка — Янгол",
        description: "Повний арт занепалого янгола, фронт + спина",
        price: 850,
        shape: "tee",
        images: [tshirtAngelFront, tshirtAngelBack],
        colors: CLOTHING_COLORS,
        sizes: APPAREL_SIZES,
      },
      {
        id: "tshirt-purple",
        name: "Оверсайз футболка — Пурпур",
        description: "Спинний дизайн з тернами та логотипом GtF",
        price: 850,
        shape: "tee",
        images: [tshirtPurpleBack, tshirtGtfLogoBack],
        colors: CLOTHING_COLORS,
        sizes: APPAREL_SIZES,
      },
      {
        id: "tshirt-fire",
        name: "Оверсайз футболка — Вогонь",
        description: "Янгол з вогняним волоссям, фронт-принт",
        price: 850,
        shape: "tee",
        images: [tshirtRedAngel],
        colors: CLOTHING_COLORS,
        sizes: APPAREL_SIZES,
      },
      {
        id: "hoodie-fallen",
        name: "Худі — Занепалий Янгол",
        description: "Фронт-принт + великий арт замку на спині",
        price: 1450,
        shape: "hoodie",
        images: [hoodieRedAngel, hoodieDarkCastle],
        colors: CLOTHING_COLORS,
        sizes: APPAREL_SIZES,
      },
      {
        id: "hoodie-goddess",
        name: "Худі — Пурпурна Богиня",
        description: "Фронт-принт пурпурного янгола",
        price: 1450,
        shape: "hoodie",
        images: [hoodiePurpleAngel],
        colors: CLOTHING_COLORS,
        sizes: APPAREL_SIZES,
      },
      {
        id: "bomber-gtf",
        name: "Бомбер — Gathering of the Fallen",
        description: "Лого GtF на грудях, арт янгола на спині",
        price: 2200,
        shape: "bomber",
        images: [bomberLogoFront, bomberAngelBack],
        colors: CLOTHING_COLORS,
        sizes: APPAREL_SIZES,
        badge: "New",
      },
    ],
  },
  {
    id: "accessories",
    label: "Аксесуари",
    items: [
      { id: "pins", name: "Набір значків (5 шт)", description: "Лого, монограма, цитата — металева емаль", price: 320, shape: "pin", print: legacyArt1 },
      { id: "keychain", name: "Брелок металевий", description: "Литий брелок з монограмою GF", price: 180, shape: "key", print: legacyArt4, colors: [{ id: "silver", label: "Срібний", hex: "#cbd5e1" }, { id: "black-metal", label: "Чорний метал", hex: "#1f1f24" }] },
      { id: "picks", name: "Медіатори (3 шт)", description: "Авторський набір для гітаристів", price: 150, shape: "pick", print: legacyArt5, badge: "Music", colors: [{ id: "black", label: "Чорний", hex: "#0a0a0a" }, { id: "purple", label: "Фіолетовий", hex: "#6d28d9" }] },
      { id: "stickers", name: "Пак наліпок (10 шт)", description: "Лого, символи, цитати гурту", price: 120, shape: "sticker", print: legacyArt2 },
      { id: "patch", name: "Тканинний патч", description: "Вишитий патч-янгол на одяг або рюкзак", price: 220, shape: "patch", print: legacyArt3 },
      { id: "bracelet", name: "Браслет паракорд", description: "Чорний паракорд з металевим логотипом", price: 260, shape: "bracelet", print: legacyArt6, colors: [{ id: "black", label: "Чорний", hex: "#0a0a0a" }], sizes: ["S", "M", "L"], sizeLabel: "Обхват" },
      { id: "necklace", name: "Кулон «GF Cross»", description: "Срібний кулон у формі готичного хреста", price: 690, shape: "necklace", print: legacyArt1, badge: "Limited", colors: [{ id: "silver", label: "Срібло", hex: "#cbd5e1" }, { id: "black", label: "Чорнене срібло", hex: "#1f1f24" }] },
      { id: "mask", name: "Бафф-маска", description: "Чорна, з артом янгола", price: 240, shape: "mask", print: legacyArt2, colors: [{ id: "black", label: "Чорний", hex: "#0a0a0a" }, { id: "purple", label: "Фіолет", hex: "#3b0764" }] },
      { id: "socks", name: "Шкарпетки GF", description: "Чорні з фіолетовим логотипом", price: 180, shape: "socks", print: legacyArt5, colors: [{ id: "black", label: "Чорний", hex: "#0a0a0a" }, { id: "white", label: "Білий", hex: "#f3f4f6" }], sizes: SHOE_SIZES, sizeLabel: "Розмір" },
      { id: "tote", name: "Сумка-шопер", description: "Чорна канва з повним артом гурту", price: 420, shape: "tote", print: legacyArt4, colors: [{ id: "black", label: "Чорний", hex: "#0a0a0a" }, { id: "natural", label: "Natural", hex: "#d6c7b2" }] },
    ],
  },
  {
    id: "collectibles",
    label: "Колекційне",
    items: [
      { id: "poster", name: "Постер «Янгол»", description: "Темний арт, опція з підписом гурту", price: 350, shape: "poster", print: legacyArt1, badge: "Limited", sizes: POSTER_SIZES, sizeLabel: "Формат" },
      { id: "notebook", name: "Нотатник з тисненням", description: "Чорна обкладинка з тисненим лого GF", price: 390, shape: "notebook", print: legacyArt6 },
      { id: "mug", name: "Термо-чашка", description: "Тримає тепло до 6 год", price: 490, shape: "mug", print: legacyArt2 },
      { id: "case", name: "Чохол на телефон", description: "Арт «GF Monogram»", price: 420, shape: "case", print: legacyArt4, sizes: PHONE_MODELS, sizeLabel: "Модель" },
      { id: "vinyl", name: "Вініл LP «!3 Messages»", description: "180-грамовий чорний вініл, гейтфолд", price: 1490, shape: "vinyl", print: legacyArt5, badge: "Vinyl" },
      { id: "cd-signed", name: "CD з автографом", description: "Колекційне видання, підписане гуртом", price: 590, shape: "vinyl", print: legacyArt6, badge: "Signed" },
      { id: "flag", name: "Прапор-банер", description: "Тканинний банер 90×150 см", price: 750, shape: "flag", print: legacyArt3 },
      { id: "tapestry", name: "Гобелен на стіну", description: "100×150 см, арт «Crimson Angel»", price: 990, shape: "tapestry", print: legacyArt1 },
      { id: "box-set", name: "Колекційна коробка", description: "Постер, патч, значки, листівки в боксі", price: 1290, shape: "box", print: legacyArt2, badge: "Box Set" },
      { id: "figurine", name: "Колекційна фігурка", description: "Лімітована смоляна статуетка янгола GF", price: 1890, shape: "figurine", print: legacyArt4, badge: "Limited" },
    ],
  },
];

type FilterId = "all" | Category;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Усе" },
  { id: "clothing", label: "Одяг" },
  { id: "accessories", label: "Аксесуари" },
  { id: "collectibles", label: "Колекційне" },
];

function ItemCard({ item, onOpen }: { item: Item; onOpen: (item: Item) => void }) {
  const [previewColor, setPreviewColor] = useState(item.colors?.[0]?.hex ?? "#0a0a0a");
  const hasImages = !!item.images && item.images.length > 0;
  const [hoverIdx, setHoverIdx] = useState(0);
  const heroImg = hasImages ? item.images![hoverIdx] ?? item.images![0] : undefined;

  return (
    <article className="merch-card group relative flex flex-col h-full overflow-hidden rounded-md border border-white/10 bg-black transition-all duration-300 hover:border-[#00f0ff]/70 hover:shadow-[0_0_30px_rgba(0,240,255,0.35)]">
      <div className={`relative w-full overflow-hidden ${hasImages ? "h-[320px] bg-[#0a0a0a]" : "aspect-[4/5]"}`}>
        <button
          type="button"
          onClick={() => onOpen(item)}
          aria-label={`Відкрити ${item.name}`}
          className="absolute inset-0 w-full h-full z-0"
        >
          {hasImages ? (
            <img
              src={heroImg}
              alt={item.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <ProductMockup shape={item.shape} color={previewColor} print={item.print} />
          )}
        </button>
        {item.badge && (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-sm border border-[#8a2be2]/60 bg-black/85 font-mono text-[10px] uppercase tracking-[0.3em] text-[#a855f7] pointer-events-none">
            {item.badge}
          </span>
        )}
        {hasImages && item.images!.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {item.images!.map((_, i) => {
              const active = i === hoverIdx;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoverIdx(i);
                  }}
                  aria-label={`Фото ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${active ? "w-6 bg-[#00f0ff]" : "w-2 bg-white/40 hover:bg-white/70"}`}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-creepster text-2xl text-white leading-none tracking-wide">{item.name}</h3>
          <p className="mt-2 text-sm font-mono text-white/55 leading-snug min-h-[2.5em]">{item.description}</p>
        </div>

        {!hasImages && item.colors && item.colors.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Колір</span>
            <div className="flex gap-1.5">
              {item.colors.map((c) => {
                const active = previewColor === c.hex;
                return (
                  <button
                    key={c.id}
                    onClick={() => setPreviewColor(c.hex)}
                    aria-label={c.label}
                    className={`w-5 h-5 rounded-full border transition-all ${active ? "border-[#00f0ff] shadow-[0_0_0_2px_rgba(0,240,255,0.2)]" : "border-white/25 hover:border-white/60"}`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="font-mono text-lg text-[#00f0ff]">{item.price} ₴</div>
          <button
            onClick={() => onOpen(item)}
            className="group/btn relative overflow-hidden rounded-sm border border-[#8a2be2]/70 bg-black px-4 py-2 font-mono text-xs uppercase tracking-[0.3em] text-[#00f0ff] transition-all hover:border-[#00f0ff] hover:text-white hover:shadow-[0_0_18px_rgba(0,240,255,0.55)]"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              <ShoppingCart size={12} />
              Купити
            </span>
            <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[radial-gradient(circle,rgba(138,43,226,0.4)_0%,transparent_70%)]" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Merch() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [active, setActive] = useState<ModalProduct | null>(null);
  const visible = CATEGORIES.filter((cat) => filter === "all" || cat.id === filter);

  const open = useMemo(
    () => (item: Item) =>
      setActive({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        shape: item.shape,
        print: item.print,
        images: item.images,
        colors: item.colors,
        sizes: item.sizes,
        sizeLabel: item.sizeLabel,
      }),
    [],
  );

  return (
    <motion.section
      id="merch"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-20 max-w-7xl"
    >
      <header className="mb-10 md:mb-14 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#8a2be2] mb-3">Gathering of the Fallen</p>
        <h1
          className="font-creepster text-6xl md:text-8xl text-white leading-none"
          style={{ textShadow: "0 0 28px rgba(138,43,226,0.55), 0 0 4px rgba(255,255,255,0.15)" }}
        >
          MERCH
        </h1>
        <p className="mt-4 max-w-2xl mx-auto font-mono text-sm text-white/55">
          Одяг, аксесуари і колекційне для тих, хто йде з нами крізь попіл.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.3em] border transition-all ${
                  isActive
                    ? "border-[#8a2be2] text-white bg-[#8a2be2]/20 shadow-[0_0_18px_rgba(0,240,255,0.45)]"
                    : "border-white/15 text-white/55 hover:border-[#8a2be2]/70 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="space-y-14">
        {visible.map((cat) => (
          <div key={cat.id}>
            <div className="mb-5 flex items-center gap-4">
              <h2 className="font-creepster text-3xl md:text-4xl text-white">{cat.label}</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-[#8a2be2]/70 to-transparent" />
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
                {cat.items.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {cat.items.map((item) => (
                <ItemCard key={item.id} item={item} onOpen={open} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <ProductModal product={active} onClose={() => setActive(null)} />
    </motion.section>
  );
}
