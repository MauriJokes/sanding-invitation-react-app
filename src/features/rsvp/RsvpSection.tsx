import { useEffect, useId, useRef, useState, type SubmitEvent } from "react";
import { RSVP_DEADLINE, VENUE_TIMEZONE } from "../../../shared/config/event";
import {
  FAMILY_NAME_MAX,
  FAMILY_NAME_MIN,
  PHONE_NUMBER_MAX,
  nameHasDisallowedCharacters,
  phoneNumberHasDisallowedCharacters,
  normalizeFamilyName,
  normalizePhoneNumber,
  type RsvpStatus,
} from "../../../shared/rsvp/constants";
import {
  buttonClass,
  hintClass,
  labelClass,
  noticeClass,
} from "../../components/formStyles";
import { useI18n } from "../../i18n/I18nProvider";
import type { Strings } from "../../i18n/strings";
import { submitRsvp, type RsvpPayload } from "./api";
import { useRsvpConfig } from "./useRsvpConfig";

type PhoneNumberError = "required" | "tooLong" | "invalid";
type NameError = "required" | "tooLong" | "invalid";
type FormError =
  | "duplicate"
  | "duplicateAfterRetry"
  | "limitChanged"
  | "validation"
  | "rateLimited"
  | "failed";

interface Submitted {
  familyGroupName: string;
  phoneNumber: string;
  status: RsvpStatus;
  attendeeCount: number;
}

function validateName(normalized: string): NameError | undefined {
  if (normalized.length < FAMILY_NAME_MIN) return "required";
  if (normalized.length > FAMILY_NAME_MAX) return "tooLong";
  if (nameHasDisallowedCharacters(normalized)) return "invalid";
  return undefined;
}

function validatePhoneNumber(raw: string): PhoneNumberError | undefined {
  const value = raw.trim();
  if (value === "") return "required";
  if (value.length > PHONE_NUMBER_MAX) return "tooLong";
  if (phoneNumberHasDisallowedCharacters(value) || !normalizePhoneNumber(value))
    return "invalid";
  return undefined;
}

const phoneNumberErrorText = (t: Strings, error: PhoneNumberError) =>
  error === "required"
    ? t.phoneRequired
    : error === "tooLong"
      ? t.phoneTooLong(PHONE_NUMBER_MAX)
      : t.phoneInvalid;

const nameErrorText = (t: Strings, error: NameError) =>
  error === "required"
    ? t.nameRequired(FAMILY_NAME_MIN)
    : error === "tooLong"
      ? t.nameTooLong(FAMILY_NAME_MAX)
      : t.nameInvalid;

function formErrorText(t: Strings, error: FormError, max: number): string {
  switch (error) {
    case "duplicate":
      return t.errorDuplicate;
    case "duplicateAfterRetry":
      return t.errorDuplicateAfterRetry;
    case "limitChanged":
      return t.errorLimitChanged(max);
    case "validation":
      return t.errorValidation;
    case "rateLimited":
      return t.errorRateLimited;
    case "failed":
      return t.errorFailed;
  }
}

const stepButtonClass =
  "min-h-14 text-[1.8rem] text-navy hover:bg-navy/5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

/**
 * One public RSVP for the whole family/group, Walimatulurus only. `invite` is the candidate code from the
 * link or from storage; the server decides whether it is valid and therefore which limit applies.
 */
