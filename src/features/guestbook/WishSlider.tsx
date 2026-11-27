import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useRef, useState } from "react";
import type { PublicGuestbookEntry } from "../../../shared/guestbook/constants";
import { noticeClass } from "../../components/formStyles";
import { useI18n } from "../../i18n/I18nProvider";
import { usePageHidden } from "../../lib/usePageHidden";
import { useInView } from "../../lib/useInView";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { slideDelay } from "./slideDelay";
import stampUrl from "../../assets/stamp/stamp.png";

/** Fetch the next page when this few wishes are left ahead of the one on screen. */
const PRELOAD_AHEAD = 3;

const controlClass =
  "inline-flex size-12 items-center justify-center rounded-[2px] border border-gold-bright text-gold-bright hover:bg-gold-bright hover:text-navy-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold-bright";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d={direction === "left" ? "M14.5 5 7.5 12l7 7" : "M9.5 5l7 7-7 7"}
      />
    </svg>
  );
}

// function PlayPauseIcon({ playing }: { playing: boolean }) {
//   return (
//     <svg
//       aria-hidden="true"
//       viewBox="0 0 24 24"
//       className="size-4"
//       fill="currentColor"
//     >
//       <path
//         d={playing ? "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" : "M8 5l11 7-11 7z"}
//       />
//     </svg>
//   );
// }

interface WishSliderProps {
  entries: readonly PublicGuestbookEntry[];
  hasMore: boolean;
  loadingMore: boolean;
  moreFailed: boolean;
  onLoadMore: () => void;
  /** Changes whenever the slider should go back to the newest wish. */
  resetSignal: number;
  /** True while something else (the form) has the guest's attention, so auto-play waits. */
  suspended: boolean;
}

/**
 * The wishes as a swipeable slider. Auto-play moves on after a time that fits the message, and stops while the guest
 * hovers, drags, is away, or has paused it. With reduced motion it starts paused and changes slide without sliding.
 */
