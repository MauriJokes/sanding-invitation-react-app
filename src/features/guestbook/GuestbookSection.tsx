import { useId, useRef, useState, type FormEvent } from "react";
import {
  DISPLAY_NAME_MAX,
  HONEYPOT_FIELD,
  MESSAGE_MAX,
  MESSAGE_MIN,
  hasDisallowedMessageCharacters,
  hasDisallowedNameCharacters,
  normalizeDisplayName,
  normalizeMessage,
} from "../../../shared/guestbook/constants";
import { buttonClass, headingClass, hintClass, inputClass, labelClass, noticeClass } from "../../components/formStyles";
import { useI18n } from "../../i18n/I18nProvider";
import type { Strings } from "../../i18n/strings";
import { submitGuestbook } from "./api";
import { useGuestbookList } from "./useGuestbookList";

type MessageError = "required" | "tooLong" | "invalid";
type NameError = "tooLong" | "invalid";
type FormError = "validation" | "rateLimited" | "failed";

const messageErrorText = (t: Strings, error: MessageError) =>
  error === "required" ? t.guestbookMessageRequired : error === "tooLong" ? t.guestbookMessageTooLong(MESSAGE_MAX) : t.guestbookMessageInvalid;

const formErrorText = (t: Strings, error: FormError) =>
  error === "validation" ? t.errorValidation : error === "rateLimited" ? t.errorRateLimited : t.guestbookErrorFailed;

/**
 * Wishes for the couple. A wish with a name is shown to everyone straight away; one without a name, or sent
 * anonymously, is saved for the couple only. Everything guests write is rendered as plain text.
 */
