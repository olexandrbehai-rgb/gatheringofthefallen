import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, ShoppingCart, CreditCard, Loader2 } from "lucide-react";
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
type PaymentMethod = "stripe" | "paypal";

export function OrderModal({ product, onClose }: OrderModalProps) {
  const [step, setStep] = useState<OrderStep>("form");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
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
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  const total = product ? product.price * quantity : 0;
  const fullName = `${firstName} ${lastName}`.trim();

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    phone.trim() &&
    country.trim() &&
    city.trim() &&
    street.trim() &&
    postalCode.trim();

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const w = window as any;
    if (w.paypal) {
      setSdkReady(true);
      return;
    }

    const startPolling = () => {
      pollTimer = setInterval(() => {
        if ((window as any).paypal) {
          if (!cancelled) setSdkReady(true);
          if (pollTimer) clearInterval(pollTimer);
          if (timeoutTimer) clearTimeout(timeoutTimer);
        }
      }, 300);

      timeoutTimer = setTimeout(() => {
        if (pollTimer) clearInterval(pollTimer);
        if (!cancelled && !(window as any).paypal) {
          setSdkError(true);
        }
      }, 15000);
    };

    const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=CAD&intent=capture`;
    script.async = true;
    script.onload = () => {
      if (!cancelled) {
        const checkReady = setInterval(() => {
          if ((window as any).paypal) {
            setSdkReady(true);
            clearInterval(checkReady);
          }
        }, 100);
        setTimeout(() => clearInterval(checkReady), 5000);
      }
    };
    script.onerror = () => {
      if (!cancelled) setSdkError(true);
    };
    document.head.appendChild(script);
    startPolling();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, []);

  const handleStripeCheckout = async () => {
    if (!product) return;
    setStripeLoading(true);
    setStripeError("");

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: product.name,
          size,
          quantity,
          price: product.price,
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
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setStripeError(data.error || "Не вдалося створити сесію оплати");
      }
    } catch {
      setStripeError("Помилка з'єднання з сервером");
    } finally {
      setStripeLoading(false);
    }
  };

  const renderPaypalButtons = useCallback(() => {
    const w = window as any;
    if (!w.paypal || !paypalContainerRef.current || !product || buttonsRendered.current) return;

    buttonsRendered.current = true;

    w.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "black",
        shape: "rect",
        label: "pay",
        tagline: false,
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

        try {
          await fetch("/api/order-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product: product.name,
              size,
              quantity,
              total: `${total.toFixed(2)} CAD`,
              customer: { firstName, lastName, email, phone, country, city, street, postalCode, comment },
              paypalOrderId: order.id,
              paypalStatus: order.status,
            }),
          });
        } catch {
          console.log("Order notification queued");
        }

        setStep("success");
      },
      onError: (err: any) => {
        console.error("PayPal error:", err);
      },
    }).render(paypalContainerRef.current);
  }, [product, size, quantity, total, firstName, lastName, email, phone, country, city, street, postalCode, comment]);

  useEffect(() => {
    if (step === "payment" && paymentMethod === "paypal" && sdkReady) {
      buttonsRendered.current = false;
      const timer = setTimeout(renderPaypalButtons, 300);
      return () => clearTimeout(timer);
    }
  }, [step, paymentMethod, sdkReady, renderPaypalButtons]);

  if (!product) return null;

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
                : step === "payment"
                  ? "ОПЛАТА"
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
                  ПЕРЕЙТИ ДО ОПЛАТИ
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

                <div>
                  <p className="font-mono text-sm text-muted-foreground mb-4 text-center">
                    Оберіть спосіб оплати:
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setPaymentMethod("stripe")}
                      className={`p-4 border font-mono text-sm transition-all flex flex-col items-center gap-2 ${
                        paymentMethod === "stripe"
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <CreditCard size={24} />
                      <span className="font-bold">Stripe</span>
                      <span className="text-xs opacity-70">Visa, Mastercard, Amex</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("paypal")}
                      className={`p-4 border font-mono text-sm transition-all flex flex-col items-center gap-2 ${
                        paymentMethod === "paypal"
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.644h6.568c2.175 0 3.88.564 4.934 1.635 1.013 1.027 1.373 2.49 1.07 4.348-.36 2.209-1.263 3.818-2.682 4.779-1.357.921-3.106 1.388-5.194 1.388H8.76a.77.77 0 0 0-.757.644l-.928 5.467zm13.917-13.98c-.01.064-.02.128-.032.192-.605 3.7-3.5 5.42-7.166 5.42H12.05a.89.89 0 0 0-.878.745l-.935 5.53-.265 1.565a.467.467 0 0 0 .461.541h3.237a.67.67 0 0 0 .661-.563l.027-.141.524-3.088.034-.183a.67.67 0 0 1 .661-.563h.416c2.695 0 4.806-1.027 5.423-3.997.258-1.242.124-2.279-.557-3.008a2.54 2.54 0 0 0-.725-.53z" />
                      </svg>
                      <span className="font-bold">PayPal</span>
                      <span className="text-xs opacity-70">PayPal акаунт</span>
                    </button>
                  </div>

                  {paymentMethod === "stripe" && (
                    <div className="space-y-4">
                      {stripeError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-center">
                          <p className="font-mono text-sm text-red-400">{stripeError}</p>
                        </div>
                      )}
                      <GlitchButton
                        onClick={handleStripeCheckout}
                        disabled={stripeLoading}
                        className={`w-full py-4 text-lg flex items-center justify-center gap-3 ${stripeLoading ? "opacity-70" : ""}`}
                      >
                        {stripeLoading ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            ПЕРЕНАПРАВЛЕННЯ...
                          </>
                        ) : (
                          <>
                            <CreditCard size={20} />
                            ОПЛАТИТИ {total} CAD ЧЕРЕЗ STRIPE
                          </>
                        )}
                      </GlitchButton>
                      <p className="font-mono text-xs text-muted-foreground/60 text-center">
                        Вас буде перенаправлено на безпечну сторінку оплати Stripe
                      </p>
                    </div>
                  )}

                  {paymentMethod === "paypal" && (
                    <div>
                      {sdkError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-center space-y-3">
                          <p className="font-mono text-sm text-red-400">
                            Не вдалося завантажити PayPal.
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            PayPal блокує завантаження в iframe.
                            <br />
                            Відкрийте сайт у новій вкладці або використайте Stripe.
                          </p>
                          <button
                            onClick={() => setPaymentMethod("stripe")}
                            className="px-4 py-2 border border-primary/50 text-primary font-mono text-sm hover:bg-primary/10 transition-colors"
                          >
                            ОПЛАТИТИ ЧЕРЕЗ STRIPE
                          </button>
                        </div>
                      )}

                      {!sdkError && (
                        <div
                          ref={paypalContainerRef}
                          className="min-h-[200px] flex items-center justify-center"
                        >
                          {!sdkReady && (
                            <div className="text-center space-y-3">
                              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                              <p className="font-mono text-sm text-muted-foreground animate-pulse">
                                Завантаження PayPal...
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setStep("form");
                    buttonsRendered.current = false;
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
                  Замовлення оплачено!
                </h3>
                <p className="font-mono text-muted-foreground leading-relaxed">
                  Твій мерч уже кується в Кузні Повалених.
                  <br />
                  Дякуємо, що підтримуєш{" "}
                  <span className="text-primary">Gathering Of The Fallen</span>.
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
                    {email}
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
