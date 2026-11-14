import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LOCALES, strings, type Lang, type Strings } from "./strings";

interface I18n {
  lang: Lang;
  locale: string;
  t: Strings;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18n | null>(null);

/** Malay is the default language (owner decision); the toggle only changes it for this visit. */
export function I18nProvider({ children, initialLang = "ms" }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18n>(() => ({ lang, locale: LOCALES[lang], t: strings[lang], setLang }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
