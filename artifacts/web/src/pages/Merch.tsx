import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, CheckCircle, XCircle } from "lucide-react";
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
    <article className="apoc-card merch-card group relative flex flex-col h-full border border-white/10 bg-black">
      <div
        className="merch-card-stage relative w-full aspect-[3/4] overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, #2a1240 0%, #160826 38%, #0a0414 70%, #050208 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(138,43,226,0.28) 0%, rgba(0,240,255,0.06) 35%, transparent 65%)",
            mixBlendMode: "screen",
          }}
        />
        <button
          type="button"
          onClick={() => onOpen(item)}
          aria-label={`Відкрити ${item.name}`}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={heroImg}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            style={{ filter: "url(#gtf-knockout-white)" }}
          />
        </button>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.55) 0%, transparent 55%), linear-gradient(180deg, transparent 70%, rgba(0,0,0,0.45) 100%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)",
            mixBlendMode: "overlay",
          }}
        />
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
          <h3 className="glitch-text font-creepster text-2xl text-white leading-none tracking-wide">{item.name}</h3>
          <p className="mt-2 text-sm font-mono text-white/55 leading-snug min-h-[2.5em]">{item.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="font-mono text-lg text-[#00f0ff]">{format(price)}</div>
          <button
            onClick={() => onOpen(item)}
            className="metal-btn font-mono text-xs uppercase tracking-[0.3em]"
            style={{ padding: "10px 18px" }}
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              <ShoppingCart size={12} />
              Купити
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Merch() {
  const [active, setActive] = useState<ModalProduct | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "cancelled" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success" || payment === "cancelled") {
      setPaymentStatus(payment);
      // Clean URL so refresh doesn't re-trigger the banner.
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("order_id");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

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
      {paymentStatus === "success" && (
        <div className="mb-8 mx-auto max-w-2xl rounded border border-[#22ff88]/60 bg-[#0a4d2e]/30 p-5 text-center shadow-[0_0_30px_rgba(34,255,136,0.35)]">
          <CheckCircle size={40} className="mx-auto text-[#22ff88] mb-3" />
          <h2 className="font-creepster text-2xl text-white mb-2">Оплату прийнято!</h2>
          <p className="font-mono text-sm text-white/75">
            Дякуємо за замовлення. Ми зв'яжемось з тобою найближчим часом для уточнення доставки.
          </p>
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="mb-8 mx-auto max-w-2xl rounded border border-[#ffcc22]/60 bg-[#4d3a0a]/30 p-5 text-center">
          <XCircle size={40} className="mx-auto text-[#ffcc22] mb-3" />
          <h2 className="font-creepster text-2xl text-white mb-2">Оплату скасовано</h2>
          <p className="font-mono text-sm text-white/75">
            Замовлення не оформлено. Можеш додати товари знову і спробувати ще раз.
          </p>
        </div>
      )}

      <header className="mb-10 md:mb-14 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#8a2be2] mb-3">Gathering of the Fallen</p>
        <h1
          className="glitch-text font-creepster text-6xl md:text-8xl text-white leading-none"
          style={{ textShadow: "0 0 28px rgba(138,43,226,0.55), 0 0 4px rgba(255,255,255,0.15)" }}
        >
          MERCH
        </h1>
        <p className="mt-4 max-w-2xl mx-auto font-mono text-sm text-white/55">
          Одяг для тих, хто йде з нами крізь попіл.
        </p>
      </header>

      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <filter id="gtf-knockout-white" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      -1.4 -1.4 -1.4 0 3.1"
            />
            <feComponentTransfer>
              <feFuncA type="linear" slope="6" intercept="-2.4" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {ITEMS.map((item) => (
          <ItemCard key={item.id} item={item} onOpen={open} />
        ))}
      </div>

      <ProductModal product={active} onClose={() => setActive(null)} />
    </motion.section>
  );
}
