import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, ShoppingCart } from "lucide-react";
import { GlitchButton } from "./GlitchButton";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface OrderModalProps {
  product: Product | null;
  onClose: () => void;
}

const SIZES = ["S", "M", "L", "XL", "XXL"];
const PAYPAL_CLIENT_ID =
  "EPPTtiHG2EWOr-rep0FJk6xizUyTRjUQbqdnxcuNFw0YUSXkshCmh8aWLTND7TpR8PW00YXgEn6qgAvE";

type OrderStep = "form" | "payment" | "success";

export function OrderModal({ product, onClose }: OrderModalProps) {
  const [step, setStep] = useState<OrderStep>("form");
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Canada");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [comment, setComment] = useState("");
  const paypalRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  const total = product ? product.price * quantity : 0;
  const fullName = `${firstName} ${lastName}`.trim();

  const renderPayPalButtons = useCallback(() => {
    if (!paypalRef.current || paypalRendered.current || !product) return;
    paypalRendered.current = true;

    const w = window as any;
    if (!w.paypal) return;

    w.paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "black",
          shape: "rect",
          label: "pay",
        },
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                description: `${product.name} (${size}) x${quantity}`,
                amount: {
                  currency_code: "CAD",
                  value: total.toFixed(2),
                },
              },
            ],
          });
        },
        onApprove: async (_data: any, actions: any) => {
          const order = await actions.order.capture();
          console.log("PayPal order completed:", order);

          try {
            await fetch("/api/order-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                product: product.name,
                size,
                quantity,
                total: `${total.toFixed(2)} CAD`,
                customer: {
                  firstName,
                  lastName,
                  email,
                  phone,
                  country,
                  city,
                  street,
                  postalCode,
                  comment,
                },
                paypalOrderId: order.id,
                paypalStatus: order.status,
              }),
            });
          } catch (e) {
            console.log("Order notification sent (or queued)");
          }

          setStep("success");
        },
        onError: (err: any) => {
          console.error("PayPal error:", err);
          alert("Помилка оплати. Спробуйте ще раз.");
        },
      })
      .render(paypalRef.current);
  }, [
    product,
    size,
    quantity,
    total,
    firstName,
    lastName,
    email,
    phone,
    country,
    city,
    street,
    postalCode,
    comment,
  ]);

  useEffect(() => {
    if (step !== "payment") return;

    paypalRendered.current = false;

    const existingScript = document.querySelector(
      'script[src*="paypal.com/sdk"]',
    );
    if (existingScript) {
      const w = window as any;
      if (w.paypal) {
        setTimeout(renderPayPalButtons, 100);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=CAD`;
    script.async = true;
    script.onload = () => setTimeout(renderPayPalButtons, 100);
    script.onerror = () => {
      if (paypalRef.current) {
        paypalRef.current.innerHTML =
          '<p class="font-mono text-sm text-red-400">Не вдалося завантажити PayPal. Спробуйте оновити сторінку.</p>';
      }
    };
    document.body.appendChild(script);
  }, [step, renderPayPalButtons]);

  if (!product) return null;

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    phone.trim() &&
    country.trim() &&
    city.trim() &&
    street.trim() &&
    postalCode.trim();

  const inputClass =
    "w-full px-4 py-3 bg-black/60 border border-border/50 text-foreground font-mono text-sm focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="rusted-border bg-[#0a0a0a]/95 backdrop-blur-md w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-secondary/30">
            <h2 className="font-creepster text-2xl text-primary flex items-center gap-2">
              <ShoppingCart size={24} />
              {step === "success"
                ? "ЗАМОВЛЕННЯ ОПЛАЧЕНО"
                : "ЗАМОВИТИ ЧЕРЕЗ КУЗНЮ"}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {step === "form" && (
              <div className="space-y-5">
                <div className="flex gap-4 items-center p-4 bg-black/40 border border-border/50 rounded">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-mono font-bold text-foreground">
                      {product.name}
                    </h3>
                    <div className="text-primary font-creepster text-2xl">
                      {product.price} CAD
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-sm text-secondary block mb-2">
                    РОЗМІР
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`px-4 py-2 border font-mono text-sm transition-all ${
                          size === s
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border/50 text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-sm text-secondary block mb-2">
                    КІЛЬКІСТЬ
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border border-border/50 text-foreground hover:border-primary transition-colors font-mono text-lg"
                    >
                      -
                    </button>
                    <span className="font-mono text-xl text-foreground w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="w-10 h-10 border border-border/50 text-foreground hover:border-primary transition-colors font-mono text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4">
                  <h4 className="font-mono text-sm text-secondary mb-3">
                    ДАНІ ПОКУПЦЯ
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Ім'я *"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Прізвище *"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      placeholder="Телефон *"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4">
                  <h4 className="font-mono text-sm text-secondary mb-3">
                    АДРЕСА ДОСТАВКИ
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Країна *"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Місто *"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Вулиця, будинок, квартира *"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Поштовий індекс *"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-sm text-secondary block mb-2">
                    КОМЕНТАР ДО ЗАМОВЛЕННЯ
                  </label>
                  <textarea
                    placeholder="Додаткові побажання (необов'язково)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="flex justify-between items-center p-4 bg-primary/10 border border-primary/30">
                  <span className="font-mono text-secondary">РАЗОМ:</span>
                  <span className="font-creepster text-3xl text-primary">
                    {total} CAD
                  </span>
                </div>

                <GlitchButton
                  onClick={() => setStep("payment")}
                  disabled={!isFormValid}
                  className={`w-full py-4 text-lg ${!isFormValid ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  ПЕРЕЙТИ ДО ОПЛАТИ PayPal
                </GlitchButton>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-6">
                <div className="p-4 bg-black/40 border border-border/50 rounded font-mono text-sm space-y-2">
                  <div className="text-secondary">ЗАМОВЛЕННЯ:</div>
                  <div className="text-foreground">
                    {product.name} ({size}) x{quantity}
                  </div>
                  <div className="text-primary text-xl">{total} CAD</div>
                  <div className="border-t border-border/30 pt-2 mt-2 text-muted-foreground text-xs space-y-1">
                    <div>{fullName}</div>
                    <div>
                      {email} | {phone}
                    </div>
                    <div>
                      {street}, {city}, {postalCode}
                    </div>
                    <div>{country}</div>
                    {comment && <div className="italic">"{comment}"</div>}
                  </div>
                </div>

                <div className="text-center">
                  <p className="font-mono text-sm text-muted-foreground mb-4">
                    Оберіть спосіб оплати через PayPal:
                  </p>
                  <div
                    ref={paypalRef}
                    className="min-h-[150px] flex items-center justify-center"
                  >
                    <div className="font-mono text-sm text-muted-foreground animate-pulse">
                      Завантаження PayPal...
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep("form");
                    paypalRendered.current = false;
                  }}
                  className="w-full text-center font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  &lt; Повернутися до форми
                </button>
              </div>
            )}

            {step === "success" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8 space-y-6"
              >
                <CheckCircle size={64} className="mx-auto text-green-400" />
                <h3 className="font-creepster text-3xl text-primary">
                  Замовлення успішно оплачено!
                </h3>
                <p className="font-mono text-muted-foreground leading-relaxed">
                  Твій мерч уже кується в Кузні Повалених.
                  <br />
                  Дякуємо, що підтримуєш{" "}
                  <span className="text-primary">Gathering Of The Fallen</span>.
                </p>
                <p className="font-mono text-sm text-muted-foreground">
                  Підтвердження надіслано на{" "}
                  <span className="text-primary">{email}</span>
                </p>
                <div className="p-4 bg-black/40 border border-primary/30 font-mono text-sm text-left space-y-1">
                  <div className="text-secondary mb-1">ДЕТАЛІ ЗАМОВЛЕННЯ:</div>
                  <div className="text-foreground">
                    {product.name} ({size}) x{quantity}
                  </div>
                  <div className="text-primary text-lg">{total} CAD</div>
                  <div className="text-muted-foreground text-xs mt-2">
                    {fullName} | {phone}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {street}, {city}, {postalCode}, {country}
                  </div>
                </div>
                <GlitchButton onClick={onClose} className="px-8 py-3">
                  ЗАКРИТИ
                </GlitchButton>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
