import { useState } from "react";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
      {
        id: "tshirt-oversize",
        name: "Oversize футболка",
        description: "Чорна, лого гурту спереду + арт на спині",
        price: "650 ₴",
        icon: Shirt,
      },
      {
        id: "hoodie",
        name: "Худі Повалених",
        description: "Темне худі, лого + текст на рукаві",
        price: "1450 ₴",
        icon: ShoppingBag,
      },
      {
        id: "longsleeve",
        name: "Лонгслів",
        description: "Мінімалістичне лого на грудях і спині",
        price: "850 ₴",
        icon: Shirt,
      },
      {
        id: "cap",
        name: "Кепка / Бейні",
        description: "Вишите лого Gathering of the Fallen",
        price: "450 ₴",
        icon: ShoppingBag,
      },
    ],
  },
  {
    id: "accessories",
    label: "Аксесуари",
    items: [
      {
        id: "pins",
        name: "Набір значків (5 шт)",
        description: "Лого, цитата, символ — металева емаль",
        price: "320 ₴",
        icon: Pin,
      },
      {
        id: "keychain",
        name: "Брелок",
        description: "Метал або акрил із лого гурту",
        price: "180 ₴",
        icon: KeyRound,
      },
      {
        id: "picks",
        name: "Медіатори (3 шт)",
        description: "Авторський набір з лого — для своїх",
        price: "150 ₴",
        icon: Music2,
        badge: "Music",
      },
      {
        id: "stickers",
        name: "Пак наліпок (8 шт)",
        description: "Лого, символи, цитати гурту",
        price: "120 ₴",
        icon: Sticker,
      },
    ],
  },
  {
    id: "collectibles",
    label: "Колекційне",
    items: [
      {
        id: "poster",
        name: "Постер A2/A1",
        description: "Тeмний арт, опція з підписом гурту",
        price: "350 ₴",
        icon: ImageIcon,
        badge: "Limited",
      },
      {
        id: "notebook",
        name: "Нотатник",
        description: "Чорна обкладинка з тисненим лого",
        price: "390 ₴",
        icon: NotebookPen,
      },
      {
        id: "mug",
        name: "Термо-чашка",
        description: "Чорна з лого, тримає тепло до 6 год",
        price: "490 ₴",
        icon: Coffee,
      },
      {
        id: "case",
        name: "Чохол на телефон",
        description: "Чорний, з лого або арт-принтом",
        price: "420 ₴",
        icon: Smartphone,
      },
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

function ItemCard({ item }: { item: Item }) {
  const Icon = item.icon;
  const [bought, setBought] = useState(false);

  return (
    <article className="merch-card group relative flex flex-col h-full overflow-hidden rounded-md border border-white/10 bg-black transition-all duration-300 hover:border-[#b80000]/70 hover:shadow-[0_0_30px_rgba(184,0,0,0.35)]">
      {/* Image / placeholder */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-[#0a0000] via-black to-[#160000]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#8b0000] transition-colors group-hover:text-[#ff2b2b]">
            <Icon size={56} strokeWidth={1.25} />
            <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-white/40 text-center px-4">
              {item.name}
            </div>
          </div>
        )}

        {item.badge && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-sm border border-[#8b0000]/60 bg-black/80 font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff5050]">
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
          <div className="font-mono text-lg text-[#ff5a5a]">{item.price}</div>
          <button
            onClick={() => {
              setBought(true);
              window.setTimeout(() => setBought(false), 1500);
            }}
            className="merch-buy group/btn relative overflow-hidden rounded-sm border border-[#8b0000]/70 bg-black px-4 py-2 font-mono text-xs uppercase tracking-[0.3em] text-[#ff5a5a] transition-all hover:border-[#ff2b2b] hover:text-white hover:shadow-[0_0_18px_rgba(184,0,0,0.7)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              {bought ? (
                <>
                  <CheckCircle size={14} /> Додано
                </>
              ) : (
                <>Купити</>
              )}
            </span>
            <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[radial-gradient(circle,rgba(184,0,0,0.4)_0%,transparent_70%)]" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Merch() {
  const [filter, setFilter] = useState<FilterId>("all");
  const visible = CATEGORIES.filter((cat) => filter === "all" || cat.id === filter);

  return (
    <motion.section
      id="merch"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-20 max-w-7xl"
    >
      {/* Section header */}
      <header className="mb-10 md:mb-14 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#8b0000] mb-3">
          Gathering of the Fallen
        </p>
        <h1
          className="font-creepster text-6xl md:text-8xl text-white leading-none"
          style={{ textShadow: "0 0 28px rgba(184,0,0,0.55), 0 0 4px rgba(255,255,255,0.15)" }}
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
                    ? "border-[#8b0000] text-white bg-[#8b0000]/20 shadow-[0_0_18px_rgba(184,0,0,0.45)]"
                    : "border-white/15 text-white/55 hover:border-[#8b0000]/70 hover:text-white"
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
              <div className="flex-1 h-px bg-gradient-to-r from-[#8b0000]/70 to-transparent" />
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
                {cat.items.length} items
              </span>
            </div>

            {/* Responsive grid: 4 / 2 / 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {cat.items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
