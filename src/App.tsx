import { EVENT, VENUE_TIMEZONE } from "../shared/config/event";
import { LanguageToggle } from "./components/LanguageToggle";
import { GuestbookSection } from "./features/guestbook/GuestbookSection";
import { RsvpSection } from "./features/rsvp/RsvpSection";
import { useI18n } from "./i18n/I18nProvider";

/** Minimal shell: landmarks, tokens, fonts, language and the RSVP. The full experience is a later milestone. */
export function App({ invite }: { invite?: string }) {
  const { t, locale } = useI18n();
  const eventDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: VENUE_TIMEZONE,
  }).format(new Date(EVENT.startsAt));

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:bg-ivory focus:px-4 focus:py-2 focus:text-navy"
      >
        {t.skipToContent}
      </a>
      <main id="main">
        <div className="relative grid min-h-svh place-items-center px-6 text-center">
          <LanguageToggle />
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.34em] text-gold-bright">{EVENT.title}</p>
            <h1 className="font-script text-[clamp(4.6rem,22vw,8.5rem)] leading-[1.05] text-ivory">
              Izyan <span className="text-gold-bright">&amp;</span> Adam
            </h1>
            <p className="mt-6 text-base uppercase tracking-[0.2em]">{eventDate}</p>
            <p className="text-base uppercase tracking-[0.14em]">{EVENT.venueName}</p>
          </div>
        </div>
        <RsvpSection invite={invite} />
        <GuestbookSection />
      </main>
    </>
  );
}
