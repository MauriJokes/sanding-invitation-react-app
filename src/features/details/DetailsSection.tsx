import { EVENT } from "../../../shared/config/event";
import { useI18n } from "../../i18n/I18nProvider";
import { COUPLE, HOST_GROUPS, HOST_TITLE } from "./content";
import { formatArrivalTime, formatEventDate } from "./time";

const eyebrow = "text-[0.85rem] font-semibold uppercase tracking-[0.24em] text-gold-ink";
const body = "text-[1.3rem] leading-[1.55]";

function Rule() {
  return (
    <div aria-hidden="true" className="mx-auto my-[1.4rem] flex max-w-[18rem] items-center justify-center gap-[0.9rem] text-gold before:h-px before:flex-1 before:bg-current after:h-px after:flex-1 after:bg-current">
      <i className="block size-[9px] rotate-45 border border-current" />
    </div>
  );
}

function Ampersand() {
  return <p className="font-script text-[2.6rem] leading-none text-gold-ink">&amp;</p>;
}

/** The invitation text, the couple, the event facts and the dress code, from the owner-supplied copy. */
export function DetailsSection() {
  const { t, lang, locale } = useI18n();
  const arrival = formatArrivalTime(new Date(EVENT.startsAt), lang);
  const [bride, groom] = [HOST_GROUPS.slice(0, 2), HOST_GROUPS.slice(2)];

  const family = (groups: typeof bride) =>
    groups.map((group, i) => (
      <div key={i} className="grid gap-3 leading-[1.3]">
        {group.map((person) => (
          <p key={person.name}>
            <span className="block text-[0.85rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">{HOST_TITLE}</span>
            <span className="block font-semibold">{person.name}</span>
            <span className="block">{person.lineage}</span>
          </p>
        ))}
      </div>
    ));

  return (
    <section id="details" aria-labelledby="details-heading" className="bg-ivory text-navy [&_:focus-visible]:outline-navy">
      <div className="mx-auto w-full max-w-[42rem] px-6 py-[4.5rem] text-center">
        <h2 id="details-heading" className="sr-only">
          {t.navDetails}
        </h2>
        <p className="text-[0.9rem] font-semibold uppercase tracking-[0.28em] text-gold-ink">{t.detailsGreeting}</p>
        <p className={`mt-5 ${body}`}>Bismillah</p>
        <Rule />
        <p className={body}>{t.detailsIntro}</p>

        <div className="my-7 grid gap-6">
          {family(bride)}
          <Ampersand />
          {family(groom)}
        </div>

        <p className={`my-8 text-balance ${body}`}>{t.detailsInvite}</p>

        <div className="mt-5 grid gap-2">
          <p className="text-[1.15rem] font-semibold uppercase leading-[1.4] tracking-[0.06em]">{COUPLE[0]}</p>
          <Ampersand />
          <p className="text-[1.15rem] font-semibold uppercase leading-[1.4] tracking-[0.06em]">{COUPLE[1]}</p>
        </div>

        <Rule />

        <dl className="mt-9 grid gap-5">
          <div>
            <dt className={eyebrow}>{t.factDate}</dt>
            <dd className={`mt-1 ${body} lining-nums`}>{formatEventDate(locale)}</dd>
          </div>
          <div>
            <dt className={eyebrow}>{t.factTime}</dt>
            <dd className={`mt-1 ${body} lining-nums`}>{arrival}</dd>
          </div>
          <div>
            <dt className={eyebrow}>{t.factVenue}</dt>
            <dd className={`mt-1 ${body}`}>
              <span className="block">{EVENT.venueName}</span>
              <span className="block">{EVENT.venueRoom}</span>
            </dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-gold pt-5">
          <h3 className="text-[0.9rem] font-semibold uppercase tracking-[0.28em] text-gold-ink">{t.dressHeading}</h3>
          <ul className="m-0 mt-3 grid list-none gap-3 p-0">
            {[
              { text: t.dressBurgundy, swatch: "bg-burgundy" },
              { text: t.dressNavy, swatch: "bg-navy" },
            ].map((d) => (
              <li key={d.swatch} className="text-balance">
                <span aria-hidden="true" className={`mr-3 inline-block size-[14px] rounded-full border border-current align-middle ${d.swatch}`} />
                <span>{d.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
