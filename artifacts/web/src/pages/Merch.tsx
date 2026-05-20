import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { ProductMockup, type MockupShape } from "@/components/ProductMockup";
import { ProductModal, type ModalProduct, type ProductColor } from "@/components/ProductModal";

import art1 from "@assets/grok-1f76129b-b460-4b4a-80e7-c812c3e98e1a_1779281475325.jpg";
import art2 from "@assets/grok-62f1c14f-7ee4-4589-ad3f-2e4568fdfcba_1779281475325.jpg";
import art3 from "@assets/grok-991a2d3c-06ad-4ee7-a665-a3b4c2d1948f_1779281475325.jpg";
import art4 from "@assets/grok-5877c3fa-402a-4e00-971f-c52708d24989_1779281475325.jpg";
import art5 from "@assets/grok-27084c76-2b65-453a-8662-ea1dab68ff29_1779281475325.jpg";
import art6 from "@assets/grok-b4a9d081-9274-42db-9074-319f1b8ae94a_1779281475326.jpg";

/**
 * MERCH STORE — Gathering of the Fallen
 * ---------------------------------------------------------------
 * Кожен товар — справжній виріб (футболка/худі/кепка/чашка/постер ...)
 * з накладеним логотипом гурту. Колір тканини / розмір вибирається
 * у модалці і додається в робочий кошик (див. useCart).
 * ---------------------------------------------------------------
 * Щоб змінити ціну / арт — просто відредагуй поле в items нижче.
 */

