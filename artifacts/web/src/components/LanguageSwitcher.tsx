import { useT } from "@/i18n/LanguageContext";
import { LANGS, type Lang } from "@/i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useT();
  return (
    <div className="shrink-0 font-mono text-xs">
      <label className="relative flex shrink-0 items-center sm:hidden">
        <span className="sr-only">{t("ui.siteLanguage")}</span>
        <span aria-hidden="true" className="pointer-events-none absolute left-2 z-10 text-sm">
          {LANGS.find((language) => language.code === lang)?.flag}
        </span>
        <select
          value={lang}
          onChange={(event) => setLang(event.target.value as Lang)}
          aria-label={t("ui.siteLanguage")}
          className="h-9 min-w-[4.4rem] appearance-none rounded-xl border border-primary/45 bg-black/75 py-1.5 pl-8 pr-6 text-[10px] font-mono uppercase tracking-[0.12em] text-primary outline-none backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/35"
        >
          {LANGS.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute right-2 text-[9px] text-primary">
          ▾
        </span>
      </label>

      <div className="apoc-card hidden gap-1 bg-black/40 backdrop-blur-sm sm:flex" style={{ borderRadius: "12px" }}>
        {LANGS.map((language) => {
          const active = lang === language.code;
          return (
            <button
              key={language.code}
              type="button"
              onClick={() => setLang(language.code)}
              aria-label={`Switch language to ${language.label}`}
              aria-pressed={active}
              className={`flex items-center gap-1 px-2 py-1.5 transition-colors sm:px-2.5 ${
                active
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <span aria-hidden="true">{language.flag}</span>
              <span>{language.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
