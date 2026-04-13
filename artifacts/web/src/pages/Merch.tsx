import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { CheckCircle, CreditCard, Zap } from "lucide-react";
import tshirtImg from "@assets/t-shirt.png_1776018973005.png";
import hoodieImg from "@assets/hoodie.png_1776018973003.jpg";
import bomberImg from "@assets/bomber.png_1776018973002.jpg";
import capImg from "@assets/cap.png_1776018973002.jpg";
import merchAllImg from "@assets/photo_2026-03-19_11-20-07_1776018973005.jpg";
import { GlitchButton } from "@/components/GlitchButton";
import { OrderModal } from "@/components/OrderModal";

const PRODUCTS = [
  { id: 1, name: "Футболка GF", price: 49, image: tshirtImg, status: "В НАЯВНОСТІ" },
  { id: 2, name: "Худі Повалених", price: 79, image: hoodieImg, status: "В НАЯВНОСТІ" },
  { id: 3, name: "Бомбер GF", price: 129, image: bomberImg, status: "ОБМЕЖЕНИЙ ТИРАЖ" },
  { id: 4, name: "Кепка Fallen", price: 45, image: capImg, status: "В НАЯВНОСТІ" },
];

interface StripeResult {
  status: string;
  product?: string;
  size?: string;
  quantity?: string;
  total?: string;
  customerName?: string;
}

export default function Merch() {
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
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
          <h1 className="font-creepster text-5xl md:text-7xl text-primary text-center md:text-left">МЕРЧ</h1>
          <p
            className="font-mono text-secondary text-center md:text-left mt-2 uppercase tracking-widest text-sm"
            style={{ textShadow: "0 0 10px rgba(138,43,226,0.8)" }}
          >
            Валюта: CAD (канадські долари)
          </p>
        </div>
        <Link href="/forge">
          <GlitchButton className="border-secondary text-secondary hover:bg-secondary/20 flex items-center gap-2">
            <span>&gt; ВІДВІДАТИ КУЗНЮ ПОВАЛЕНИХ</span>
          </GlitchButton>
        </Link>
      </div>

      {stripeSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-green-500/10 border border-green-500/30 rounded text-center space-y-3"
        >
          <CheckCircle size={48} className="mx-auto text-green-400" />
          <h3 className="font-creepster text-2xl text-primary">
            Замовлення оплачено!
          </h3>
          <p className="font-mono text-muted-foreground">
            Твій мерч уже кується в Кузні Повалених.
          </p>
          {stripeSuccess.product && (
            <div className="font-mono text-sm text-foreground">
              {stripeSuccess.product} {stripeSuccess.size && `(${stripeSuccess.size})`} x{stripeSuccess.quantity || 1} — {stripeSuccess.total}
            </div>
          )}
          <button
            onClick={() => setStripeSuccess(null)}
            className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
          >
            Закрити
          </button>
        </motion.div>
      )}

      <div className="rusted-border overflow-hidden mb-12 group">
        <img 
          src={merchAllImg} 
          alt="Колекція мерчу Gathering Of The Fallen" 
          loading="lazy"
          className="w-full h-auto object-cover group-hover:brightness-110 transition-all duration-500"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {PRODUCTS.map((product) => (
          <motion.div 
            key={product.id}
            whileHover={{ scale: 1.02 }}
            className="rusted-border bg-black/40 backdrop-blur-sm group flex flex-col h-full"
          >
            <div className="aspect-square w-full overflow-hidden border-b border-border relative flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
              <img 
                src={product.image} 
                alt={product.name} 
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
              />
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-mono font-bold text-lg text-foreground tracking-wider mb-1">{product.name}</h3>
              <div className="text-primary font-creepster text-2xl mb-3">{product.price} CAD</div>
              <div className="mt-auto space-y-2">
                <span className="block text-xs font-mono px-2 py-1 bg-secondary/20 text-secondary border border-secondary/50 text-center">
                  {product.status}
                </span>
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="stripe-buy-btn w-full"
                >
                  <CreditCard size={16} />
                  <Zap size={12} className="stripe-zap" />
                  <span>ОПЛАТИТИ</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedProduct && (
        <OrderModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </motion.div>
  );
}
