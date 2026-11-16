import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  HONEYPOT_FIELD,
  MESSAGE_MAX,
  MESSAGE_MIN,
  hasDisallowedMessageCharacters,
  hasDisallowedNameCharacters,
  normalizeDisplayName,
  normalizeMessage,
} from "../../../shared/guestbook/constants";
import {
  buttonClass,
  hintClass,
  inputClass,
  labelClass,
  noticeClass,
} from "../../components/formStyles";
import { useI18n } from "../../i18n/I18nProvider";
import type { Strings } from "../../i18n/strings";
import { submitGuestbook } from "./api";

type MessageError = "required" | "tooLong" | "invalid";
type NameError = "required" | "tooLong" | "invalid";
type FormError = "validation" | "rateLimited" | "failed";

const messageErrorText = (t: Strings, error: MessageError) =>
  error === "required"
    ? t.guestbookMessageRequired
    : error === "tooLong"
      ? t.guestbookMessageTooLong(MESSAGE_MAX)
      : t.guestbookMessageInvalid;

const formErrorText = (t: Strings, error: FormError) =>
  error === "validation"
    ? t.errorValidation
    : error === "rateLimited"
      ? t.errorRateLimited
      : t.guestbookErrorFailed;

interface WishFormProps {
  onSent: (published: boolean) => void;
  onClose: () => void;
  headingId: string;
}

/** The wish form. It only exists while the dialog is open, so every opening starts empty. */
function WishForm({ onSent, onClose, headingId }: WishFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [trap, setTrap] = useState("");
  const [nameError, setNameError] = useState<NameError | undefined>();
  const [messageError, setMessageError] = useState<MessageError | undefined>();
  const [formError, setFormError] = useState<FormError | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<"published" | "private" | undefined>();

  const submittingRef = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const nameId = useId();
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
      cleanName.length < DISPLAY_NAME_MIN
        ? "required"
        : cleanName.length > DISPLAY_NAME_MAX
          ? "tooLong"
          : hasDisallowedNameCharacters(cleanName)
            ? "invalid"
            : undefined;
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
    if (nameProblem || messageProblem) {
      setFormError(undefined);
      (nameProblem ? nameRef : messageRef).current?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(undefined);
    const result = await submitGuestbook({
      displayName: cleanName,
      anonymous,
      message: cleanMessage,
      homepage: trap,
    });
    submittingRef.current = false;
    setSubmitting(false);

    if (result.ok) {
      setSent(result.data.published ? "published" : "private");
      onSent(result.data.published);
      return;
    }
    if (result.kind === "network" || result.status >= 500)
      setFormError("failed");
    else if (result.code === "RATE_LIMITED") setFormError("rateLimited");
    else setFormError("validation");
  }

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  if (sent) {
    return (
      <div className="grid gap-6 text-center">
        <h2
          id={headingId}
          className="text-[clamp(1.6rem,6vw,2rem)] font-medium tracking-[0.1em] uppercase"
        >
          {t.successTitle}
        </h2>
        <p role="status">
          {sent === "published" ? t.guestbookPublished : t.guestbookPrivate}
        </p>
        <button
          type="button"
          className={`${buttonClass} justify-self-center`}
          onClick={onClose}
        >
          {t.guestbookClose}
        </button>
      </div>
    );
  }

  return (
    <>
      <h2
        id={headingId}
        className="mb-6 text-center text-[clamp(1.6rem,6vw,2rem)] font-medium tracking-[0.1em] uppercase"
      >
        {t.guestbookDialogTitle}
      </h2>
      <form
        className="grid gap-6 text-left"
        noValidate
        onSubmit={(event) => void onSubmit(event)}
      >
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
            required
            aria-describedby={nameError ? nameErrorId : undefined}
            onChange={(event) => {
              setName(event.target.value);
              if (nameError) setNameError(undefined);
            }}
            className={`${inputClass} ${nameError ? "border-burgundy border-2" : "border-slate"}`}
          />
          <p id={nameErrorId} className="text-burgundy mt-2 font-semibold">
            {nameError
              ? nameError === "required"
                ? t.guestbookNameRequired
                : nameError === "tooLong"
                  ? t.nameTooLong(DISPLAY_NAME_MAX)
                  : t.nameInvalid
              : null}
          </p>
        </div>

        <div>
          <label
            htmlFor={anonId}
            className="flex min-h-12 cursor-pointer items-center gap-3"
          >
            <input
              id={anonId}
              type="checkbox"
              checked={anonymous}
              aria-describedby={anonHintId}
              onChange={(event) => setAnonymous(event.target.checked)}
              className="accent-navy size-6"
            />
            <span className="text-[1.05rem]">{t.guestbookAnonymous}</span>
          </label>
          <span
            id={anonHintId}
            className={`${hintClass} ${anonymous ? "" : "hidden"}`}
          >
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
            aria-describedby={
              messageError
                ? `${messageHintId} ${messageErrorId}`
                : messageHintId
            }
            onChange={(event) => {
              setMessage(event.target.value);
              if (messageError) setMessageError(undefined);
            }}
            className={`${inputClass} min-h-32 resize-y ${messageError ? "border-burgundy border-2" : "border-slate"}`}
          />
          <span
            id={messageHintId}
            className={`${hintClass} not-italic lining-nums tabular-nums`}
          >
            {`${message.length}/${MESSAGE_MAX}`}
          </span>
          <p id={messageErrorId} className="text-burgundy mt-2 font-semibold">
            {messageError ? messageErrorText(t, messageError) : null}
          </p>
        </div>

        {/* Spam trap: out of sight, out of the tab order and hidden from assistive technology. */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] size-px overflow-hidden"
        >
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
          <button
            type="submit"
            className={buttonClass}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? t.sending : t.guestbookSend}
          </button>
          <div role="alert" aria-live="assertive">
            {formError && (
              <p className={noticeClass}>{formErrorText(t, formError)}</p>
            )}
          </div>
        </div>
      </form>
    </>
  );
}

interface WishDialogProps {
  open: boolean;
  onClose: () => void;
  onSent: (published: boolean) => void;
}

/** A modal dialog: the browser handles Escape, the focus trap and returning focus to the button that opened it. */
export function WishDialog({ open, onClose, onSent }: WishDialogProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  // Layout effects run before the form's own effects, so the dialog is showing by the time the name field takes focus.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // A click on the backdrop lands on the dialog element itself; Escape and the close button cover the keyboard.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      onClose={onClose}
      className="bg-ivory text-navy border-gold-bright [&_:focus-visible]:outline-navy backdrop:bg-navy-deep/80 m-auto max-h-[calc(100svh-1.5rem)] w-[min(34rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[2px] border p-0"
    >
      {open && (
        <div className="relative px-6 py-8 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="text-navy absolute top-2 right-2 inline-flex size-12 items-center justify-center"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
            <span className="sr-only">{t.guestbookClose}</span>
          </button>
          <WishForm onSent={onSent} onClose={onClose} headingId={headingId} />
        </div>
      )}
    </dialog>
  );
}
