import { EVENT } from "../../../shared/config/event";
import { useI18n } from "../../i18n/I18nProvider";
import { COUPLE, HOST_GROUPS, HOST_TITLE, ITINERARY } from "./content";

const eyebrow =
  "text-[0.85rem] font-semibold uppercase tracking-[0.24em] text-gold-ink";
const body = "text-[1.0rem]";
const coupleName =
  "text-[clamp(1.5rem,6vw,2rem)] font-semibold uppercase leading-[1.3] tracking-[0.06em] text-balance";

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
  const { t } = useI18n();
  const [bride, groom] = [HOST_GROUPS.slice(0, 2), HOST_GROUPS.slice(2)];

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

        <dl className="mt-9 grid gap-8 md:grid-cols-3">
          <div>
            <dt className={eyebrow}>{t.factDate}</dt>
            <dd className={`mt-1 ${body} lining-nums`}>{t.normalDate}</dd>
            <dd className={`mt-1 ${body} lining-nums`}>{t.islamicDate}</dd>
          </div>
          <div>
            <dt className={eyebrow}>{t.factItinerary}</dt>
            <div className="relative mx-auto max-w-sm md:max-w-md">
              <div className="bg-gold absolute top-0 bottom-0 left-[72px] w-px" />
              <ul className="mt-2 flex flex-col">
                {ITINERARY.map((entry, i) => (
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
            </div>
          </div>
          <div>
            <dt className={eyebrow}>{t.factVenue}</dt>
            <dd className={`mt-1 ${body}`}>
              <span className="block">{EVENT.venueName}</span>
              <span className="block">{EVENT.venueRoom}</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
