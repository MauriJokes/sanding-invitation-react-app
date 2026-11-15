import { VENUE_TIMEZONE } from "../../../shared/config/event";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** before: counting down; today: the event day, after the start; after: any later day. */
export type CountdownPhase = "before" | "today" | "after";

const SECOND = 1000;

export function countdownParts(now: number, target: number): CountdownParts {
  const total = Math.max(0, Math.floor((target - now) / SECOND));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** Calendar day (YYYY-MM-DD) of an instant in the venue timezone. */
function venueDay(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: VENUE_TIMEZONE }).format(new Date(ms));
}

export function countdownPhase(now: number, target: number): CountdownPhase {
  if (now < target) return "before";
  return venueDay(now) === venueDay(target) ? "today" : "after";
}

export const pad2 = (n: number): string => String(n).padStart(2, "0");
