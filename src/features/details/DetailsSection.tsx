import { EVENT } from "../../../shared/config/event";
import { useI18n } from "../../i18n/I18nProvider";
import {
  COUPLE,
  HOST_GROUPS,
  HOST_TITLE,
  ITINERARY,
  ITINERARY_EN,
} from "./content";
import { useCopy } from "./useCopy";

const eyebrow =
  "text-[0.85rem] font-semibold uppercase tracking-[0.24em] text-gold-ink";
const body = "text-[1.0rem]";
const coupleName =
  "text-[clamp(1.5rem,6vw,2rem)] font-semibold uppercase leading-[1.3] tracking-[0.06em] text-balance";
const actionClass =
  "inline-flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-[2px] border border-navy-deep px-3 text-center text-[0.8rem] font-semibold uppercase leading-tight tracking-[0.14em] no-underline sm:px-6 sm:text-[0.9rem] sm:tracking-[0.2em]";
const primaryAction = `${actionClass} bg-navy-deep text-gold-bright hover:bg-gold-bright hover:text-navy-deep`;
const secondaryAction = `${actionClass} bg-transparent text-navy hover:bg-navy-deep hover:text-gold-bright`;

const addressParts = EVENT.venueAddress
  .split(/(?<=,) /)
  .map((part, i, all) => (i < all.length - 1 ? `${part} ` : part));

function Rule() {
  return (
    <div
      aria-hidden="true"
      className="text-gold mx-auto my-[1.4rem] flex max-w-[18rem] items-center justify-center gap-[0.9rem] before:h-px before:flex-1 before:bg-current after:h-px after:flex-1 after:bg-current"
    >
      <i className="block size-[9px] rotate-45 border border-current" />
    </div>
  );
}

function Ampersand({ large = false }: { large?: boolean }) {
  return (
    <p
      className={`font-script text-gold-ink leading-none ${large ? "text-[3.4rem]" : "text-[1.8rem]"}`}
    >
      &amp;
    </p>
  );
}

/** The invitation text, the couple and the event facts, from the owner-supplied copy. The couple is the focus; the families are set smaller. */
export function DetailsSection() {
  const { t, lang } = useI18n();
  const [bride, groom] = [HOST_GROUPS.slice(0, 2), HOST_GROUPS.slice(2)];
  const { state, copy } = useCopy(`${EVENT.venueName}, ${EVENT.venueAddress}`);
  const message =
    state === "copied"
      ? t.locationCopied
      : state === "failed"
        ? t.locationCopyFailed
        : "";

  const family = (groups: typeof bride) => (
    <div className="grid gap-4">
      {groups.map((group, i) => (
        <div key={i} className="grid gap-2 leading-[1.3]">
          {group.map((person) => (
            <p key={person.name} className="text-[0.85rem]">
              <span className="text-gold-ink block text-[0.65rem] font-semibold tracking-[0.2em] uppercase">
                {HOST_TITLE}
              </span>
              <span className="block font-semibold">{person.name}</span>
              <span className="block">{person.lineage}</span>
            </p>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <section
      id="details"
      aria-labelledby="details-heading"
      className="bg-ivory text-navy [&_:focus-visible]:outline-navy"
    >
      <div className="mx-auto w-full max-w-[42rem] px-6 py-[4.5rem] text-center md:max-w-[56rem]">
        <h2 id="details-heading" className="sr-only">
          {t.navDetails}
        </h2>
        <p className="text-gold-ink text-[0.9rem] font-semibold tracking-[0.28em] uppercase">
          {t.detailsGreeting}
        </p>
        <p className={`mt-5 ${body}`}>Ya Qadi Al-Hajat</p>
        <Rule />
        <p className={body}>{t.detailsIntro}</p>

        <div className="my-6 grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
          {family(bride)}
          <Ampersand />
          {family(groom)}
        </div>

        <p className={`mx-auto my-8 max-w-[42rem] text-balance ${body}`}>
          {t.detailsInvite}
        </p>

        <div className="mt-6 grid gap-3">
          <p className={coupleName}>{COUPLE[0]}</p>
          <p className={"font-script text-gold-ink text-[1.0rem] leading-none"}>
            {t.detailsAnd}
          </p>
          <p className={coupleName}>{COUPLE[1]}</p>
        </div>

        <Rule />

        <dl className="mt-9 grid gap-8 md:gap-12">
          <div>
            <dt className={eyebrow}>{t.factDate}</dt>
            <dd className={`mt-1 ${body} lining-nums`}>{t.normalDate}</dd>
            <dd className={`mt-1 ${body} lining-nums`}>{t.islamicDate}</dd>
          </div>
          <div>
            <dt className={eyebrow}>{t.factItinerary}</dt>
            <dd className="relative mx-auto max-w-sm md:max-w-md">
              <div className="bg-gold absolute top-0 bottom-0 left-[72px] w-px" />
              <ul className="mt-2 flex flex-col">
                {(lang === "en" ? ITINERARY_EN : ITINERARY).map((entry, i) => (
                  <li key={i} className="flex gap-6">
                    <div className="w-16 flex-shrink-0 pt-[3px] text-right text-[0.75rem] leading-relaxed tracking-wide">
                      {entry.time}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`${body} flex items-start gap-2.5 text-left font-light`}
                      >
                        <span>{entry.item}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className={eyebrow}>{t.factVenue}</dt>
            <dd className={`mt-1 ${body}`}>
              <span className="block">{EVENT.venueName}</span>
              <span className="block">{EVENT.venueRoom}</span>
              {/* Each part stays on one line, so the address only ever wraps at a comma. */}
              <address className="block not-italic">
                {addressParts.map((part) => (
                  <span key={part} className="inline-block whitespace-pre-wrap">
                    {part}
                  </span>
                ))}
              </address>
            </dd>
          </div>
        </dl>

        <div className="mx-auto mt-10 flex max-w-[30rem] gap-3">
          <a
            href={EVENT.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={primaryAction}
          >
            <span>{t.locationMapOpen}</span>
            <span className="sr-only">{t.locationNewTab}</span>
          </a>
          <button type="button" onClick={copy} className={secondaryAction}>
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
