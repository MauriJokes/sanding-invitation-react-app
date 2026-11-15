import { EVENT } from "../../../shared/config/event";
import { useI18n } from "../../i18n/I18nProvider";
import { useNow } from "../../lib/useNow";
import { countdownParts, countdownPhase, pad2 } from "./countdownMath";
import { formatArrivalTime, formatEventDate } from "./time";

const TARGET = Date.parse(EVENT.startsAt);

/** Counts down to the arrival time; on and after the day it says so instead of showing zeros. */
export function Countdown() {
  const { t, lang, locale } = useI18n();
  const now = useNow();
  const phase = countdownPhase(now, TARGET);
  const headingId = "countdown-heading";

  if (phase !== "before") {
    return (
      <section aria-labelledby={headingId} className="text-center">
        <div className="mx-auto w-full max-w-[42rem] px-6 py-[4.5rem]">
          <h2 id={headingId} className="sr-only">
            {t.countdownHeading}
          </h2>
          <p className="font-script text-balance text-[clamp(2.4rem,9vw,3.4rem)] leading-[1.15] text-gold-bright">
            {phase === "today" ? t.countdownToday : t.countdownAfter}
          </p>
        </div>
      </section>
    );
  }

  const parts = countdownParts(now, TARGET);
  const when = `${formatEventDate(locale)}, ${formatArrivalTime(new Date(TARGET), lang)}`;
  const units = [
    { key: "days", value: parts.days, label: t.countdownDays },
    { key: "hours", value: parts.hours, label: t.countdownHours },
    { key: "minutes", value: parts.minutes, label: t.countdownMinutes },
    { key: "seconds", value: parts.seconds, label: t.countdownSeconds },
  ];

  return (
    <section aria-labelledby={headingId} className="text-center">
      <div className="mx-auto w-full max-w-[42rem] px-6 py-[4.5rem]">
        <h2 id={headingId} className="mb-6 mt-2 text-[clamp(1.9rem,6vw,2.6rem)] font-medium uppercase tracking-[0.12em]">
          {t.countdownHeading}
        </h2>
        {/* Not a live region: announcing every second would drown out everything else. */}
        <div role="timer" aria-live="off" aria-label={t.countdownLabel(when)} className="mx-auto mt-6 grid max-w-[30rem] grid-cols-4 gap-[0.4rem]">
          {units.map((u) => (
            <div key={u.key} className="border-t border-gold pt-3">
              <strong className="block text-[clamp(2.6rem,12vw,4rem)] font-medium leading-none tabular-nums lining-nums text-ivory">
                {pad2(u.value)}
              </strong>
              <span className="mt-2 block text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-gold-bright">{u.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