const CLOTHING_COLORS: ProductColor[] = [
  { id: "black", label: "Чорний", hex: "#0a0a0a" },
  { id: "charcoal", label: "Графіт", hex: "#1f2937" },
  { id: "purple", label: "Фіолет", hex: "#3b0764" },
  { id: "white", label: "Білий", hex: "#f3f4f6" },
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
      { id: "tshirt-oversize", name: "Oversize футболка «Янгол»", description: "Повний арт Gathering of the Fallen", price: 650, shape: "tee", print: art1, colors: CLOTHING_COLORS, sizes: APPAREL_SIZES },
      { id: "tshirt-classic", name: "Класична футболка «Терни»", description: "Логотип у тернах на грудях", price: 550, shape: "tee", print: art2, colors: CLOTHING_COLORS, sizes: APPAREL_SIZES },
      { id: "hoodie", name: "Худі «Fallen Crest»", description: "Повний герб + текст на рукаві", price: 1450, shape: "hoodie", print: art5, colors: CLOTHING_COLORS, sizes: APPAREL_SIZES },
      { id: "zip-hoodie", name: "Zip-худі «Crimson Wings»", description: "Худі на блискавці, арт червоного янгола", price: 1550, shape: "zip-hoodie", print: art6, colors: CLOTHING_COLORS, sizes: APPAREL_SIZES, badge: "New" },
      { id: "longsleeve", name: "Лонгслів «GF Monogram»", description: "Мінімалістичне лого + арт на спині", price: 850, shape: "longsleeve", print: art3, colors: CLOTHING_COLORS, sizes: APPAREL_SIZES },
      { id: "bomber", name: "Бомбер «Cathedral»", description: "Вишивка янгола на спині", price: 1990, shape: "bomber", print: art1, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[1], CLOTHING_COLORS[2]], sizes: APPAREL_SIZES },
      { id: "cap", name: "Кепка з вишивкою", description: "Вишите лого GF, регульований ремінець", price: 450, shape: "cap", print: art4, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[2]], sizes: ["One size"], sizeLabel: "Розмір" },
      { id: "beanie", name: "Бейні «Thorns»", description: "Чорна шапка з тканим патчем", price: 390, shape: "beanie", print: art3, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[1]], sizes: ["One size"], sizeLabel: "Розмір" },
      { id: "crop-top", name: "Кроп-топ «Dark Angel»", description: "Жіночий кроп з артом янгола", price: 580, shape: "tee-crop", print: art6, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[2]], sizes: ["XS", "S", "M", "L"] },
      { id: "scarf", name: "Шарф-бандана", description: "Двосторонній арт з тернами та логотипом", price: 320, shape: "scarf", print: art4, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[2]] },
    ],
  },
  {
    id: "accessories",
    label: "Аксесуари",
    items: [
      { id: "pins", name: "Набір значків (5 шт)", description: "Лого, монограма, цитата — металева емаль", price: 320, shape: "pin", print: art3 },
      { id: "keychain", name: "Брелок металевий", description: "Литий брелок з монограмою GF", price: 180, shape: "key", print: art4, colors: [{ id: "silver", label: "Срібний", hex: "#cbd5e1" }, { id: "black-metal", label: "Чорний метал", hex: "#1f1f24" }] },
      { id: "picks", name: "Медіатори (3 шт)", description: "Авторський набір для гітаристів", price: 150, shape: "pick", print: art3, badge: "Music", colors: [{ id: "black", label: "Чорний", hex: "#0a0a0a" }, { id: "purple", label: "Фіолетовий", hex: "#6d28d9" }] },
      { id: "stickers", name: "Пак наліпок (10 шт)", description: "Лого, символи, цитати гурту", price: 120, shape: "sticker", print: art2 },
      { id: "patch", name: "Тканинний патч", description: "Вишитий патч-янгол на одяг або рюкзак", price: 220, shape: "patch", print: art1 },
      { id: "bracelet", name: "Браслет паракорд", description: "Чорний паракорд з металевим логотипом", price: 260, shape: "bracelet", print: art3, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[2]], sizes: ["S", "M", "L"], sizeLabel: "Обхват" },
      { id: "necklace", name: "Кулон «GF Cross»", description: "Срібний кулон у формі готичного хреста", price: 690, shape: "necklace", print: art3, badge: "Limited", colors: [{ id: "silver", label: "Срібло", hex: "#cbd5e1" }, { id: "black", label: "Чорнене срібло", hex: "#1f1f24" }] },
      { id: "mask", name: "Бафф-маска", description: "Чорна, з артом янгола", price: 240, shape: "mask", print: art1, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[2]] },
      { id: "socks", name: "Шкарпетки GF", description: "Чорні з фіолетовим логотипом", price: 180, shape: "socks", print: art2, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[3]], sizes: SHOE_SIZES, sizeLabel: "Розмір" },
      { id: "tote", name: "Сумка-шопер", description: "Чорна канва з повним артом гурту", price: 420, shape: "tote", print: art5, colors: [CLOTHING_COLORS[0], { id: "natural", label: "Natural", hex: "#d6c7b2" }] },
    ],
  },
  {
    id: "collectibles",
    label: "Колекційне",
    items: [
      { id: "poster", name: "Постер «Янгол»", description: "Темний арт, опція з підписом гурту", price: 350, shape: "poster", print: art1, badge: "Limited", sizes: POSTER_SIZES, sizeLabel: "Формат" },
      { id: "notebook", name: "Нотатник з тисненням", description: "Чорна обкладинка з тисненим лого GF", price: 390, shape: "notebook", print: art2, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[2]] },
      { id: "mug", name: "Термо-чашка", description: "Тримає тепло до 6 год", price: 490, shape: "mug", print: art3, colors: [CLOTHING_COLORS[0], CLOTHING_COLORS[3], CLOTHING_COLORS[2]] },
      { id: "case", name: "Чохол на телефон", description: "Арт «GF Monogram»", price: 420, shape: "case", print: art4, sizes: PHONE_MODELS, sizeLabel: "Модель" },
      { id: "vinyl", name: "Вініл LP «!3 Messages»", description: "180-грамовий чорний вініл, гейтфолд", price: 1490, shape: "vinyl", print: art5, badge: "Vinyl" },
      { id: "cd-signed", name: "CD з автографом", description: "Колекційне видання, підписане гуртом", price: 590, shape: "vinyl", print: art6, badge: "Signed" },
      { id: "flag", name: "Прапор-банер", description: "Тканинний банер 90×150 см", price: 750, shape: "flag", print: art1 },
      { id: "tapestry", name: "Гобелен на стіну", description: "100×150 см, арт «Crimson Angel»", price: 990, shape: "tapestry", print: art6 },
      { id: "box-set", name: "Колекційна коробка", description: "Постер, патч, значки, листівки в боксі", price: 1290, shape: "box", print: art5, badge: "Box Set" },
      { id: "figurine", name: "Колекційна фігурка", description: "Лімітована смоляна статуетка янгола GF", price: 1890, shape: "figurine", print: art1, badge: "Limited" },
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

  return (
    <article className="merch-card group relative flex flex-col h-full overflow-hidden rounded-md border border-white/10 bg-black transition-all duration-300 hover:border-[#00f0ff]/70 hover:shadow-[0_0_30px_rgba(0,240,255,0.35)]">
      <button onClick={() => onOpen(item)} className="relative aspect-[4/5] w-full overflow-hidden" aria-label={`Відкрити ${item.name}`}>
        <ProductMockup shape={item.shape} color={previewColor} print={item.print} />
        {item.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-sm border border-[#8a2be2]/60 bg-black/85 font-mono text-[10px] uppercase tracking-[0.3em] text-[#a855f7]">
            {item.badge}
          </span>
        )}
      </button>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-creepster text-2xl text-white leading-none tracking-wide">{item.name}</h3>
          <p className="mt-2 text-sm font-mono text-white/55 leading-snug min-h-[2.5em]">{item.description}</p>
        </div>

        {item.colors && item.colors.length > 1 && (
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
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.3em] border transition-all ${
                  active
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
