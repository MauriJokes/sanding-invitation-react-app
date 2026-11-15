import { useEffect, useMemo, useRef, useState } from "react";
import { EVENT, VENUE_TIMEZONE } from "../../../shared/config/event";
import { Monogram } from "../../components/Monogram";
import { useI18n } from "../../i18n/I18nProvider";
import { usePageHidden } from "../../lib/usePageHidden";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { useViewportSize } from "../../lib/useViewportSize";
import { Rosette } from "../motif/Rosette";
import { doorRosettes, type DoorSide } from "../motif/rosettes";
import "./cover.css";

/** Time for the plaque to fade and the doors to slide apart (matches cover.css), and the reduced-motion crossfade. */
export const OPEN_MS = 1300;
export const OPEN_REDUCED_MS = 450;

function Door({ side }: { side: DoorSide }) {
  const { width, height } = useViewportSize();
  const rosettes = useMemo(() => doorRosettes(side, width, height), [side, width, height]);
  return (
    <div className={`cover-door cover-door-${side}`}>
      {rosettes.map((r) => (
        <Rosette key={r.key} spec={r} />
      ))}
      <span className="cover-edge" />
    </div>
  );
}

interface CoverProps {
  /** Called when Buka is pressed, so the page behind can start its entrance in step with the doors. */
  onOpening?: () => void;
  /** Called once the gate has finished opening; the parent then unmounts the cover. Must be stable (memoised). */
  onOpened: () => void;
}

/**
 * Gate cover. Pressing Buka fades the plaque, slides the two doors apart, then asks its parent to remove it from the tree
 * so its animations stop and the scroll lock is released. It never holds back information: the page behind it is only inert until it opens.
 */
export function Cover({ onOpening, onOpened }: CoverProps) {
  const { t, locale } = useI18n();
  const reduced = useReducedMotion();
  const hidden = usePageHidden();
  const [opening, setOpening] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("cover-open");
    button.current?.focus({ preventScroll: true });
    return () => document.documentElement.classList.remove("cover-open");
  }, []);

  const open = () => {
    setOpening(true);
    onOpening?.();
  };

  useEffect(() => {
    if (!opening) return;
    const timer = setTimeout(() => {
      onOpened();
    }, reduced ? OPEN_REDUCED_MS : OPEN_MS);
    return () => clearTimeout(timer);
  }, [opening, reduced, onOpened]);

  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: VENUE_TIMEZONE }).format(
    new Date(EVENT.startsAt),
  );

  return (
    <div
      className="cover"
      role="region"
      aria-label={t.coverLabel}
      data-state={opening ? "opening" : "closed"}
      data-paused={hidden ? "true" : undefined}
    >
      <Door side="left" />
      <Door side="right" />
      <div className="cover-plaque">
        <div className="cover-card">
          <Monogram className="text-[2.6rem]" />
          <p className="cover-title">{EVENT.title}</p>
          <p className="cover-names font-script">
            <span className="cover-name-first">
              <span>Izyan</span> <span className="cover-amp">&amp;</span>
            </span>
            <span className="cover-name-second">Adam</span>
          </p>
          <p className="cover-date">{date}</p>
          <button ref={button} type="button" className="cover-button" disabled={opening} onClick={open}>
            {t.coverOpen}
          </button>
        </div>
      </div>
    </div>
  );
}
