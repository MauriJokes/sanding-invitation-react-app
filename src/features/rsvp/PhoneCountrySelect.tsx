import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  PHONE_COUNTRIES,
  type PhoneCountryCode,
} from "../../../shared/rsvp/constants";
import bnFlag from "../../assets/flags/bn.svg";
import myFlag from "../../assets/flags/my.svg";

const FLAGS: Record<PhoneCountryCode, string> = { BN: bnFlag, MY: myFlag };

interface Props {
  value: PhoneCountryCode;
  onChange: (code: PhoneCountryCode) => void;
  /** Accessible name of the control, for example "Country code". */
  label: string;
}

function Option({ code }: { code: PhoneCountryCode }) {
  const country = PHONE_COUNTRIES.find((c) => c.code === code)!;
  return (
    <>
      {/* Flags are SVG files, not emoji: Windows browsers do not draw flag emoji. */}
      <img
        src={FLAGS[code]}
        alt=""
        width={24}
        height={16}
        className="block h-4 w-6 shrink-0 rounded-[1px] shadow-[0_0_0_1px_rgb(0_0_0/0.15)]"
      />
      <span>+{country.dialCode}</span>
    </>
  );
}

/** A listbox dropdown, because a native select cannot show images inside its options. */
export function PhoneCountrySelect({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-${index}`;

  const selected = PHONE_COUNTRIES.find((c) => c.code === value)!;

  function show() {
    setActive(PHONE_COUNTRIES.findIndex((c) => c.code === value));
    setOpen(true);
    // The list is not rendered yet; focus it once it is.
    requestAnimationFrame(() => listRef.current?.focus());
  }

  function hide(refocus: boolean) {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }

  function choose(index: number) {
    onChange(PHONE_COUNTRIES[index]!.code);
    hide(true);
  }

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      show();
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const last = PHONE_COUNTRIES.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        hide(true);
        break;
      case "Tab":
        hide(false);
        break;
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`${label}: ${selected.name} +${selected.dialCode}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? hide(false) : show())}
        onKeyDown={onButtonKeyDown}
        className="border-slate text-navy flex min-h-12 cursor-pointer items-center gap-2 rounded-[2px] border bg-transparent px-3 text-[1.15rem]"
      >
        <Option code={value} />
        <svg
          viewBox="0 0 12 8"
          aria-hidden="true"
          className={`h-2 w-3 fill-none stroke-current stroke-[1.5] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1.5 6 6.5 11 1.5" />
        </svg>
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKeyDown}
          onBlur={(event) => {
            if (event.relatedTarget !== buttonRef.current) hide(false);
          }}
          className="border-navy bg-ivory absolute top-full left-0 z-10 mt-1 w-max min-w-full overflow-hidden rounded-[2px] border shadow-[0_6px_18px_rgb(27_35_82/0.18)] outline-none"
        >
          {PHONE_COUNTRIES.map((country, index) => (
            // Keyboard selection is handled by the listbox (aria-activedescendant), not per option.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={country.code}
              id={optionId(index)}
              role="option"
              aria-selected={country.code === value}
              aria-label={`${country.name} +${country.dialCode}`}
              onClick={() => choose(index)}
              onMouseEnter={() => setActive(index)}
              className={`flex min-h-12 cursor-pointer items-center gap-2 px-3 text-[1.15rem] ${
                index === active ? "bg-navy text-ivory" : "text-navy"
              } ${country.code === value ? "font-semibold" : ""}`}
            >
              <Option code={country.code} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
