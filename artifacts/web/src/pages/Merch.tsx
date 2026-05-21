import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { ProductModal, type ModalProduct } from "@/components/ProductModal";
import { useCurrency } from "@/hooks/useCurrency";
import type { ProductType } from "@/lib/pricing";

import tshirt1Front from "@assets/1frontt-shirt_1779322287600.png";
import tshirt1Back from "@assets/1backt-shirt_1779322287600.png";
import tshirt2Front from "@assets/2frontt-shirt_1779322287600.png";
import tshirt2Back from "@assets/2backt-shirt_1779322287600.png";
import tshirt3Front from "@assets/3frontt-shirt_1779322287600.png";
import tshirt3Back from "@assets/3backt-shirt_1779322287600.png";
import hoodie4Front from "@assets/4fronthoodie_1779322287601.png";
import hoodie4Back from "@assets/4backhoodie_1779322287601.png";
import hoodie5Front from "@assets/5fronthoodie_1779322287601.png";
import hoodie5Back from "@assets/5backhoodie_1779322287601.png";

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface Item {
  id: string;
  productType: ProductType;
  name: string;
  description: string;
  images: string[];
  sizes: string[];
  badge?: string;
}

const ITEMS: Item[] = [
  {
    id: "tshirt-01-thorns",
    productType: "tee-premium",
    name: "Футболка №1 — Терновий Янгол",
    description: "Фронт — лого в терновому ореолі. Спина — повний арт янгола GtF",
    images: [tshirt1Front, tshirt1Back],
    sizes: APPAREL_SIZES,
  },
  {
    id: "tshirt-02-eclipse",
    productType: "tee-premium",
    name: "Футболка №2 — Затемнення",
    description: "Фронт — мінімалістичне лого GtF у тернах. Спина — янгол із затемненням",
    images: [tshirt2Front, tshirt2Back],
    sizes: APPAREL_SIZES,
  },
  {
    id: "tshirt-03-cathedral",
    productType: "tee-premium",
    name: "Футболка №3 — Катедраль",
    description: "Фронт — янгол у колі. Спина — сцена катедралі з янголом і служителями",
    images: [tshirt3Front, tshirt3Back],
    sizes: APPAREL_SIZES,
    badge: "New",
  },
  {
    id: "hoodie-04-goddess",
    productType: "hoodie",
    name: "Худі №4 — Пурпурна Богиня",
    description: "Фронт — лого GtF. Спина — повний арт богині з крилами",
    images: [hoodie4Front, hoodie4Back],
    sizes: APPAREL_SIZES,
  },
  {
    id: "hoodie-05-cemetery",
    productType: "hoodie",
    name: "Худі №5 — Цвинтар",
    description: "Фронт — мала емблема GtF. Спина — янгол над цвинтарем",
    images: [hoodie5Front, hoodie5Back],
    sizes: APPAREL_SIZES,
    badge: "New",
  },
];

function ItemCard({ item, onOpen }: { item: Item; onOpen: (item: Item) => void }) {
  const { priceFor, format } = useCurrency();
  const [hoverIdx, setHoverIdx] = useState(0);
  const heroImg = item.images[hoverIdx] ?? item.images[0];
  const price = priceFor(item.productType);

  return (
    <article className="merch-card group relative flex flex-col h-full overflow-hidden rounded-md border border-white/10 bg-black transition-all duration-300 hover:border-[#00f0ff]/70 hover:shadow-[0_0_30px_rgba(0,240,255,0.35)]">
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        <button
          type="button"
          onClick={() => onOpen(item)}
          aria-label={`Відкрити ${item.name}`}
          className="absolute inset-0 w-full h-full z-0"
        >
          <img
            src={heroImg}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </button>
        {item.badge && (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-sm border border-[#8a2be2]/60 bg-black/85 font-mono text-[10px] uppercase tracking-[0.3em] text-[#a855f7] pointer-events-none">
            {item.badge}
          </span>
        )}
        {item.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {item.images.map((_, i) => {
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

        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="font-mono text-lg text-[#00f0ff]">{format(price)}</div>
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
  const [active, setActive] = useState<ModalProduct | null>(null);

  const open = useMemo(
    () => (item: Item) =>
      setActive({
        id: item.id,
        productType: item.productType,
        name: item.name,
        description: item.description,
        images: item.images,
        sizes: item.sizes,
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
          Одяг для тих, хто йде з нами крізь попіл.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {ITEMS.map((item) => (
          <ItemCard key={item.id} item={item} onOpen={open} />
        ))}
      </div>

      <ProductModal product={active} onClose={() => setActive(null)} />
    </motion.section>
  );
}
