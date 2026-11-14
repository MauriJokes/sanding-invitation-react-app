import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { EVENT, RSVP_DEADLINE, VENUE_TIMEZONE } from "../../../shared/config/event";
import {
  FAMILY_NAME_MAX,
  FAMILY_NAME_MIN,
  hasDisallowedCharacters,
  normalizeFamilyName,
  type RsvpStatus,
} from "../../../shared/rsvp/constants";
import { buttonClass, hintClass, labelClass, noticeClass } from "../../components/formStyles";
import { useI18n } from "../../i18n/I18nProvider";
import type { Strings } from "../../i18n/strings";
import { submitRsvp, type RsvpPayload } from "./api";
import { useRsvpConfig } from "./useRsvpConfig";

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
  status: RsvpStatus;
  attendeeCount: number;
}

function validateName(normalized: string): NameError | undefined {
  if (normalized.length < FAMILY_NAME_MIN) return "required";
  if (normalized.length > FAMILY_NAME_MAX) return "tooLong";
  if (hasDisallowedCharacters(normalized)) return "invalid";
  return undefined;
}

const nameErrorText = (t: Strings, error: NameError) =>
  error === "required" ? t.nameRequired(FAMILY_NAME_MIN) : error === "tooLong" ? t.nameTooLong(FAMILY_NAME_MAX) : t.nameInvalid;

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

const stepButtonClass = "min-h-12 w-[3.25rem] text-[1.6rem] text-navy disabled:cursor-not-allowed disabled:opacity-35";

/**
 * One public RSVP for the whole family/group, Walimatulurus only. `invite` is the candidate code from the
 * link or from storage; the server decides whether it is valid and therefore which limit applies.
 */
