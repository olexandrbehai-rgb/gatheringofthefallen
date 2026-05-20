import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { ProductModal, type ModalProduct } from "@/components/ProductModal";

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

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  sizes: string[];
  badge?: string;
}

const ITEMS: Item[] = [
  {
    id: "tshirt-angel",
    name: "Оверсайз футболка — Янгол",
    description: "Повний арт занепалого янгола, фронт + спина",
    price: 850,
    images: [tshirtAngelFront, tshirtAngelBack],
    sizes: APPAREL_SIZES,
  },
  {
    id: "tshirt-purple",
    name: "Оверсайз футболка — Пурпур",
    description: "Спинний дизайн з тернами та логотипом GtF",
    price: 850,
    images: [tshirtPurpleBack, tshirtGtfLogoBack],
    sizes: APPAREL_SIZES,
  },
  {
    id: "tshirt-fire",
    name: "Оверсайз футболка — Вогонь",
    description: "Янгол з вогняним волоссям, фронт-принт",
    price: 850,
    images: [tshirtRedAngel],
    sizes: APPAREL_SIZES,
  },
  {
    id: "hoodie-fallen",
    name: "Худі — Занепалий Янгол",
    description: "Фронт-принт + великий арт замку на спині",
    price: 1450,
    images: [hoodieRedAngel, hoodieDarkCastle],
    sizes: APPAREL_SIZES,
  },
  {
    id: "hoodie-goddess",
    name: "Худі — Пурпурна Богиня",
    description: "Фронт-принт пурпурного янгола",
    price: 1450,
    images: [hoodiePurpleAngel],
    sizes: APPAREL_SIZES,
  },
  {
    id: "bomber-gtf",
    name: "Бомбер — Gathering of the Fallen",
    description: "Лого GtF на грудях, арт янгола на спині",
    price: 2200,
    images: [bomberLogoFront, bomberAngelBack],
    sizes: APPAREL_SIZES,
    badge: "New",
  },
];

function ItemCard({ item, onOpen }: { item: Item; onOpen: (item: Item) => void }) {
  const [hoverIdx, setHoverIdx] = useState(0);
  const heroImg = item.images[hoverIdx] ?? item.images[0];

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
  const [active, setActive] = useState<ModalProduct | null>(null);

  const open = useMemo(
    () => (item: Item) =>
      setActive({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
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
