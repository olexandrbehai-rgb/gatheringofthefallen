import { useT } from "@/i18n/LanguageContext";
import { LANGS, type Lang } from "@/i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang } = useT();
  return (
    <div className="sleepy apoc-card flex gap-1 bg-black/40 backdrop-blur-sm font-mono text-xs" style={{ borderRadius: "12px" }}>
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            onClick={() => setLang(l.code as Lang)}
            aria-label={`Switch language to ${l.label}`}
            aria-pressed={active}
            className={`px-2.5 py-1.5 transition-colors flex items-center gap-1 ${
              active
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            }`}
          >
            <span aria-hidden="true">{l.flag}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
