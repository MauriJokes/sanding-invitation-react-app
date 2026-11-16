import { EVENT } from "../../../shared/config/event";
import { useI18n } from "../../i18n/I18nProvider";
import { useCopy } from "../details/useCopy";

const addressParts = EVENT.venueAddress.split(/(?<=,) /).map((part, i, all) => (i < all.length - 1 ? `${part} ` : part));

const actionClass =
  "inline-flex min-h-12 min-w-[14rem] items-center justify-center rounded-[2px] border border-gold-bright px-8 text-[0.95rem] font-semibold uppercase tracking-[0.22em] text-ivory no-underline hover:bg-gold-bright hover:text-navy-deep";

/** Venue, address and directions. The address is plain text and can be copied; the map opens in the guest's own maps app. */
export function LocationSection() {
  const { t } = useI18n();
  const { state, copy } = useCopy(`${EVENT.venueName}, ${EVENT.venueAddress}`);
  const message = state === "copied" ? t.locationCopied : state === "failed" ? t.locationCopyFailed : "";

  return (
    <section id="location" aria-labelledby="location-heading" className="text-center">
      <div className="mx-auto w-full max-w-[42rem] px-6 py-[4.5rem]">
        <h2 id="location-heading" className="mb-6 mt-2 text-[clamp(1.9rem,6vw,2.6rem)] font-medium uppercase tracking-[0.12em]">
          {t.locationHeading}
        </h2>
        <p className="text-[1.5rem] font-semibold">{EVENT.venueName}</p>
        <p>{EVENT.venueRoom}</p>
        {/* Each part stays on one line, so the address only ever wraps at a comma. */}
        <address className="mx-auto mt-3 max-w-[28rem] not-italic">
          {addressParts.map((part) => (
            <span key={part} className="inline-block whitespace-pre-wrap">
              {part}
            </span>
          ))}
        </address>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={EVENT.directionsUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>
            <span>{t.locationMapOpen}</span>
            <span className="sr-only">{t.locationNewTab}</span>
          </a>
          <button type="button" onClick={copy} className={`${actionClass} bg-transparent`}>
            {t.locationCopy}
          </button>
        </div>
        <p role="status" className="mt-3 min-h-[1.6rem] italic">
          {message}
        </p>
      </div>
    </section>
  );
}
