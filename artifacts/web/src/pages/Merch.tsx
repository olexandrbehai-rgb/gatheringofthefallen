import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, CreditCard, Zap, Loader2, Plus, Minus } from "lucide-react";
import { useT } from "@/i18n/LanguageContext";
import tshirtImg from "@assets/t-shirt.png_1776018973005.png";
import hoodieImg from "@assets/hoodie.png_1776018973003.jpg";
import bomberImg from "@assets/bomber.png_1776018973002.jpg";
import capImg from "@assets/cap.png_1776018973002.jpg";
import merchAllImg from "@assets/photo_2026-03-19_11-20-07_1776018973005.jpg";

const COLORS = [
  { id: "black", label: "Black", hex: "#0b0b0f" },
  { id: "purple", label: "Purple", hex: "#6f2cff" },
  { id: "violet", label: "Violet", hex: "#a855f7" },
  { id: "ash", label: "Ash Gray", hex: "#9ca3af" },
  { id: "bone", label: "Bone", hex: "#d6c7b2" },
  { id: "crimson", label: "Crimson", hex: "#8b1e2d" },
  { id: "navy", label: "Midnight Navy", hex: "#0f1b3d" },
  { id: "sand", label: "Sand", hex: "#c2a46b" },
];

const FITS = [
  { id: "classic", label: "Classic fit" },
  { id: "oversized", label: "Oversized" },
  { id: "boxy", label: "Boxy" },
  { id: "cropped", label: "Cropped" },
  { id: "longline", label: "Longline" },
  { id: "sleeveless", label: "Sleeveless" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const PRODUCTS = [
  { id: "t-shirt", price: 49, image: tshirtImg },
  { id: "hoodie", price: 79, image: hoodieImg },
  { id: "bomber", price: 129, image: bomberImg },
  { id: "cap", price: 45, image: capImg },
];

interface StripeResult {
  status: string;
  product?: string;
  size?: string;
  color?: string;
  fit?: string;
  quantity?: string;
  total?: string;
  customerName?: string;
}

function ProductCard({ product }: { product: typeof PRODUCTS[0] }) {
  const { t } = useT();
  const productName = t(`merch.products.${product.id}`);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].id);
  const [selectedFit, setSelectedFit] = useState(FITS[0].id);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
          size: selectedSize,
          color: selectedColor,
          fit: selectedFit,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  const totalPrice = product.price * quantity;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rusted-border bg-black/40 backdrop-blur-sm group flex flex-col h-full"
    >
      <div className="aspect-square w-full overflow-hidden border-b border-border relative flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
        <img
          src={product.image}
          alt={productName}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
        />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-mono font-bold text-lg text-foreground tracking-wider mb-1">
          {productName}
        </h3>
        <div className="text-primary font-creepster text-3xl mb-4">
          {product.price} CAD
        </div>

        <div className="mb-3">
          <div className="font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            {t("merch.size")}
          </div>
          <div className="flex gap-1 flex-wrap">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`px-2.5 py-1 font-mono text-xs transition-all ${
                  selectedSize === s
                    ? "bg-primary/20 border-primary text-primary border"
                    : "border border-border/40 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            Color
          </div>
          <div className="grid grid-cols-2 gap-2">
            {COLORS.map((color) => {
              const active = selectedColor === color.id;
              return (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  className={`px-3 py-2 border text-[11px] font-mono transition-all flex items-center gap-2 ${
                    active
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border/40 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full border border-white/30"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3">
          <div className="font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            Shape
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FITS.map((fit) => {
              const active = selectedFit === fit.id;
              return (
                <button
                  key={fit.id}
                  onClick={() => setSelectedFit(fit.id)}
                  className={`px-3 py-2 border text-[11px] font-mono uppercase tracking-wide transition-all ${
                    active
                      ? "border-secondary text-secondary bg-secondary/10"
                      : "border-border/40 text-muted-foreground hover:border-secondary/50"
                  }`}
                >
                  {fit.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <div className="font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            {t("merch.quantity")}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center border border-border/40 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
            >
              <Minus size={14} />
            </button>
            <span className="font-mono text-lg text-foreground w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="w-8 h-8 flex items-center justify-center border border-border/40 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="mt-auto">
          <div className="mb-3 text-[11px] font-mono text-muted-foreground space-y-1">
            <div>Color: {COLORS.find((c) => c.id === selectedColor)?.label}</div>
            <div>Shape: {FITS.find((f) => f.id === selectedFit)?.label}</div>
          </div>
          <button
            onClick={handleStripeCheckout}
            disabled={loading}
            className={`stripe-buy-btn w-full ${loading ? "opacity-70 pointer-events-none" : ""}`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("merch.redirecting")}</span>
              </>
            ) : (
              <>
                <CreditCard size={16} />
                <Zap size={12} className="stripe-zap" />
                <span>{t("merch.pay")} {totalPrice} CAD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Merch() {
  const { t } = useT();
  const [stripeSuccess, setStripeSuccess] = useState<StripeResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");

    if (payment === "success" && sessionId) {
      fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "paid") {
            setStripeSuccess(data);
          }
        })
        .catch(() => {});
      window.history.replaceState({}, "", "/merch");
    } else if (payment === "cancelled") {
      window.history.replaceState({}, "", "/merch");
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-6xl"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="font-creepster text-5xl md:text-7xl text-primary text-center md:text-left">
            {t("merch.title")}
          </h1>
          <p
            className="font-mono text-secondary text-center md:text-left mt-2 uppercase tracking-widest text-sm"
            style={{ textShadow: "0 0 10px rgba(138,43,226,0.8)" }}
          >
            {t("merch.subtitle")}
          </p>
        </div>
      </div>

      {stripeSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-green-500/10 border border-green-500/30 rounded text-center space-y-3"
        >
          <CheckCircle size={48} className="mx-auto text-green-400" />
          <h3 className="font-creepster text-2xl text-primary">{t("merch.paid")}</h3>
          <p className="font-mono text-muted-foreground">{t("merch.paidDetails")}</p>
          {stripeSuccess.product && (
            <div className="font-mono text-sm text-foreground">
              {stripeSuccess.product} {stripeSuccess.size && `(${stripeSuccess.size})`} x
              {stripeSuccess.quantity || 1} — {stripeSuccess.total}
              {stripeSuccess.color ? ` · ${stripeSuccess.color}` : ""}
              {stripeSuccess.fit ? ` · ${stripeSuccess.fit}` : ""}
            </div>
          )}
          {stripeSuccess.customerName && (
            <div className="font-mono text-xs text-muted-foreground">
              {stripeSuccess.customerName}
            </div>
          )}
          <button
            onClick={() => setStripeSuccess(null)}
            className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
          >
            {t("merch.close")}
          </button>
        </motion.div>
      )}

      <div className="rusted-border overflow-hidden mb-12 group">
        <img
          src={merchAllImg}
          alt={t("merch.galleryAlt")}
          loading="lazy"
          className="w-full h-auto object-cover group-hover:brightness-110 transition-all duration-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </motion.div>
  );
}
