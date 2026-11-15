import type { ReactNode } from "react";
import type { Strings } from "../../i18n/strings";

export interface NavItem {
  id: string;
  label: keyof Pick<Strings, "navDetails" | "navRsvp" | "navLocation" | "navWishes">;
  icon: ReactNode;
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-[22px] fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round] max-md:block md:hidden">
    {children}
  </svg>
);

/** Approved order (docs/DESIGN_SYSTEM.md 5b). A section appears in the bar only once it exists on the page. */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "details",
    label: "navDetails",
    icon: (
      <Icon>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M14 3v5h5M9 12h6M9 16h6" />
      </Icon>
    ),
  },
  {
    id: "rsvp",
    label: "navRsvp",
    icon: (
      <Icon>
        <path d="M4 6h16v12H4z" />
        <path d="m4 7 8 6 8-6" />
      </Icon>
    ),
  },
  {
    id: "location",
    label: "navLocation",
    icon: (
      <Icon>
        <path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" />
        <circle cx="12" cy="10" r="2" />
      </Icon>
    ),
  },
  {
    id: "guestbook",
    label: "navWishes",
    icon: (
      <Icon>
        <path d="M4 20l1-4L16 5l3 3L8 19z" />
        <path d="M14 7l3 3" />
      </Icon>
    ),
  },
];
