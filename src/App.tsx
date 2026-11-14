import { EVENT, VENUE_TIMEZONE } from "../shared/config/event";

const eventDate = new Intl.DateTimeFormat("ms", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: VENUE_TIMEZONE,
}).format(new Date(EVENT.startsAt));

/** Minimal shell: landmarks, tokens and fonts. The invitation experience is built in a later milestone. */
export function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-ivory focus:px-4 focus:py-2 focus:text-navy"
      >
        Langkau ke kandungan
      </a>
      <main id="main" className="grid min-h-svh place-items-center px-6 text-center">
        <div>
          <p className="text-base font-semibold uppercase tracking-[0.34em] text-gold-bright">
            {EVENT.title}
          </p>
          <h1 className="font-script text-[clamp(4.6rem,22vw,8.5rem)] leading-[1.05] text-ivory">
            Izyan <span className="text-gold-bright">&amp;</span> Adam
          </h1>
          <p className="mt-6 text-base uppercase tracking-[0.2em]">{eventDate}</p>
          <p className="text-base uppercase tracking-[0.14em]">{EVENT.venueName}</p>
        </div>
      </main>
    </>
  );
}
