import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";
import {
  Shirt,
  ShoppingBag,
  Sticker,
  KeyRound,
  Music2,
  Pin,
  Image as ImageIcon,
  NotebookPen,
  Coffee,
  Smartphone,
  CheckCircle,
  Disc3,
  Flag,
  Gem,
  Package,
  Backpack,
  Footprints,
  Wind,
  Crown,
  Glasses,
  Watch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import art1 from "@assets/1_1779233683472.png";
import art2 from "@assets/2_1779233683472.png";
import art3 from "@assets/3_1779233683472.png";
import art4 from "@assets/4_1779233683472.png";
import art5 from "@assets/5_1779233683473.png";
import art6 from "@assets/6_1779233683473.png";

/**
 * MERCH STORE
 * ----------------------------------------------------------------------------
 * To replace prices or add real photos:
 *   - Update the `price` field of any item below.
 *   - Replace `image: null` with `image: "/path/to/photo.jpg"` (or an import).
 *   - The card will automatically show the image instead of the placeholder.
 * ----------------------------------------------------------------------------
 */

type Category = "clothing" | "accessories" | "collectibles";

interface Item {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: LucideIcon;
  image?: string | null;
  badge?: string;
}

const CATEGORIES: { id: Category; label: string; items: Item[] }[] = [
  {
    id: "clothing",
    label: "Одяг",
    items: [
      { id: "tshirt-oversize", name: "Oversize футболка «Янгол»", description: "Чорна, повний арт Gathering of the Fallen", price: "650 ₴", icon: Shirt, image: art1 },
      { id: "tshirt-classic", name: "Класична футболка «Терни»", description: "Готичний логотип у тернах на грудях", price: "550 ₴", icon: Shirt, image: art2 },
      { id: "hoodie", name: "Худі «Fallen Crest»", description: "Темне худі, повний герб + текст на рукаві", price: "1450 ₴", icon: ShoppingBag, image: art5 },
      { id: "zip-hoodie", name: "Zip-худі «Crimson Wings»", description: "Худі на блискавці, арт червоного янгола", price: "1550 ₴", icon: ShoppingBag, image: art6, badge: "New" },
      { id: "longsleeve", name: "Лонгслів «GF Monogram»", description: "Мінімалістичне лого на грудях + арт на спині", price: "850 ₴", icon: Shirt, image: art3 },
      { id: "bomber", name: "Бомбер «Cathedral»", description: "Чорний бомбер з вишивкою янгола на спині", price: "1990 ₴", icon: ShoppingBag, image: art1 },
      { id: "cap", name: "Кепка з вишивкою", description: "Вишите лого GF, регульований ремінець", price: "450 ₴", icon: Crown, image: art4 },
      { id: "beanie", name: "Бейні «Thorns»", description: "Чорна шапка з тканим патчем", price: "390 ₴", icon: Crown, image: art3 },
      { id: "crop-top", name: "Кроп-топ «Dark Angel»", description: "Жіночий чорний кроп з артом янгола", price: "580 ₴", icon: Shirt, image: art6 },
      { id: "scarf", name: "Шарф-бандана", description: "Двосторонній арт з тернами та логотипом", price: "320 ₴", icon: Wind, image: art4 },
    ],
  },
  {
    id: "accessories",
    label: "Аксесуари",
    items: [
      { id: "pins", name: "Набір значків (5 шт)", description: "Лого, монограма, цитата, символ — металева емаль", price: "320 ₴", icon: Pin, image: art3 },
      { id: "keychain", name: "Брелок металевий", description: "Литий брелок з монограмою GF", price: "180 ₴", icon: KeyRound, image: art4 },
      { id: "picks", name: "Медіатори (3 шт)", description: "Авторський набір з лого — для гітаристів", price: "150 ₴", icon: Music2, image: art3, badge: "Music" },
      { id: "stickers", name: "Пак наліпок (10 шт)", description: "Лого, символи, цитати гурту", price: "120 ₴", icon: Sticker, image: art2 },
      { id: "patch", name: "Тканинний патч", description: "Вишитий патч-янгол на одяг чи рюкзак", price: "220 ₴", icon: Pin, image: art1 },
      { id: "bracelet", name: "Браслет паракорд", description: "Чорний паракорд з металевим логотипом", price: "260 ₴", icon: Watch, image: art3 },
      { id: "necklace", name: "Кулон «GF Cross»", description: "Срібний кулон у формі готичного хреста", price: "690 ₴", icon: Gem, image: art3, badge: "Limited" },
      { id: "mask", name: "Бафф-маска", description: "Чорна, з артом янгола на половину обличчя", price: "240 ₴", icon: Glasses, image: art1 },
      { id: "socks", name: "Шкарпетки GF", description: "Чорні з фіолетовим логотипом", price: "180 ₴", icon: Footprints, image: art2 },
      { id: "tote", name: "Сумка-шопер", description: "Чорна канва з повним артом гурту", price: "420 ₴", icon: Backpack, image: art5 },
    ],
  },
  {
    id: "collectibles",
    label: "Колекційне",
    items: [
      { id: "poster", name: "Постер A2/A1 «Янгол»", description: "Темний арт, опція з підписом гурту", price: "350 ₴", icon: ImageIcon, image: art1, badge: "Limited" },
      { id: "notebook", name: "Нотатник з тисненням", description: "Чорна обкладинка з тисненим логотипом GF", price: "390 ₴", icon: NotebookPen, image: art2 },
      { id: "mug", name: "Термо-чашка", description: "Чорна з артом, тримає тепло до 6 год", price: "490 ₴", icon: Coffee, image: art3 },
      { id: "case", name: "Чохол на телефон", description: "Чорний, з артом «GF Monogram»", price: "420 ₴", icon: Smartphone, image: art4 },
      { id: "vinyl", name: "Вініл LP «!3 Messages»", description: "180-грамовий чорний вініл, гейтфолд", price: "1490 ₴", icon: Disc3, image: art5, badge: "Vinyl" },
      { id: "cd-signed", name: "CD з автографом", description: "Колекційне видання, підписане гуртом", price: "590 ₴", icon: Disc3, image: art6, badge: "Signed" },
      { id: "flag", name: "Прапор-банер", description: "Великий тканинний банер 90×150 см", price: "750 ₴", icon: Flag, image: art1 },
      { id: "tapestry", name: "Гобелен на стіну", description: "100×150 см, арт «Crimson Angel»", price: "990 ₴", icon: ImageIcon, image: art6 },
      { id: "box-set", name: "Колекційна коробка", description: "Постер, патч, значки, листівки в боксі GF", price: "1290 ₴", icon: Package, image: art5, badge: "Box Set" },
      { id: "figurine", name: "Колекційна фігурка", description: "Лімітована смоляна статуетка янгола GF", price: "1890 ₴", icon: Gem, image: art1, badge: "Limited" },
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

function ItemCard({ item, onBuy }: { item: Item; onBuy: () => void }) {
  const Icon = item.icon;

  return (
    <article className="merch-card group relative flex flex-col h-full overflow-hidden rounded-md border border-white/10 bg-black transition-all duration-300 hover:border-[#00f0ff]/70 hover:shadow-[0_0_30px_rgba(0,240,255,0.35)]">
      {/* Image / placeholder */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-[#0a0014] via-black to-[#10001f]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-4 opacity-95 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#8a2be2] transition-colors group-hover:text-[#00f0ff]">
            <Icon size={56} strokeWidth={1.25} />
            <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-white/40 text-center px-4">
              {item.name}
            </div>
          </div>
        )}

        {item.badge && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-sm border border-[#8a2be2]/60 bg-black/80 font-mono text-[10px] uppercase tracking-[0.3em] text-[#a855f7]">
            {item.badge}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-creepster text-2xl text-white leading-none tracking-wide">
            {item.name}
          </h3>
          <p className="mt-2 text-sm font-mono text-white/55 leading-snug min-h-[2.5em]">
            {item.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="font-mono text-lg text-[#00f0ff]">{item.price}</div>
          <button
            onClick={onBuy}
            className="merch-buy group/btn relative overflow-hidden rounded-sm border border-[#8a2be2]/70 bg-black px-4 py-2 font-mono text-xs uppercase tracking-[0.3em] text-[#00f0ff] transition-all hover:border-[#00f0ff] hover:text-white hover:shadow-[0_0_18px_rgba(0,240,255,0.55)]"
          >
            <span className="relative z-10">Купити</span>
            <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[radial-gradient(circle,rgba(138,43,226,0.4)_0%,transparent_70%)]" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Merch() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [toast, setToast] = useState(false);
  const { add: addToCart } = useCart();
  const visible = CATEGORIES.filter((cat) => filter === "all" || cat.id === filter);

  const handleBuy = () => {
    addToCart();
    setToast(true);
    window.setTimeout(() => setToast(false), 2000);
  };

  return (
    <motion.section
      id="merch"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-20 max-w-7xl"
    >
      {/* Section header */}
      <header className="mb-10 md:mb-14 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#8a2be2] mb-3">
          Gathering of the Fallen
        </p>
        <h1
          className="font-creepster text-6xl md:text-8xl text-white leading-none"
          style={{ textShadow: "0 0 28px rgba(138,43,226,0.55), 0 0 4px rgba(255,255,255,0.15)" }}
        >
          MERCH
        </h1>
        <p className="mt-4 max-w-2xl mx-auto font-mono text-sm text-white/55">
          Одяг, аксесуари і колекційне для тих, хто йде з нами крізь попіл.
        </p>

        {/* Filters */}
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

      {/* Categories */}
      <div className="space-y-14">
        {visible.map((cat) => (
          <div key={cat.id}>
            <div className="mb-5 flex items-center gap-4">
              <h2 className="font-creepster text-3xl md:text-4xl text-white">
                {cat.label}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-[#8a2be2]/70 to-transparent" />
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
                {cat.items.length} items
              </span>
            </div>

            {/* Responsive grid: 4 / 2 / 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {cat.items.map((item) => (
                <ItemCard key={item.id} item={item} onBuy={handleBuy} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Toast notification */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 rounded-md border border-[#8a2be2]/70 bg-black/95 px-5 py-3 shadow-[0_0_28px_rgba(138,43,226,0.55)]">
          <CheckCircle size={18} className="text-[#00f0ff]" />
          <span className="font-mono text-sm text-white">✓ Додано до кошика!</span>
        </div>
      </div>
    </motion.section>
  );
}
