import { useCallback, useEffect, useRef, useState } from "react";
import { Countdown } from "./features/details/Countdown";
import { DetailsSection } from "./features/details/DetailsSection";
import { formatEventDate } from "./features/details/time";
import { Cover } from "./features/cover/Cover";
import { LocationSection } from "./features/location/LocationSection";
import { GuestbookSection } from "./features/guestbook/GuestbookSection";
import { useMusicPlayer } from "./features/music/useMusicPlayer";
import { RsvpSection } from "./features/rsvp/RsvpSection";
import { Hero } from "./features/shell/Hero";
import { Navigation } from "./features/shell/Navigation";
import { Particles } from "./features/shell/Particles";
import { ShellDefs } from "./features/shell/ShellDefs";
import { TileDivider } from "./features/shell/TileDivider";
import { useI18n } from "./i18n/I18nProvider";
import { usePageHidden } from "./lib/usePageHidden";

/** Sections on the page; the bar links to these only. */
const SECTIONS = ["details", "rsvp", "prayer", "guestbook"] as const;

export function App({ invite }: { invite?: string }) {
  const { t, locale } = useI18n();
  const [intro, setIntro] = useState(false);
  const [opened, setOpened] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const player = useMusicPlayer();
  const hidden = usePageHidden();
  // Buka is the guest's gesture: it starts the hero entrance and the music (the music button stops it).
  const { play } = player;
  const handleOpening = useCallback(() => {
    setIntro(true);
    play();
  }, [play]);
  const handleOpened = useCallback(() => setOpened(true), []);

  // Focus only after the page is no longer inert; an inert element cannot take focus.
  useEffect(() => {
    if (opened) heading.current?.focus({ preventScroll: true });
  }, [opened]);

  // One switch pauses every decorative animation while the tab is in the background.
  useEffect(() => {
    document.documentElement.classList.toggle("page-hidden", hidden);
  }, [hidden]);

  return (
    <>
      {!opened && <Cover onOpening={handleOpening} onOpened={handleOpened} />}
      {opened && <Particles />}
      <div inert={!opened} className="relative z-[1] pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0">
        <ShellDefs />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:bg-ivory focus:px-4 focus:py-2 focus:text-navy"
        >
          {t.skipToContent}
        </a>
        <Navigation sectionIds={SECTIONS} player={player} />
        <main id="main">
          <Hero intro={intro} headingRef={heading} date={formatEventDate(locale)} />
          <TileDivider />
          <DetailsSection />
          <TileDivider />
          <Countdown />
          <TileDivider />
          <RsvpSection invite={invite} />
          <TileDivider />
          <LocationSection />
          <TileDivider />
          <GuestbookSection />
        </main>
      </div>
    </>
  );
}
