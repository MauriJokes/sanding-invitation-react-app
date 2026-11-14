import { useI18n } from "../i18n/I18nProvider";

/** Temporary placement; moves into the navigation in the experience milestone. */
export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  const target = lang === "ms" ? "en" : "ms";
  return (
    <button
      type="button"
      lang={target}
      aria-label={t.switchLanguageLabel}
      onClick={() => setLang(target)}
      className="absolute right-3 top-3 z-10 grid min-h-12 min-w-12 place-items-center border border-gold px-3 text-[0.9rem] font-semibold tracking-[0.12em] text-ivory hover:bg-gold-bright hover:text-navy-deep"
    >
      {t.switchLanguageText}
    </button>
  );
}
