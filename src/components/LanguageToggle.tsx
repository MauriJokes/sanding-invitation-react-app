import { useI18n } from "../i18n/I18nProvider";

/** BM/EN switch that sits in the navigation bar. Shows the language it will switch to. */
export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  const target = lang === "ms" ? "en" : "ms";
  return (
    <button
      type="button"
      lang={target}
      aria-label={t.switchLanguageLabel}
      onClick={() => setLang(target)}
      className="grid min-h-12 min-w-12 place-items-center px-2 text-[0.78rem] font-semibold tracking-[0.1em] hover:text-gold-bright"
    >
      {t.switchLanguageText}
    </button>
  );
}