export function GuestbookSection() {
  const { t } = useI18n();
  const { state: list, reload, loadMore } = useGuestbookList();

  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [trap, setTrap] = useState("");
  const [nameError, setNameError] = useState<NameError | undefined>();
  const [messageError, setMessageError] = useState<MessageError | undefined>();
  const [formError, setFormError] = useState<FormError | undefined>();
  const [notice, setNotice] = useState<"published" | "private" | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const submittingRef = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const headingId = useId();
  const nameId = useId();
  const nameHintId = useId();
  const nameErrorId = useId();
  const messageId = useId();
  const messageHintId = useId();
  const messageErrorId = useId();
  const anonId = useId();
  const anonHintId = useId();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const cleanName = normalizeDisplayName(name);
    const cleanMessage = normalizeMessage(message);
    const nameProblem: NameError | undefined =
      cleanName.length > DISPLAY_NAME_MAX ? "tooLong" : hasDisallowedNameCharacters(cleanName) ? "invalid" : undefined;
    const messageProblem: MessageError | undefined =
      cleanMessage.length < MESSAGE_MIN
        ? "required"
        : cleanMessage.length > MESSAGE_MAX
          ? "tooLong"
          : hasDisallowedMessageCharacters(cleanMessage)
            ? "invalid"
            : undefined;
    setNameError(nameProblem);
    setMessageError(messageProblem);
    setNotice(undefined);
    if (nameProblem || messageProblem) {
      setFormError(undefined);
      (nameProblem ? nameRef : messageRef).current?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(undefined);
    const result = await submitGuestbook({
      displayName: cleanName || undefined,
      anonymous,
      message: cleanMessage,
      homepage: trap,
    });
    submittingRef.current = false;
    setSubmitting(false);

    if (result.ok) {
      setMessage("");
      setNotice(result.data.published ? "published" : "private");
      if (result.data.published) reload({ silent: true });
      return;
    }
    if (result.kind === "network" || result.status >= 500) setFormError("failed");
    else if (result.code === "RATE_LIMITED") setFormError("rateLimited");
    else setFormError("validation");
  }

  return (
    <section aria-labelledby={headingId} className="border-t border-gold bg-ivory text-navy [&_:focus-visible]:outline-navy">
      <div className="mx-auto max-w-[42rem] px-6 py-[4.5rem] text-center">
        <h2 id={headingId} className={`${headingClass} mb-8`}>
          {t.guestbookHeading}
        </h2>

        <form className="grid gap-6 text-left" noValidate onSubmit={(event) => void onSubmit(event)}>
          <div>
            <label htmlFor={nameId} className={labelClass}>
              {t.guestbookNameLabel}
            </label>
            <input
              ref={nameRef}
              id={nameId}
              type="text"
              value={name}
              maxLength={DISPLAY_NAME_MAX * 2}
              autoComplete="off"
              autoCapitalize="words"
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? `${nameHintId} ${nameErrorId}` : nameHintId}
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) setNameError(undefined);
              }}
              className={`${inputClass} ${nameError ? "border-2 border-burgundy" : "border-slate"}`}
            />
            <span id={nameHintId} className={hintClass}>
              {t.guestbookNameHint}
            </span>
            <p id={nameErrorId} className="mt-2 font-semibold text-burgundy">
              {nameError ? (nameError === "tooLong" ? t.nameTooLong(DISPLAY_NAME_MAX) : t.nameInvalid) : null}
            </p>
          </div>

          <div>
            <label htmlFor={anonId} className="flex min-h-12 cursor-pointer items-center gap-3">
              <input
                id={anonId}
                type="checkbox"
                checked={anonymous}
                aria-describedby={anonHintId}
                onChange={(event) => setAnonymous(event.target.checked)}
                className="size-6 accent-navy"
              />
              <span className="text-[1.05rem]">{t.guestbookAnonymous}</span>
            </label>
            <span id={anonHintId} className={hintClass}>
              {t.guestbookAnonymousHint}
            </span>
          </div>

          <div>
            <label htmlFor={messageId} className={labelClass}>
              {t.guestbookMessageLabel}
            </label>
            <textarea
              ref={messageRef}
              id={messageId}
              value={message}
              maxLength={MESSAGE_MAX}
              rows={5}
              aria-invalid={messageError ? true : undefined}
              aria-describedby={messageError ? `${messageHintId} ${messageErrorId}` : messageHintId}
              onChange={(event) => {
                setMessage(event.target.value);
                if (messageError) setMessageError(undefined);
              }}
              className={`${inputClass} min-h-32 resize-y ${messageError ? "border-2 border-burgundy" : "border-slate"}`}
            />
            <span id={messageHintId} className={`${hintClass} not-italic lining-nums tabular-nums`}>
              {`${message.length}/${MESSAGE_MAX}`}
            </span>
            <p id={messageErrorId} className="mt-2 font-semibold text-burgundy">
              {messageError ? messageErrorText(t, messageError) : null}
            </p>
          </div>

          {/* Spam trap: out of sight, out of the tab order and hidden from assistive technology. */}
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label>
              <span>Leave this field empty</span>
              <input
                type="text"
                name={HONEYPOT_FIELD}
                tabIndex={-1}
                autoComplete="off"
                value={trap}
                onChange={(event) => setTrap(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4">
            <button type="submit" className={buttonClass} disabled={submitting} aria-busy={submitting}>
              {submitting ? t.sending : t.guestbookSend}
            </button>
            <div role="alert" aria-live="assertive">
              {formError && <p className={noticeClass}>{formErrorText(t, formError)}</p>}
            </div>
            <div role="status">{notice && <p className={noticeClass}>{notice === "published" ? t.guestbookPublished : t.guestbookPrivate}</p>}</div>
          </div>
        </form>

        <div className="mt-12 text-left">
          {list.status === "loading" ? (
            <p role="status" className="text-center">
              {t.guestbookLoading}
            </p>
          ) : list.status === "error" ? (
            <div className="grid justify-items-center gap-4">
              <p className={noticeClass} role="alert">
                {t.guestbookLoadFailed}
              </p>
              <button type="button" className={buttonClass} onClick={() => reload()}>
                {t.retry}
              </button>
            </div>
          ) : list.entries.length === 0 ? (
            <p className="text-center italic text-slate">{t.guestbookEmpty}</p>
          ) : (
            <>
              <ul aria-label={t.guestbookListLabel} className="grid">
                {list.entries.map((entry, index) => (
                  <li key={`${entry.createdAt}-${index}`} className="border-t border-gold py-4">
                    <p className="whitespace-pre-wrap break-words text-[1.2rem]">{entry.message}</p>
                    <cite className="mt-1 block break-words text-[0.8rem] font-semibold not-italic uppercase tracking-[0.12em] text-gold-ink">
                      {entry.displayName}
                    </cite>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid justify-items-center gap-3">
                {list.moreFailed && (
                  <p className={noticeClass} role="alert">
                    {t.guestbookLoadFailed}
                  </p>
                )}
                {list.nextCursor && (
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={list.loadingMore}
                    aria-busy={list.loadingMore}
                    onClick={() => void loadMore(list.nextCursor ?? "")}
                  >
                    {list.loadingMore ? t.guestbookLoading : t.guestbookLoadMore}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
