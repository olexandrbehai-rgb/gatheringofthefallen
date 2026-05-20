import { useEffect, useState } from "react";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { ProductMockup, type MockupShape } from "./ProductMockup";

export interface ProductColor {
  id: string;
  label: string;
  hex: string;
}

export interface ModalProduct {
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
}

interface Props {
  product: ModalProduct | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: Props) {
  const { addItem, open: openCart } = useCart();
  const [colorId, setColorId] = useState<string | undefined>(undefined);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!product) return;
    setColorId(product.colors?.[0]?.id);
    setSize(product.sizes?.[0]);
    setQty(1);
    setActiveImg(0);
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (product) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;
  const color = product.colors?.find((c) => c.id === colorId) ?? product.colors?.[0];
  const hasImages = !!product.images && product.images.length > 0;
  const currentImg = hasImages ? product.images![Math.min(activeImg, product.images!.length - 1)] : undefined;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty,
      color,
      size,
      image: currentImg,
    });
    onClose();
    openCart();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-auto rounded-lg border border-[#8a2be2]/40 bg-black shadow-[0_0_40px_rgba(138,43,226,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Закрити"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/70 hover:text-white hover:border-[#00f0ff] transition-colors"
        >
          <X size={16} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {hasImages ? (
            <div className="bg-[#0a0a0a] flex flex-col">
              <div className="relative w-full aspect-square overflow-hidden bg-[#0a0a0a]">
                <img
                  src={currentImg}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              {product.images!.length > 1 && (
                <div className="flex gap-2 p-3 bg-black border-t border-white/10 overflow-x-auto">
                  {product.images!.map((src, i) => {
                    const active = i === activeImg;
                    return (
                      <button
                        key={src}
                        onClick={() => setActiveImg(i)}
                        className={`relative h-20 w-20 flex-none overflow-hidden rounded border-2 transition-all ${active ? "border-[#00f0ff] shadow-[0_0_14px_rgba(0,240,255,0.5)]" : "border-white/15 hover:border-white/40"}`}
                        aria-label={`Фото ${i + 1}`}
                      >
                        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#0a0014] via-black to-[#10001f] aspect-square md:aspect-auto">
              <ProductMockup shape={product.shape} color={color?.hex ?? "#0a0a0a"} print={product.print} />
            </div>
          )}

          <div className="p-6 md:p-8 flex flex-col gap-5">
            <div>
              <h2 className="font-creepster text-3xl md:text-4xl text-white leading-tight">
                {product.name}
              </h2>
              <p className="mt-2 font-mono text-sm text-white/55">{product.description}</p>
              <div className="mt-3 font-mono text-2xl text-[#00f0ff]">{product.price} ₴</div>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/55 mb-3">
                  Колір {color && <span className="text-white/80">— {color.label}</span>}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((c) => {
                    const active = colorId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setColorId(c.id)}
                        aria-label={c.label}
                        className={`relative w-11 h-11 rounded-full border-2 transition-all ${active ? "border-[#00f0ff] shadow-[0_0_0_4px_rgba(0,240,255,0.15),0_0_22px_rgba(0,240,255,0.7)]" : "border-white/20 hover:border-white/40"}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/55 mb-3">
                  {product.sizeLabel ?? "Розмір"} {size && <span className="text-white/80">— {size}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const active = size === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`min-w-[3rem] px-3 py-2 font-mono text-sm border transition-all ${active ? "border-[#8a2be2] bg-[#8a2be2]/20 text-white shadow-[0_0_16px_rgba(138,43,226,0.45)]" : "border-white/15 text-white/55 hover:border-[#8a2be2]/70 hover:text-white"}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/55 mb-3">Кількість</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 border border-white/15 flex items-center justify-center text-white/60 hover:text-[#00f0ff] hover:border-[#00f0ff]/60 transition-all"
                  aria-label="Менше"
                >
                  <Minus size={16} />
                </button>
                <div className="min-w-[2.5rem] text-center font-mono text-2xl text-white">{qty}</div>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 border border-white/15 flex items-center justify-center text-white/60 hover:text-[#00f0ff] hover:border-[#00f0ff]/60 transition-all"
                  aria-label="Більше"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/45">Разом</div>
                <div className="font-mono text-2xl text-[#00f0ff]">{product.price * qty} ₴</div>
              </div>
              <button
                onClick={handleAdd}
                className="group relative overflow-hidden rounded border border-[#8a2be2]/70 bg-black px-5 py-3 font-mono text-sm uppercase tracking-[0.3em] text-[#00f0ff] hover:border-[#00f0ff] hover:text-white hover:shadow-[0_0_22px_rgba(0,240,255,0.55)] transition-all"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ShoppingCart size={16} />
                  У кошик
                </span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle,rgba(138,43,226,0.4)_0%,transparent_70%)]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