export function RsvpSection({ invite }: { invite?: string }) {
  const { t, locale } = useI18n();
  const { state: config, reload } = useRsvpConfig(invite);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<RsvpStatus>("attending");
  const [count, setCount] = useState(1);
  const [nameError, setNameError] = useState<NameError | undefined>();
  const [formError, setFormError] = useState<FormError | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [closedByServer, setClosedByServer] = useState(false);
  const [done, setDone] = useState<Submitted | undefined>();

  const submittingRef = useRef(false);
  /** Payload of an attempt that got no usable answer, so a later "duplicate" can be explained honestly. */
  const unansweredRef = useRef<string | undefined>(undefined);
  const nameRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  const headingId = useId();
  const nameId = useId();
  const nameHintId = useId();
  const nameErrorId = useId();
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
  const closed = closedByServer || (config.status === "ready" && !config.rsvpOpen);
  const deadlineDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: VENUE_TIMEZONE,
  }).format(new Date(RSVP_DEADLINE));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || config.status !== "ready") return;

    const normalized = normalizeFamilyName(name);
    const invalid = validateName(normalized);
    setNameError(invalid);
    if (invalid) {
      setFormError(undefined);
      nameRef.current?.focus();
      return;
    }

    const payload: RsvpPayload = {
      familyGroupName: normalized,
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
      setDone({ familyGroupName: normalized, status: result.data.status, attendeeCount: result.data.attendeeCount });
      return;
    }

    if (result.kind === "network" || result.status >= 500) {
      unansweredRef.current = attemptKey;
      setFormError("failed");
      return;
    }

    switch (result.code) {
      case "RSVP_DUPLICATE":
        setFormError(unansweredRef.current === attemptKey ? "duplicateAfterRetry" : "duplicate");
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
            className="text-[clamp(1.9rem,6vw,2.6rem)] font-medium uppercase tracking-[0.12em]"
          >
            {t.successTitle}
          </h2>
          <p className="mt-4">{done.status === "attending" ? t.successAttending : t.successDeclined}</p>
          <dl className="mx-auto mt-6 grid max-w-sm gap-3 border-y border-gold py-5 text-left">
            <div>
              <dt className={`${labelClass} text-gold-ink`}>{t.summaryFamily}</dt>
              <dd>{done.familyGroupName}</dd>
            </div>
            <div>
              <dt className={`${labelClass} text-gold-ink`}>{t.summaryAttendance}</dt>
              <dd>{done.status === "attending" ? t.statusAttending : t.statusDeclined}</dd>
            </div>
            {done.status === "attending" && (
              <div>
                <dt className={`${labelClass} text-gold-ink`}>{t.summaryCount}</dt>
                <dd className="lining-nums">{done.attendeeCount}</dd>
              </div>
            )}
          </dl>
          <p className="mt-6 text-base italic text-slate">{t.successFinal}</p>
        </div>
      );
    }

    return (
      <>
        <p className="mt-4">{t.rsvpLead}</p>
        <p className="mt-1 font-semibold">{t.scopeNote}</p>
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
            <button type="button" className={buttonClass} onClick={() => reload()}>
              {t.retry}
            </button>
          </div>
        ) : (
          <form className="mt-8 grid gap-6 text-left" noValidate onSubmit={(event) => void onSubmit(event)}>
            <div>
              <label htmlFor={nameId} className={labelClass}>
                {t.familyLabel}
              </label>
              <input
                ref={nameRef}
                id={nameId}
                type="text"
                value={name}
                maxLength={FAMILY_NAME_MAX * 2}
                autoComplete="off"
                autoCapitalize="words"
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? `${nameHintId} ${nameErrorId}` : nameHintId}
                onChange={(event) => {
                  setName(event.target.value);
                  if (nameError) setNameError(undefined);
                }}
                className={`mt-2 min-h-12 w-full rounded-[2px] border bg-transparent px-3 py-2 text-[1.15rem] text-navy ${
                  nameError ? "border-2 border-burgundy" : "border-slate"
                }`}
              />
              <span id={nameHintId} className={hintClass}>
                {t.familyHint}
              </span>
              <p id={nameErrorId} className="mt-2 font-semibold text-burgundy">
                {nameError ? nameErrorText(t, nameError) : null}
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
                      <span className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[2px] border border-slate px-2 py-1 text-center text-[0.95rem] uppercase tracking-[0.06em] peer-checked:border-navy peer-checked:bg-navy peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-navy">
                        {/* Always rendered and only hidden with CSS, and the label has its own element: React must
                            never insert or remove a node next to bare text, which page translators rewrite. */}
                        <span aria-hidden="true" className={checked ? undefined : "hidden"}>
                          ✓
                        </span>
                        <span>{value === "attending" ? t.statusAttending : t.statusDeclined}</span>
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
                <div role="group" aria-labelledby={countLabelId} className="mt-2 flex w-fit rounded-[2px] border border-slate">
                  <button
                    type="button"
                    className={stepButtonClass}
                    aria-label={t.decrease}
                    disabled={shownCount <= 1}
                    onClick={() => setCount(shownCount - 1)}
                  >
                    −
                  </button>
                  <output className="grid min-w-14 place-items-center border-x border-slate text-[1.5rem] lining-nums tabular-nums">
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
              <button type="submit" className={buttonClass} disabled={submitting} aria-busy={submitting}>
                {submitting ? t.sending : t.send}
              </button>
              <div role="alert" aria-live="assertive">
                {formError && <p className={noticeClass}>{formErrorText(t, formError, max)}</p>}
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
      className="grid min-h-svh content-center bg-ivory text-navy [&_:focus-visible]:outline-navy"
    >
      <div className="mx-auto w-full max-w-[42rem] px-6 py-[4.5rem] text-center">
        <p className="text-[0.9rem] font-semibold uppercase tracking-[0.28em] text-gold-ink">{EVENT.title}</p>
        {done ? null : (
          <h2 id={headingId} className="mb-2 mt-2 text-[clamp(1.9rem,6vw,2.6rem)] font-medium uppercase tracking-[0.12em]">
            {t.rsvpHeading}
          </h2>
        )}
        {body()}
      </div>
    </section>
  );
}
