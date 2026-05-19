import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Minus, Plus, ShoppingCart } from "lucide-react";
import { useT } from "@/i18n/LanguageContext";
import tshirtFrontImg from "@assets/t-shirt.png_1776018973005.png";
import tshirtBackImg from "@assets/hoodie.png_1776018973003.jpg";

const COLORS = [
  { id: "black", label: "Black", hex: "#0a0a0f" },
  { id: "white", label: "White", hex: "#f3f4f6" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];
const GALLERY = [
  { id: "front", label: "Front", img: tshirtFrontImg, caption: "Вигляд Спереду" },
  { id: "back", label: "Back", img: tshirtBackImg, caption: "Вигляд зі Спини" },
];

export default function Merch() {
  const { t } = useT();
  const [selectedColor, setSelectedColor] = useState<(typeof COLORS)[number]["id"]>("black");
  const [selectedSize, setSelectedSize] = useState<(typeof SIZES)[number]>("M");
  const [quantity, setQuantity] = useState(1);
  const [activeView, setActiveView] = useState<(typeof GALLERY)[number]["id"]>("front");
  const [added, setAdded] = useState(false);

  const activePhoto = GALLERY.find((item) => item.id === activeView) ?? GALLERY[0];
  const activeColor = COLORS.find((item) => item.id === selectedColor) ?? COLORS[0];

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [added]);

  const handleAddToCart = () => {
    setAdded(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-10 md:py-16 max-w-6xl">
      <div className="mb-8 md:mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-secondary mb-3">Gathering of the Fallen</p>
        <h1 className="font-creepster text-5xl md:text-7xl text-primary leading-none">Футболка GotF</h1>
        <p className="mt-3 max-w-2xl text-sm md:text-base font-mono text-muted-foreground">
          Створи свій варіант мерчу: подивись принт спереду і зі спини, обери колір тканини, розмір і кількість.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-10 items-start">
        <section className="rusted-border bg-black/55 overflow-hidden">
          <div className="p-4 border-b border-border/60 flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Gallery</div>
              <div className="text-sm font-mono text-foreground">{activePhoto.caption}</div>
            </div>
            <div className="flex gap-2">
              {GALLERY.map((item) => {
                const active = item.id === activeView;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] border transition-all ${active ? "border-primary text-primary bg-primary/10" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/50">
            {GALLERY.map((item) => {
              const active = item.id === activeView;
              return (
                <button key={item.id} onClick={() => setActiveView(item.id)} className="relative aspect-[4/5] bg-black overflow-hidden text-left group">
                  <img src={item.img} alt={item.caption} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3">
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-secondary">{item.label}</div>
                      <div className="mt-1 text-lg text-foreground font-bold">{item.caption}</div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${active ? "bg-primary shadow-[0_0_18px_rgba(0,240,255,0.95)]" : "bg-white/35"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rusted-border bg-black/55 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground">Product</div>
              <h2 className="mt-1 text-2xl md:text-3xl font-creepster text-primary">Фірмова футболка GotF</h2>
            </div>
            <div className="text-right">
              <div className="font-creepster text-4xl text-primary">49</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">CAD</div>
            </div>
          </div>

          <div className="mb-5 rounded border border-border/50 bg-black/40 p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Тканина</div>
            <div className="flex gap-3">
              {COLORS.map((color) => {
                const active = selectedColor === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className="relative flex flex-col items-center gap-2"
                  >
                    <span
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-full border transition-all ${active ? "border-primary shadow-[0_0_0_4px_rgba(0,240,255,0.18),0_0_24px_rgba(0,240,255,0.85)]" : "border-white/15"}`}
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className={`text-[11px] font-mono uppercase tracking-[0.2em] ${active ? "text-primary" : "text-muted-foreground"}`}>{color.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5 rounded border border-border/50 bg-black/40 p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Розмір</div>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => {
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-12 px-4 py-2 border text-sm font-mono transition-all ${active ? "border-secondary text-secondary bg-secondary/10 shadow-[0_0_22px_rgba(138,43,226,0.25)]" : "border-border/50 text-muted-foreground hover:border-secondary/40"}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5 rounded border border-border/50 bg-black/40 p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Кількість</div>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                <Minus size={16} />
              </button>
              <div className="min-w-10 text-center font-mono text-2xl text-foreground">{quantity}</div>
              <button onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="mb-6 rounded border border-primary/20 bg-black/45 p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Поточний вибір</div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 border border-primary/30 text-primary text-[11px] font-mono uppercase tracking-[0.2em]">{activePhoto.label}</span>
              <span className="px-3 py-1 border border-white/20 text-foreground text-[11px] font-mono uppercase tracking-[0.2em]">{activeColor.label}</span>
              <span className="px-3 py-1 border border-secondary/30 text-secondary text-[11px] font-mono uppercase tracking-[0.2em]">{selectedSize}</span>
              <span className="px-3 py-1 border border-white/20 text-muted-foreground text-[11px] font-mono uppercase tracking-[0.2em]">x{quantity}</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full group relative overflow-hidden rounded border border-primary/30 bg-black px-5 py-4 font-mono text-sm uppercase tracking-[0.3em] text-primary transition-all hover:border-primary hover:shadow-[0_0_18px_rgba(0,240,255,0.35),0_0_34px_rgba(138,43,226,0.2)]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <ShoppingCart size={16} />
              Add to Cart
            </span>
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle,rgba(0,240,255,0.22)_0%,rgba(138,43,226,0.08)_40%,transparent_75%)]" />
          </button>

          {added && (
            <div className="mt-4 flex items-center gap-2 text-green-400 font-mono text-sm">
              <CheckCircle size={16} />
              Додано до кошика
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
