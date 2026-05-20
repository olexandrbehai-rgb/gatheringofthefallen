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

const CLOTHING_COLORS: ProductColor[] = [
  { id: "black", label: "Чорний", hex: "#0a0a0a" },
  { id: "charcoal", label: "Графіт", hex: "#1f2937" },
];

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

type Category = "clothing";

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
  const [active, setActive] = useState<ModalProduct | null>(null);
  const items = CATEGORIES[0].items;

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
          Одяг для тих, хто йде з нами крізь попіл.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onOpen={open} />
        ))}
      </div>

      <ProductModal product={active} onClose={() => setActive(null)} />
    </motion.section>
  );
}