export function RsvpSection({ invite }: { invite?: string }) {
  const { t, locale } = useI18n();
  const { state: config, reload } = useRsvpConfig(invite);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<RsvpStatus>("attending");
  const [count, setCount] = useState(1);
  const [nameError, setNameError] = useState<NameError | undefined>();
  const [phoneNumberError, setPhoneNumberError] = useState<
    PhoneNumberError | undefined
  >();
  const [formError, setFormError] = useState<FormError | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [closedByServer, setClosedByServer] = useState(false);
  const [done, setDone] = useState<Submitted | undefined>();

  const submittingRef = useRef(false);
  /** Payload of an attempt that got no usable answer, so a later "duplicate" can be explained honestly. */
  const unansweredRef = useRef<string | undefined>(undefined);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneNumberRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  const headingId = useId();
  const nameId = useId();
  const nameHintId = useId();
  const nameErrorId = useId();
  const phoneNumberId = useId();
  const phoneNumberHintId = useId();
  const phoneNumberErrorId = useId();
  const countLabelId = useId();

  useEffect(() => {
    if (!done) return;
    // The confirmation is shorter than the form, which would leave the navy hero filling the screen.
    // Bring the section to the top of the view, then move focus without a second scroll.
    sectionRef.current?.scrollIntoView({ block: "start" });
    successRef.current?.focus({ preventScroll: true });
  }, [done]);

  const max = config.status === "ready" ? config.maxAttendees : 0;
  const shownCount = Math.min(Math.max(count, 1), Math.max(max, 1));
  const closed =
    closedByServer || (config.status === "ready" && !config.rsvpOpen);
  const deadlineDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: VENUE_TIMEZONE,
  }).format(new Date(RSVP_DEADLINE));

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || config.status !== "ready") return;

    const normalizedName = normalizeFamilyName(name);
    const invalidName = validateName(normalizedName);
    setNameError(invalidName);
    if (invalidName) {
      setFormError(undefined);
      nameRef.current?.focus();
      return;
    }

    const invalidPhone = validatePhoneNumber(phoneNumber);
    setPhoneNumberError(invalidPhone);
    if (invalidPhone) {
      setFormError(undefined);
      phoneNumberRef.current?.focus();
      return;
    }
    const normalizedPhone = normalizePhoneNumber(phoneNumber)!; // validated above

    const payload: RsvpPayload = {
      familyGroupName: normalizedName,
      phoneNumber: normalizedPhone,
      status,
      attendeeCount: status === "declined" ? 0 : shownCount,
      invite: config.invite,
    };
    const attemptKey = JSON.stringify(payload);

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(undefined);
    const result = await submitRsvp(payload);
    submittingRef.current = false;
    setSubmitting(false);

    if (result.ok) {
      unansweredRef.current = undefined;
      setDone({
        familyGroupName: normalizedName,
        phoneNumber: normalizedPhone,
        status: result.data.status,
        attendeeCount: result.data.attendeeCount,
      });
      return;
    }

    if (result.kind === "network" || result.status >= 500) {
      unansweredRef.current = attemptKey;
      setFormError("failed");
      return;
    }

    switch (result.code) {
      case "RSVP_DUPLICATE":
        setFormError(
          unansweredRef.current === attemptKey
            ? "duplicateAfterRetry"
            : "duplicate",
        );
        break;
      case "RSVP_CLOSED":
        setClosedByServer(true);
        break;
      case "ATTENDEE_LIMIT_EXCEEDED":
        setFormError("limitChanged");
        reload({ silent: true });
        break;
      case "RATE_LIMITED":
        setFormError("rateLimited");
        break;
      case "VALIDATION_ERROR":
        if (result.fields.includes("familyGroupName")) {
          setNameError("invalid");
          nameRef.current?.focus();
        } else if (result.fields.includes("phoneNumber")) {
          setPhoneNumberError("invalid");
          phoneNumberRef.current?.focus();
        } else {
          setFormError("validation");
        }
        break;
      default:
        setFormError("failed");
    }
  }

  function body() {
    if (done) {
      return (
        <div className="mt-6">
          <h2
            ref={successRef}
            tabIndex={-1}
            id={headingId}
            className="text-[clamp(1.9rem,6vw,2.6rem)] font-medium tracking-[0.12em] uppercase"
          >
            {t.successTitle}
          </h2>
          <p className="mt-4">
            {done.status === "attending"
              ? t.successAttending
              : t.successDeclined}
          </p>
          <dl className="border-gold mx-auto mt-6 grid max-w-sm gap-3 border-y py-5 text-left">
            <div>
              <dt className={`${labelClass} text-gold-ink`}>
                {t.summaryFamily}
              </dt>
              <dd>{done.familyGroupName}</dd>
            </div>
            <div>
              <dt className={`${labelClass} text-gold-ink`}>
                {t.summaryPhone}
              </dt>
              <dd>{done.phoneNumber}</dd>
            </div>
            <div>
              <dt className={`${labelClass} text-gold-ink`}>
                {t.summaryAttendance}
              </dt>
              <dd>
                {done.status === "attending"
                  ? t.statusAttending
                  : t.statusDeclined}
              </dd>
            </div>
            {done.status === "attending" && (
              <div>
                <dt className={`${labelClass} text-gold-ink`}>
                  {t.summaryCount}
                </dt>
                <dd className="lining-nums">{done.attendeeCount}</dd>
              </div>
            )}
          </dl>
          <p className="text-slate mt-6 text-base italic">{t.successFinal}</p>
        </div>
      );
    }

    return (
      <>
        <p className="mt-4">{t.rsvpLead}</p>
        {closed ? (
          <div className={`${noticeClass} mt-8`} role="status">
            <p className="font-semibold">{t.closedTitle}</p>
            <p>{t.closedBody}</p>
          </div>
        ) : config.status === "loading" ? (
          <p className="mt-8" role="status">
            {t.checking}
          </p>
        ) : config.status === "error" ? (
          <div className="mt-8 grid justify-items-center gap-4">
            <p className={noticeClass} role="alert">
              {t.configFailed}
            </p>
            <button
              type="button"
              className={buttonClass}
              onClick={() => reload()}
            >
              {t.retry}
            </button>
          </div>
        ) : (
          <form
            className="mt-8 grid gap-6 text-left"
            noValidate
            onSubmit={(event) => void onSubmit(event)}
          >
            <div>
              <label htmlFor={nameId} className={labelClass}>
                {t.familyLabel}
              </label>
              <input
                ref={nameRef}
                id={nameId}
                type="text"
                placeholder={t.familyHint}
                value={name}
                maxLength={FAMILY_NAME_MAX * 2}
                autoComplete="off"
                autoCapitalize="words"
                aria-invalid={nameError ? true : undefined}
                aria-describedby={
                  nameError ? `${nameHintId} ${nameErrorId}` : nameHintId
                }
                onChange={(event) => {
                  setName(event.target.value);
                  if (nameError) setNameError(undefined);
                }}
                className={`text-navy mt-2 min-h-12 w-full rounded-[2px] border bg-transparent px-3 py-2 text-[1.15rem] ${
                  nameError ? "border-burgundy border-2" : "border-slate"
                }`}
              />
              {/* <span id={nameHintId} className={hintClass}>
                {t.familyHint}
              </span> */}
              <p id={nameErrorId} className="text-burgundy mt-2 font-semibold">
                {nameError ? nameErrorText(t, nameError) : null}
              </p>
            </div>

            <div>
              <label htmlFor={phoneNumberId} className={labelClass}>
                {t.phoneLabel}
              </label>
              <input
                ref={phoneNumberRef}
                id={phoneNumberId}
                type="tel"
                placeholder={t.phoneHint}
                value={phoneNumber}
                maxLength={PHONE_NUMBER_MAX}
                autoComplete="tel"
                aria-invalid={phoneNumberError ? true : undefined}
                aria-describedby={
                  phoneNumberError
                    ? `${phoneNumberHintId} ${phoneNumberErrorId}`
                    : phoneNumberHintId
                }
                onChange={(event) => {
                  setPhoneNumber(event.target.value);
                  if (phoneNumberError) setPhoneNumberError(undefined);
                }}
                className={`text-navy mt-2 min-h-12 w-full rounded-[2px] border bg-transparent px-3 py-2 text-[1.15rem] ${
                  phoneNumberError ? "border-burgundy border-2" : "border-slate"
                }`}
              />
              {/* <span id={phoneNumberHintId} className={hintClass}>
                {t.phoneHint}
              </span> */}
              <p
                id={phoneNumberErrorId}
                className="text-burgundy mt-2 font-semibold"
              >
                {phoneNumberError
                  ? phoneNumberErrorText(t, phoneNumberError)
                  : null}
              </p>
            </div>

            <fieldset className="min-w-0 border-0 p-0">
              <legend className={labelClass}>{t.statusLabel}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["attending", "declined"] as const).map((value) => {
                  const checked = status === value;
                  return (
                    <label key={value} className="relative block">
                      <input
                        type="radio"
                        name="status"
                        value={value}
                        checked={checked}
                        onChange={() => setStatus(value)}
                        className="peer sr-only"
                      />
                      <span className="border-slate peer-checked:border-navy peer-checked:bg-navy peer-checked:text-ivory peer-focus-visible:outline-navy flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[2px] border px-2 py-1 text-center text-[0.95rem] tracking-[0.06em] uppercase peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px]">
                        {/* Always rendered and only hidden with CSS, and the label has its own element: React must
                            never insert or remove a node next to bare text, which page translators rewrite. */}
                        <span
                          aria-hidden="true"
                          className={checked ? undefined : "hidden"}
                        >
                          ✓
                        </span>
                        <span>
                          {value === "attending"
                            ? t.statusAttending
                            : t.statusDeclined}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {status === "attending" && (
              <div>
                <span id={countLabelId} className={labelClass}>
                  {t.countLabel}
                </span>
                <div
                  role="group"
                  aria-labelledby={countLabelId}
                  className="border-slate mt-2 grid grid-cols-[3.5rem_1fr_3.5rem] items-stretch rounded-[2px] border"
                >
                  <button
                    type="button"
                    className={stepButtonClass}
                    aria-label={t.decrease}
                    disabled={shownCount <= 1}
                    onClick={() => setCount(shownCount - 1)}
                  >
                    −
                  </button>
                  <output className="border-slate grid place-items-center border-x text-[1.75rem] lining-nums tabular-nums">
                    {shownCount}
                  </output>
                  <button
                    type="button"
                    className={stepButtonClass}
                    aria-label={t.increase}
                    disabled={shownCount >= max}
                    onClick={() => setCount(shownCount + 1)}
                  >
                    +
                  </button>
                </div>
                <span className={hintClass}>{t.max(max)}</span>
              </div>
            )}

            <p className={noticeClass}>{t.deadline(deadlineDate)}</p>

            <div className="grid gap-4">
              <button
                type="submit"
                className={buttonClass}
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? t.sending : t.send}
              </button>
              <div role="alert" aria-live="assertive">
                {formError && (
                  <p className={noticeClass}>
                    {formErrorText(t, formError, max)}
                  </p>
                )}
              </div>
            </div>
          </form>
        )}
      </>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="rsvp"
      aria-labelledby={headingId}
      className="bg-ivory text-navy [&_:focus-visible]:outline-navy grid min-h-svh content-center"
    >
      <div className="mx-auto w-full max-w-[42rem] px-6 py-[4.5rem] text-center">
        {done ? null : (
          <h2
            id={headingId}
            className="mt-2 mb-2 text-[clamp(1.9rem,6vw,2.6rem)] font-medium tracking-[0.12em] uppercase"
          >
            {t.rsvpHeading}
          </h2>
        )}
        {body()}
      </div>
    </section>
  );
}
