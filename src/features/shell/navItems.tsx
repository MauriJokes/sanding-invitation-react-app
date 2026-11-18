import type { ReactNode } from "react";
import type { Strings } from "../../i18n/strings";

export interface NavItem {
  id: string;
  label: keyof Pick<
    Strings,
    "navDetails" | "navRsvp" | "navPrayer" | "navWishes"
  >;
  icon: ReactNode;
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className="size-[22px] fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round] max-md:block md:hidden"
  >
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
    id: "prayer",
    label: "navPrayer",
    icon: (
      <Icon>
        <path d="M12 7c-2-2-5-3-9-3v15c4 0 7 1 9 3 2-2 5-3 9-3V4c-4 0-7 1-9 3zM12 7v15" />
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
