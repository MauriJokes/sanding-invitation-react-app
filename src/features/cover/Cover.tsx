import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import flower from "../../../design-assets/textures/navy-flower-gold-leaves.png";
import fern from "../../../design-assets/textures/slender-leaf-branch.png";
import branch from "../../../design-assets/textures/round-leaf-branch.png";
import { EVENT, VENUE_TIMEZONE } from "../../../shared/config/event";
import { Monogram } from "../../components/Monogram";
import { useI18n } from "../../i18n/I18nProvider";
import { usePageHidden } from "../../lib/usePageHidden";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { useViewportSize } from "../../lib/useViewportSize";
import { Rosette } from "../motif/Rosette";
import {
  bandRosettes,
  ROSETTE_PX,
  TILE_PX,
  type Rosette as RosetteSpec,
} from "../motif/rosettes";
import "./cover.css";

/** Time for the plaque to fade and the doors to slide apart (matches cover.css), and the reduced-motion crossfade. */
export const OPEN_MS = 1300;
export const OPEN_REDUCED_MS = 450;

type Stem = {
  image: string;
  width: number;
  x: number;
  y: number;
  rotation: number;
  flip?: boolean;
  centeredRoot?: boolean;
};

const stems: Stem[] = [
  { image: fern, width: 45, x: 29, y: 25, rotation: 22 },
  { image: fern, width: 29, x: 26, y: 26, rotation: 18, flip: true },
  { image: branch, width: 23, x: 24, y: 30, rotation: -14, centeredRoot: true },
  { image: fern, width: 32, x: 24, y: 43, rotation: 25, flip: true },
  { image: branch, width: 25, x: 23, y: 51, rotation: -28, centeredRoot: true },
  { image: fern, width: 29, x: 24, y: 66, rotation: 25, flip: true },
  { image: fern, width: 29, x: 75, y: 27, rotation: -40 },
  { image: fern, width: 28, x: 76, y: 55, rotation: -25 },
  { image: branch, width: 22, x: 77, y: 59, rotation: 28, centeredRoot: true },
  { image: fern, width: 29, x: 76, y: 71, rotation: -25 },
  { image: fern, width: 45, x: 70, y: 72, rotation: 180 },
  { image: fern, width: 29, x: 35, y: 75, rotation: 270, flip: true },
  { image: fern, width: 29, x: 75, y: 74, rotation: 145 },
  { image: fern, width: 32, x: 76, y: 73, rotation: 190, flip: true },
  { image: branch, width: 24, x: 75, y: 72, rotation: 135, centeredRoot: true },
  { image: branch, width: 23, x: 76, y: 72, rotation: 155, centeredRoot: true },
];

function Door({
  side,
  rosettes,
}: Readonly<{ side: "left" | "right"; rosettes: readonly RosetteSpec[] }>) {
  return (
    <div className={`cover-door cover-door-${side}`} aria-hidden="true">
      <div className="cover-door-background">
        {rosettes.map((rosette) => (
          <Rosette key={rosette.key} spec={rosette} />
        ))}
        <div className="cover-diamond" />
      </div>
      <span className="cover-edge" />
    </div>
  );
}

function BotanicalArtwork() {
  return (
    <>
      {stems.map((stem, index) => {
        const style = {
          "--w": `${stem.width}%`,
          "--x": `${stem.x}%`,
          "--y": `${stem.y}%`,
          "--r": `${stem.rotation}deg`,
          "--flip": stem.flip ? -1 : 1,
          "--root-x": stem.centeredRoot ? "-50%" : "-8%",
        } as CSSProperties;
        return (
          <div className="cover-stem" style={style} key={index}>
            <img src={stem.image} alt="" />
          </div>
        );
      })}
    </>
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
  const { width, height } = useViewportSize();
  const rosettes = useMemo(
    () => bandRosettes(width, Math.ceil(Math.max(height, 540) / TILE_PX) + 1),
    [width, height],
  );
  const leftRosettes = useMemo(
    () => rosettes.filter((rosette) => rosette.x < width / 2),
    [rosettes, width],
  );
  const rightRosettes = useMemo(
    () => rosettes.filter((rosette) => rosette.x + ROSETTE_PX > width / 2),
    [rosettes, width],
  );
  const [opening, setOpening] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("cover-open");
    button.current?.focus();
    return () => document.documentElement.classList.remove("cover-open");
  }, []);

  const open = () => {
    setOpening(true);
    onOpening?.();
  };

  useEffect(() => {
    if (!opening) return;
    const timer = setTimeout(
      () => {
        onOpened();
      },
      reduced ? OPEN_REDUCED_MS : OPEN_MS,
    );
    return () => clearTimeout(timer);
  }, [opening, reduced, onOpened]);

  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: VENUE_TIMEZONE,
  }).format(new Date(EVENT.startsAt));

  return (
    <div
      className="cover"
      role="region"
      aria-label={t.coverLabel}
      data-state={opening ? "opening" : "closed"}
      data-paused={hidden ? "true" : undefined}
    >
      <div className="cover-stage">
        <Door side="left" rosettes={leftRosettes} />
        <Door side="right" rosettes={rightRosettes} />
        <div className="cover-scene">
          <div aria-hidden="true">
            <BotanicalArtwork />
          </div>
          <div className="cover-card">
            <Monogram className="cover-monogram" />
            <p className="cover-title">{EVENT.title}</p>
            <p className="cover-names font-script">
              <span className="cover-name-first">
                <span>Izyan</span> <span>&amp;</span>
              </span>
              <span className="cover-name-second">Adam</span>
            </p>
            <p className="cover-date">{date}</p>
            <button
              ref={button}
              type="button"
              className="cover-button"
              disabled={opening}
              onClick={open}
            >
              {t.coverOpen}
            </button>
          </div>
          <img className="cover-flower cover-flower-top" src={flower} alt="" />
          <img
            className="cover-flower cover-flower-bottom"
            src={flower}
            alt=""
          />
        </div>
      </div>
    </div>
  );
}
