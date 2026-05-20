import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CURRENCIES,
  currencyForCountry,
  formatPrice as fmt,
  priceOf,
  type Currency,
  type ProductType,
} from "@/lib/pricing";

interface CurrencyContextValue {
  currency: Currency;
  countryCode: string;
  setCountry: (countryCode: string) => void;
  isDetecting: boolean;
  priceFor: (type: ProductType) => number;
  format: (amount: number) => string;
  formatIn: (amount: number, currency: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "gtf.country";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountryCodeRaw] = useState<string>(() => {
    if (typeof window === "undefined") return "CA";
    return localStorage.getItem(STORAGE_KEY) || "CA";
  });
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) return;

    let cancelled = false;
    setIsDetecting(true);
    fetch("https://ipapi.co/json/", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { country_code?: string } | null) => {
        if (cancelled || !data?.country_code) return;
        const code = data.country_code.toUpperCase();
        setCountryCodeRaw(code);
        try {
          localStorage.setItem(STORAGE_KEY, code);
        } catch {
          /* ignore quota */
        }
      })
      .catch(() => {
        /* keep default CAD */
      })
      .finally(() => {
        if (!cancelled) setIsDetecting(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCountry = useCallback((code: string) => {
    const up = code.toUpperCase();
    setCountryCodeRaw(up);
    try {
      localStorage.setItem(STORAGE_KEY, up);
    } catch {
      /* ignore */
    }
  }, []);

  const currency = useMemo<Currency>(() => currencyForCountry(countryCode), [countryCode]);

  const value: CurrencyContextValue = useMemo(
    () => ({
      currency,
      countryCode,
      setCountry,
      isDetecting,
      priceFor: (type) => priceOf(type, currency),
      format: (amount) => fmt(amount, currency),
      formatIn: (amount, c) => fmt(amount, c),
    }),
    [currency, countryCode, setCountry, isDetecting],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}

export { CURRENCIES };
