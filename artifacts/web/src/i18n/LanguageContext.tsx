import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TRANSLATIONS, lookup, type Lang } from "./translations";

const STORAGE_KEY = "gotf-lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string) => string;
  tArr: <T = unknown>(path: string) => T[];
  tObj: <T = unknown>(path: string) => T;
};

const LanguageContext = createContext<Ctx | null>(null);

function readInitial(): Lang {
  if (typeof window === "undefined") return "ua";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "ua" || saved === "en" || saved === "fr") return saved;
  return "ua";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<Ctx>(() => {
    const dict = TRANSLATIONS[lang];
    const fallback = TRANSLATIONS.ua;
    const get = (path: string): unknown => {
      const v = lookup(dict, path);
      return v === undefined ? lookup(fallback, path) : v;
    };
    return {
      lang,
      setLang,
      t: (path: string) => {
        const v = get(path);
        return typeof v === "string" ? v : path;
      },
      tArr: <T,>(path: string): T[] => {
        const v = get(path);
        return Array.isArray(v) ? (v as T[]) : [];
      },
      tObj: <T,>(path: string): T => {
        const v = get(path);
        return (v ?? {}) as T;
      },
    };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
}