export function WishSlider({
  entries,
  hasMore,
  loadingMore,
  moreFailed,
  onLoadMore,
  resetSignal,
  suspended,
}: WishSliderProps) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const pageHidden = usePageHidden();
  const regionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(regionRef);
  const [viewportRef, api] = useEmblaCarousel({
    align: "center",
    containScroll: false,
    duration: 32,
  });

  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  // const [playing, setPlaying] = useState(!reduced);
  const [hovered, setHovered] = useState(false);
  const [held, setHeld] = useState(false);

  const total = entries.length;
  const many = total > 1;

  useEffect(() => {
    if (!api) return;
    const sync = () => {
      setSelected(api.selectedScrollSnap());
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    };
    const hold = () => setHeld(true);
    const release = () => setHeld(false);
    sync();
    api
      .on("select", sync)
      .on("reInit", sync)
      .on("pointerDown", hold)
      .on("pointerUp", release);
    return () => {
      api
        .off("select", sync)
        .off("reInit", sync)
        .off("pointerDown", hold)
        .off("pointerUp", release);
    };
  }, [api]);

  // The track is as tall as the wish on screen, so one long wish does not leave a gap under every short one.
  const [height, setHeight] = useState<number | undefined>();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const node = api?.slideNodes()[selected];
    if (!node) return;
    const measure = () => setHeight(node.offsetHeight);
    measure();
    const frame = requestAnimationFrame(() => setSettled(true));
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [api, selected, total]);

  const handledReset = useRef(resetSignal);
  useEffect(() => {
    if (handledReset.current === resetSignal) return;
    handledReset.current = resetSignal;
    api?.scrollTo(0, reduced);
  }, [api, resetSignal, reduced]);

  useEffect(() => {
    if (
      hasMore &&
      !loadingMore &&
      !moreFailed &&
      selected >= total - PRELOAD_AHEAD
    )
      onLoadMore();
  }, [hasMore, loadingMore, moreFailed, selected, total, onLoadMore]);

  const running =
    // playing &&
    many && inView && !pageHidden && !hovered && !held && !suspended;
  useEffect(() => {
    if (!api || !running) return;
    const id = setTimeout(
      () => {
        if (selected < total - 1) api.scrollNext(reduced);
        else if (!hasMore) api.scrollTo(0, reduced);
        // Otherwise the next page is on its way; new entries restart this timer.
      },
      slideDelay(entries[selected]?.message ?? ""),
    );
    return () => clearTimeout(id);
  }, [api, running, selected, total, entries, hasMore, reduced]);

  const position = `${String(selected + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}${hasMore ? "+" : ""}`;

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={t.guestbookListLabel}
      onPointerEnter={(event) =>
        event.pointerType === "mouse" && setHovered(true)
      }
      onPointerLeave={() => setHovered(false)}
    >
      <div ref={viewportRef} className="overflow-hidden py-6">
        <div
          className={`flex touch-pan-y touch-pinch-zoom items-start ${settled ? "transition-[height] duration-500 motion-reduce:transition-none" : ""}`}
          style={{ height }}
          // aria-live={playing ? "off" : "polite"}
        >
          {entries.map((entry, index) => (
            <div
              key={`${entry.createdAt}-${index}`}
              role="group"
              aria-roledescription="slide"
              aria-label={t.guestbookSlideLabel(index + 1, total)}
              className="min-w-0 shrink-0 grow-0 basis-[86%] px-2 md:basis-[34rem] md:px-3"
            >
              <figure
                data-active={index === selected}
                className="bg-ivory text-navy border-gold-bright before:border-gold/60 relative flex min-h-64 flex-col rounded-[2px] border p-6 text-left opacity-50 shadow-[0_22px_40px_-26px_rgba(0,0,0,0.7)] transition duration-500 not-data-[active=true]:scale-[0.94] before:pointer-events-none before:absolute before:inset-1.5 before:border before:content-[''] data-[active=true]:opacity-100 motion-reduce:transition-none sm:min-h-72 sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-gold-ink pt-1 text-[0.85rem] font-semibold tracking-[0.18em] uppercase">
                    {t.guestbookPostcard}
                  </span>
                  <img
                    src={stampUrl}
                    alt=""
                    width={1000}
                    height={1000}
                    className="h-auto w-14 max-w-[25%] sm:w-16"
                  />
                </div>
                <div className="mt-3 grid flex-1 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                  <blockquote className="min-w-0 pr-3 text-[1.1rem] leading-[1.5] break-words whitespace-pre-wrap sm:pr-6 sm:text-[1.25rem]">
                    {entry.message}
                  </blockquote>
                  <figcaption className="border-gold/70 flex min-w-0 flex-col justify-end gap-4 border-l pl-3 sm:pl-6">
                    <div className="border-gold/70 border-b pb-2">
                      <span className="text-gold-ink block text-[0.75rem] font-semibold tracking-[0.1em] uppercase">
                        {t.guestbookTo}
                      </span>
                      <span className="block text-[1rem] leading-tight break-words">
                        Izyan &amp; Adam
                      </span>
                    </div>
                    <div className="border-gold/70 border-b pb-2">
                      <span className="text-gold-ink block text-[0.75rem] font-semibold tracking-[0.1em] uppercase">
                        {t.guestbookFrom}
                      </span>
                      <span className="block text-[1rem] leading-tight break-words">
                        {entry.displayName}
                      </span>
                    </div>
                  </figcaption>
                </div>
              </figure>
            </div>
          ))}
        </div>
      </div>

      {moreFailed && (
        <div className="mt-2 grid justify-items-center gap-3">
          <p className={noticeClass} role="alert">
            {t.guestbookLoadFailed}
          </p>
          <button
            type="button"
            className={`${controlClass} w-auto px-6 text-[0.9rem] tracking-[0.18em] uppercase`}
            onClick={onLoadMore}
          >
            {t.retry}
          </button>
        </div>
      )}

      {many && (
        <div className="mx-auto mt-4 grid max-w-[34rem] grid-cols-[3rem_1fr_3rem] items-center gap-4 px-4">
          <button
            type="button"
            className={controlClass}
            disabled={!canPrev}
            onClick={() => api?.scrollPrev(reduced)}
          >
            <Chevron direction="left" />
            <span className="sr-only">{t.guestbookPrev}</span>
          </button>
          <div className="grid justify-items-center gap-3">
            <div
              aria-hidden="true"
              className="bg-gold/30 h-px w-full max-w-[14rem]"
            >
              <div
                className="bg-gold-bright h-full origin-left transition-transform duration-50 motion-reduce:transition-none"
                style={{ transform: `scaleX(${(selected + 1) / total})` }}
              />
            </div>
            <div className="flex items-center gap-4">
              <p className="text-[0.85rem] font-semibold tracking-[0.2em] lining-nums tabular-nums">
                {position}
              </p>
              {/* <button
                type="button"
                onClick={() => setPlaying((value) => !value)}
                className="text-gold-bright hover:text-ivory inline-flex min-h-12 items-center gap-2 px-1 text-[0.8rem] font-semibold tracking-[0.18em] uppercase"
              >
                <PlayPauseIcon playing={playing} />
                <span>{playing ? t.guestbookPause : t.guestbookPlay}</span>
              </button> */}
            </div>
          </div>
          <button
            type="button"
            className={controlClass}
            disabled={!canNext}
            onClick={() => api?.scrollNext(reduced)}
          >
            <Chevron direction="right" />
            <span className="sr-only">{t.guestbookNext}</span>
          </button>
        </div>
      )}
    </div>
  );
}
