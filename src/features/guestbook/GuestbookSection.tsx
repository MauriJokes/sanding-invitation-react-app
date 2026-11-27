import { useCallback, useId, useRef, useState } from "react";
import {
  buttonClass,
  headingClass,
  noticeClass,
} from "../../components/formStyles";
import { useI18n } from "../../i18n/I18nProvider";
import { WishDialog } from "./WishDialog";
import { WishSlider } from "./WishSlider";
import { useGuestbookList } from "./useGuestbookList";

/**
 * Wishes for the couple, shown one at a time in a slider. A wish with a name is shown to everyone straight away; one
 * without a name, or sent anonymously, is saved for the couple only. Everything guests write is rendered as plain text.
 */
export function GuestbookSection() {
  const { t } = useI18n();
  const { state: list, reload, loadMore } = useGuestbookList();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const publishedRef = useRef(false);
  const headingId = useId();

  const nextCursor = list.status === "ready" ? list.nextCursor : null;
  const onLoadMore = useCallback(() => {
    if (nextCursor) void loadMore(nextCursor);
  }, [loadMore, nextCursor]);

  const onSent = useCallback(
    (published: boolean) => {
      if (!published) return;
      publishedRef.current = true;
      reload({ silent: true });
    },
    [reload],
  );

  // A published wish is the newest, so the slider returns to the start once the guest is back on the page.
  const onClose = useCallback(() => {
    setDialogOpen(false);
    if (publishedRef.current) {
      publishedRef.current = false;
      setResetSignal((n) => n + 1);
    }
  }, []);

  return (
    <section
      id="guestbook"
      aria-labelledby={headingId}
      className="border-gold border-t"
    >
      <div className="py-[4.5rem] text-center">
        <div className="mx-auto max-w-[42rem] px-6">
          <h2 id={headingId} className={`${headingClass} mb-4`}>
            {t.guestbookHeading}
          </h2>
          {/* <p className="text-balance">{t.guestbookLead}</p> */}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="border-gold-bright bg-gold-bright text-navy-deep hover:bg-ivory hover:border-ivory mt-6 min-h-12 border px-8 text-[0.95rem] font-semibold tracking-[0.22em] uppercase"
          >
            {t.guestbookOpen}
          </button>
        </div>

        <div className="mt-8">
          {list.status === "loading" ? (
            <p role="status">{t.guestbookLoading}</p>
          ) : list.status === "error" ? (
            <div className="grid justify-items-center gap-4 px-6">
              <p className={noticeClass} role="alert">
                {t.guestbookLoadFailed}
              </p>
              <button
                type="button"
                className={`${buttonClass} bg-transparent`}
                onClick={() => reload()}
              >
                {t.retry}
              </button>
            </div>
          ) : list.entries.length === 0 ? (
            <p className="px-6 italic">{t.guestbookEmpty}</p>
          ) : (
            <WishSlider
              entries={list.entries}
              hasMore={list.nextCursor !== null}
              loadingMore={list.loadingMore}
              moreFailed={list.moreFailed}
              onLoadMore={onLoadMore}
              resetSignal={resetSignal}
              suspended={dialogOpen}
            />
          )}
        </div>
      </div>

      <WishDialog open={dialogOpen} onClose={onClose} onSent={onSent} />
    </section>
  );
}
