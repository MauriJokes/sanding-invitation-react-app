import { EVENT, VENUE_TIMEZONE } from "../../../shared/config/event";
import type { Lang } from "../../i18n/strings";

/** Clock hour (0-23) and minute of an instant in the venue timezone. */
export function venueClock(instant: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: VENUE_TIMEZONE,
  }).formatToParts(instant);
  const value = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return { hour: value("hour"), minute: value("minute") };
}

/** Malay day periods: pagi, tengah hari, petang, malam. */
function malayPeriod(hour: number): string {
  if (hour < 12) return "pagi";
  if (hour < 14) return "tengah hari";
  if (hour < 19) return "petang";
  return "malam";
}

/** Arrival time for display, derived from the event instant: "7.15 malam" or "7:15 PM". */
export function formatArrivalTime(instant: Date, lang: Lang): string {
  const { hour, minute } = venueClock(instant);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(minute).padStart(2, "0");
  return lang === "ms" ? `${hour12}.${mm} ${malayPeriod(hour)}` : `${hour12}:${mm} ${hour < 12 ? "AM" : "PM"}`;
}

/** Long event date in the venue timezone, e.g. "Isnin, 28 Disember 2026". */
export function formatEventDate(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: VENUE_TIMEZONE,
  }).format(new Date(EVENT.startsAt));
}
