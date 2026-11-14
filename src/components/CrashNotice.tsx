import { useI18n } from "../i18n/I18nProvider";

export function CrashNotice({ onReload = () => window.location.reload() }: { onReload?: () => void }) {
  const { t } = useI18n();
  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div role="alert">
        <h1 className="text-[clamp(1.9rem,6vw,2.6rem)] font-medium uppercase tracking-[0.12em]">{t.crashTitle}</h1>
        <p className="mt-4">{t.crashBody}</p>
        <button
          type="button"
          onClick={onReload}
          className="mt-8 min-h-12 border border-gold-bright px-8 text-[0.95rem] font-semibold uppercase tracking-[0.22em] text-ivory hover:bg-gold-bright hover:text-navy-deep"
        >
          {t.crashReload}
        </button>
      </div>
    </main>
  );
}
