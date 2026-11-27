export interface WeddingEvent {
  id: string;
  title: string;
  /** ISO-8601 with explicit offset. No end time is published (owner decision). */
  startsAt: string;
  venueName: string;
  venueRoom: string;
  venueAddress: string;
  directionsUrl: string;
}

export const VENUE_TIMEZONE = "Asia/Brunei";

export const EVENT = {
  id: "sanding",
  title: "Walimatul Urus",
  startsAt: "2026-12-28T19:15:00+08:00",
  venueName: "The Rizqun International Hotel",
  venueRoom: "Songket Ballroom",
  venueAddress:
    "Abdul Razak Complex, Jln Gadong, Bandar Seri Begawan BE3519, Brunei Darussalam",
  directionsUrl: "https://maps.app.goo.gl/xA2V6PwWV2YyQbWy5?g_st=ic",
} as const satisfies WeddingEvent;

// TODO(owner): placeholder until the family confirms the RSVP deadline.
// RSVPs stay open through the end of this day in venue time.
export const RSVP_DEADLINE = "2026-12-20T23:59:59+08:00";

export function isRsvpOpen(now: Date): boolean {
  return now.getTime() <= Date.parse(RSVP_DEADLINE);
}
