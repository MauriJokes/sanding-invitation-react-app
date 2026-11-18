import aminUrl from "../../assets/words/amin-trimmed.png";
import bismillahUrl from "../../assets/words/bismillah-trimmed.png";
import { useI18n } from "../../i18n/I18nProvider";

/** The prayer replaces the standalone venue section; directions remain in Details. */
export function LocationSection() {
  const { t } = useI18n();

  return (
    <section
      id="prayer"
      aria-labelledby="prayer-heading"
      className="bg-ivory text-navy px-5 py-[4.5rem] text-center sm:px-8 sm:py-24"
    >
      <div className="border-gold/70 before:border-gold/40 relative mx-auto max-w-[42rem] border px-6 py-12 before:pointer-events-none before:absolute before:inset-2 before:border before:content-[''] sm:px-14 sm:py-16">
        <img
          src={bismillahUrl}
          alt={t.prayerOpening}
          width={700}
          height={272}
          className="mx-auto block h-auto w-[clamp(8rem,38vw,12rem)]"
        />
        <div
          aria-hidden="true"
          className="text-gold mx-auto my-7 flex max-w-[12rem] items-center gap-4 before:h-px before:flex-1 before:bg-current after:h-px after:flex-1 after:bg-current"
        >
          <span className="size-2 rotate-45 border border-current" />
        </div>
        <h2
          id="prayer-heading"
          className="text-gold-ink text-[clamp(1.4rem,5.5vw,2rem)] font-medium tracking-[0.1em] text-balance uppercase"
        >
          {t.prayerHeading}
        </h2>
        <div className="mx-auto mt-7 grid max-w-[31rem] gap-5 text-[clamp(1.1rem,3.7vw,1.3rem)] leading-[1.75]">
          <p>{t.prayerBlessing}</p>
          <p>{t.prayerUnion}</p>
          <p>{t.prayerGuidance}</p>
        </div>
        <img
          src={aminUrl}
          alt={t.prayerClosing}
          width={700}
          height={125}
          className="mx-auto mt-9 block h-auto w-[clamp(11rem,52vw,16rem)]"
        />
      </div>
    </section>
  );
}
