// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INVITE_STORAGE_KEY } from "../../../src/features/rsvp/invite";
import { RsvpSection } from "../../../src/features/rsvp/RsvpSection";
import { I18nProvider } from "../../../src/i18n/I18nProvider";
import { strings, type Lang } from "../../../src/i18n/strings";
import {
  STALE_INVITE,
  VALID_INVITE,
  configCalls,
  configReply,
  createdReply,
  errorReply,
  mockFetch,
  rsvpCalls,
  serverConfig,
  simulateTranslator,
  type Call,
  type Reply,
} from "./helpers";

const ms = strings.ms;
const en = strings.en;
const PHONE = "8123456";
const PHONE_E164 = "+6738123456";

const wrap = (node: ReactNode, lang: Lang = "ms") => <I18nProvider initialLang={lang}>{node}</I18nProvider>;
const show = (invite?: string, lang: Lang = "ms") => render(wrap(<RsvpSection invite={invite} />, lang));

/** A server whose RSVP endpoint answers with `rsvp`, and whose config behaves like the real one. */
const server = (rsvp: Reply | ((call: Call, n: number) => Reply | Promise<Reply>)) =>
  mockFetch((call, index) =>
    call.path === "/api/rsvp/config" ? serverConfig(call) : typeof rsvp === "function" ? rsvp(call, index) : rsvp,
  );

const nameInput = () => screen.getByLabelText<HTMLInputElement>(ms.familyLabel);
const phoneInput = () => screen.getByLabelText<HTMLInputElement>(ms.phoneLabel);
const sendButton = () => screen.getByRole("button", { name: (name) => [ms.send, ms.sending].includes(name) });
const typeName = (value: string) => fireEvent.change(nameInput(), { target: { value } });
const typePhone = (value: string) => fireEvent.change(phoneInput(), { target: { value } });
/** A complete, valid form: the name given and a phone number. */
const fill = (name: string, phone = PHONE) => {
  typeName(name);
  typePhone(phone);
};
const countryButton = () => screen.getByRole("button", { name: (name) => name.startsWith(`${ms.phoneCountryLabel}:`) });
const chooseMalaysia = () => {
  fireEvent.click(countryButton());
  fireEvent.click(screen.getByRole("option", { name: "Malaysia +60" }));
};
const submit = () => fireEvent.click(sendButton());
const formReady = () => screen.findByLabelText(ms.familyLabel);
const plus = () => screen.getByRole("button", { name: ms.increase });
const minus = () => screen.getByRole("button", { name: ms.decrease });
const alertText = () => screen.getByRole("alert").textContent;
const stepper = () => screen.getByRole("group", { name: ms.countLabel });
const shownCount = () => stepper().querySelector("output")?.textContent;

const scrollIntoView = vi.fn();

beforeEach(() => {
  localStorage.clear();
  scrollIntoView.mockClear();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("clean link (external guest)", () => {
  it("asks the server for the limit without any invite and shows the form with a limit of 2", async () => {
    const calls = server(createdReply("attending", 1));
    show();
    expect(screen.getByRole("status").textContent).toBe(ms.checking);
    await formReady();
    expect(configCalls(calls)).toHaveLength(1);
    expect(configCalls(calls)[0]?.body).toEqual({});
    expect(screen.getByText(ms.max(2))).toBeTruthy();
  });

  it("introduces the form and states the deadline in venue time", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    expect(screen.getByText(ms.rsvpLead)).toBeTruthy();
    expect(screen.getByText(ms.deadline("20 Disember 2026"))).toBeTruthy();
  });

  it("keeps the count between 1 and the limit", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    expect((minus() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(plus());
    expect(shownCount()).toBe("2");
    expect((plus() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(plus());
    expect(shownCount()).toBe("2");
  });

  it("sends exactly the form fields: no invite, no guest type, no limit", async () => {
    const calls = server(createdReply("attending", 2));
    show();
    await formReady();
    fill("  The   Ahmad Family ");
    fireEvent.click(plus());
    submit();
    await screen.findByText(ms.successTitle);
    expect(rsvpCalls(calls)[0]?.body).toEqual({
      familyGroupName: "The Ahmad Family",
      phoneNumber: PHONE_E164,
      status: "attending",
      attendeeCount: 2,
    });
  });
});

describe("valid invite (internal guest)", () => {
  it("sends the invite in the config body, remembers it, shows a limit of 10 and submits with it", async () => {
    const calls = server(createdReply("attending", 10));
    show(VALID_INVITE);
    await formReady();

    expect(configCalls(calls)[0]?.body).toEqual({ invite: VALID_INVITE });
    expect(localStorage.getItem(INVITE_STORAGE_KEY)).toBe(VALID_INVITE);
    expect(screen.getByText(ms.max(10))).toBeTruthy();

    fill("Keluarga Besar");
    for (let i = 0; i < 12; i++) fireEvent.click(plus());
    expect(shownCount()).toBe("10");
    submit();
    await screen.findByText(ms.successTitle);

    const body = rsvpCalls(calls)[0]?.body ?? {};
    expect(body).toEqual({
      familyGroupName: "Keluarga Besar",
      phoneNumber: PHONE_E164,
      status: "attending",
      attendeeCount: 10,
      invite: VALID_INVITE,
    });
    expect(Object.keys(body)).not.toContain("guestType");
  });

  it("reuses a remembered invite on a later visit without it in the link", async () => {
    localStorage.setItem(INVITE_STORAGE_KEY, VALID_INVITE);
    const calls = server(createdReply("attending", 1));
    show(VALID_INVITE);
    await formReady();
    expect(configCalls(calls)[0]?.body.invite).toBe(VALID_INVITE);
    expect(screen.getByText(ms.max(10))).toBeTruthy();
  });
});

describe("wrong, stale or rotated invite", () => {
  it("falls back to 2 quietly, forgets the stored code and does not send it with the RSVP", async () => {
    localStorage.setItem(INVITE_STORAGE_KEY, STALE_INVITE);
    const calls = server(createdReply("attending", 1));
    show(STALE_INVITE);
    await formReady();

    expect(screen.getByText(ms.max(2))).toBeTruthy();
    expect(localStorage.getItem(INVITE_STORAGE_KEY)).toBeNull();
    expect(screen.queryByText(/invite|jemputan tidak sah|invalid/i)).toBeNull();

    fill("Keluarga Tan");
    submit();
    await screen.findByText(ms.successTitle);
    expect(rsvpCalls(calls)[0]?.body).not.toHaveProperty("invite");
  });

  it("does not store an invite the server rejected, even from the link", async () => {
    server(createdReply("attending", 1));
    show(STALE_INVITE);
    await formReady();
    expect(localStorage.getItem(INVITE_STORAGE_KEY)).toBeNull();
  });
});

describe("validation in the browser", () => {
  it("blocks an empty name, explains why, links the message to the field and focuses it", async () => {
    const calls = server(createdReply("attending", 1));
    show();
    await formReady();
    submit();

    const input = nameInput();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const message = screen.getByText(ms.nameRequired(2));
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
    expect(document.activeElement).toBe(input);
    expect(rsvpCalls(calls)).toHaveLength(0);
  });

  it("clears the error as soon as the guest edits the name", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    submit();
    typeName("Li");
    expect(nameInput().getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByText(ms.nameRequired(2))).toBeNull();
  });

  it.each([
    ["one character", "A", ms.nameRequired(2)],
    ["only spaces", "      ", ms.nameRequired(2)],
    ["a zero-width character", "Ahmad\u200bFamily", ms.nameInvalid],
    ["too many characters", "A".repeat(101), ms.nameTooLong(100)],
  ])("rejects %s without calling the server", async (_name, value, message) => {
    const calls = server(createdReply("attending", 1));
    show();
    await formReady();
    typeName(value);
    submit();
    expect(screen.getByText(message)).toBeTruthy();
    expect(rsvpCalls(calls)).toHaveLength(0);
  });
});

describe("phone number", () => {
  it("is required: explains why, links the message to the field, focuses it and does not call the server", async () => {
    const calls = server(createdReply("attending", 1));
    show();
    await formReady();
    typeName("The Ahmad Family");
    submit();

    const input = phoneInput();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const message = screen.getByText(ms.phoneRequired);
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
    expect(document.activeElement).toBe(input);
    expect(nameInput().getAttribute("aria-invalid")).toBeNull();
    expect(rsvpCalls(calls)).toHaveLength(0);
  });

  it("is a telephone field that the browser may autofill", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    expect(phoneInput().type).toBe("tel");
    expect(phoneInput().autocomplete).toBe("tel-national");
    expect(phoneInput().inputMode).toBe("numeric");
  });

  it("offers only Brunei and Malaysia, Brunei first and selected, each with a flag and its code", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    const trigger = countryButton();
    expect(trigger.getAttribute("aria-label")).toBe(`${ms.phoneCountryLabel}: Brunei +673`);
    expect(trigger.textContent).toContain("+673");
    expect(trigger.querySelector("img")).toBeTruthy();
    expect(phoneInput().placeholder).toBe(ms.phoneHint("812 3456"));

    fireEvent.click(trigger);
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((option) => option.getAttribute("aria-label"))).toEqual(["Brunei +673", "Malaysia +60"]);
    expect(options.map((option) => option.getAttribute("aria-selected"))).toEqual(["true", "false"]);
    expect(options.every((option) => option.querySelector("img[alt='']"))).toBe(true);
  });

  it("changes the example number and clears the error when another country is chosen", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    typeName("The Ahmad Family");
    submit();
    expect(phoneInput().getAttribute("aria-invalid")).toBe("true");
    chooseMalaysia();
    expect(countryButton().getAttribute("aria-label")).toBe(`${ms.phoneCountryLabel}: Malaysia +60`);
    expect(phoneInput().placeholder).toBe(ms.phoneHint("12 345 6789"));
    expect(phoneInput().getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("selects a country with the keyboard and closes with Escape", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    fireEvent.click(countryButton());
    const list = screen.getByRole("listbox");
    fireEvent.keyDown(list, { key: "ArrowDown" });
    fireEvent.keyDown(list, { key: "Enter" });
    expect(countryButton().getAttribute("aria-label")).toContain("Malaysia");

    fireEvent.click(countryButton());
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(countryButton().getAttribute("aria-label")).toContain("Malaysia");
  });

  it.each([
    ["a plus sign", "+673 812 3456", "6738123456"],
    ["symbols and letters", "(812)-34.56abc", "8123456"],
    ["spaces", " 812 3456 ", "8123456"],
  ])("accepts only digits: %s are dropped as they are typed", async (_name, typed, kept) => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    typePhone(typed);
    expect(phoneInput().value).toBe(kept);
  });

  it("checks the name before the phone number", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    submit();
    expect(nameInput().getAttribute("aria-invalid")).toBe("true");
    expect(phoneInput().getAttribute("aria-invalid")).toBeNull();
    expect(document.activeElement).toBe(nameInput());
  });

  it("clears the error as soon as the guest edits the number", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    typeName("The Ahmad Family");
    submit();
    typePhone("+673");
    expect(phoneInput().getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByText(ms.phoneRequired)).toBeNull();
  });

  it.each([
    ["a number that is too short", "812", ms.phoneInvalid],
    ["a local number with a leading zero", "0812345678", ms.phoneInvalid],
    ["a number that cannot exist", "1", ms.phoneInvalid],
    ["a Malaysian number under Brunei", "12 345 6789", ms.phoneInvalid],
  ])("rejects %s without calling the server", async (_name, value, message) => {
    const calls = server(createdReply("attending", 1));
    show();
    await formReady();
    fill("The Ahmad Family", value);
    submit();
    expect(screen.getByText(message)).toBeTruthy();
    expect(phoneInput().getAttribute("aria-invalid")).toBe("true");
    expect(rsvpCalls(calls)).toHaveLength(0);
  });

  it("rejects a number longer than the limit without calling the server", async () => {
    const calls = server(createdReply("attending", 1));
    show();
    await formReady();
    fill("The Ahmad Family", "1".repeat(21));
    submit();
    expect(screen.getByText(ms.phoneTooLong(20))).toBeTruthy();
    expect(rsvpCalls(calls)).toHaveLength(0);
  });

  it("rejects a pasted number whose country code does not match the dropdown", async () => {
    const calls = server(createdReply("attending", 1));
    show();
    await formReady();
    chooseMalaysia();
    fill("The Ahmad Family", "+673 812 3456");
    submit();
    expect(screen.getByText(ms.phoneInvalid)).toBeTruthy();
    expect(rsvpCalls(calls)).toHaveLength(0);
  });

  it.each(["812 3456", "812-3456", "(812) 3456", "  8123456  "])(
    "sends %j in E.164 form",
    async (typed) => {
      const calls = server(createdReply("attending", 1));
      show();
      await formReady();
      fill("The Ahmad Family", typed);
      submit();
      await screen.findByText(ms.successTitle);
      expect(rsvpCalls(calls)[0]?.body.phoneNumber).toBe(PHONE_E164);
    },
  );

  it("sends a Malaysian number with +60 and drops the leading zero", async () => {
    const calls = server(createdReply("attending", 1));
    show();
    await formReady();
    chooseMalaysia();
    fill("The Ahmad Family", "012-345 6789");
    submit();
    await screen.findByText(ms.successTitle);
    expect(rsvpCalls(calls)[0]?.body.phoneNumber).toBe("+60123456789");
  });

  it("keeps the typed number when the server rejects the RSVP", async () => {
    server(errorReply(409, "RSVP_DUPLICATE"));
    show();
    await formReady();
    fill("The Ahmad Family");
    submit();
    await waitFor(() => expect(alertText()).toBe(ms.errorDuplicate));
    expect(phoneInput().value).toBe(PHONE);
  });

  it("server-side phone rejection: points at the phone field", async () => {
    server(errorReply(400, "VALIDATION_ERROR", ["phoneNumber"]));
    show();
    await formReady();
    fill("The Ahmad Family");
    submit();
    expect(await screen.findByText(ms.phoneInvalid)).toBeTruthy();
    expect(phoneInput().getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(phoneInput());
  });
});

describe("declining", () => {
  it("hides the count and sends zero attendees", async () => {
    const calls = server(createdReply("declined", 0));
    show();
    await formReady();
    fill("Keluarga Lim");
    fireEvent.click(plus());
    fireEvent.click(screen.getByRole("radio", { name: ms.statusDeclined }));
    expect(screen.queryByRole("group", { name: ms.countLabel })).toBeNull();
    submit();
    await screen.findByText(ms.successTitle);
    expect(rsvpCalls(calls)[0]?.body).toEqual({
      familyGroupName: "Keluarga Lim",
      phoneNumber: PHONE_E164,
      status: "declined",
      attendeeCount: 0,
    });
    expect(screen.getByText(ms.successDeclined)).toBeTruthy();
    expect(screen.queryByText(ms.summaryCount)).toBeNull();
  });
});

describe("confirmation", () => {
  it("replaces the form, repeats what was sent, repeats the phone number, says it is final, and takes focus", async () => {
    server(createdReply("attending", 2));
    show();
    await formReady();
    fill("The Ahmad Family");
    fireEvent.click(plus());
    submit();

    const heading = await screen.findByRole("heading", { name: ms.successTitle });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText(ms.successAttending)).toBeTruthy();
    const summary = within(screen.getByText(ms.summaryFamily).closest("dl") as HTMLElement);
    expect(summary.getByText("The Ahmad Family")).toBeTruthy();
    expect(summary.getByText(PHONE_E164)).toBeTruthy();
    expect(summary.getByText(ms.statusAttending)).toBeTruthy();
    expect(summary.getByText("2")).toBeTruthy();
    expect(screen.getByText(ms.successFinal)).toBeTruthy();
    expect(screen.queryByRole("button", { name: ms.send })).toBeNull();
    expect(screen.queryByLabelText(ms.familyLabel)).toBeNull();
  });

  it("scrolls the section to the top of the view so a shorter confirmation never leaves the page mostly empty", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    expect(scrollIntoView).not.toHaveBeenCalled();
    fill("The Ahmad Family");
    submit();
    await screen.findByText(ms.successTitle);
    // The scroll happens in an effect after the confirmation renders, so wait for it rather than race it.
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("rsvp"));
  });

  it("renders guest-typed text as plain text, never as markup", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    fill("<img src=x onerror=alert(1)> Family");
    submit();
    await screen.findByText(ms.successTitle);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)> Family")).toBeTruthy();
  });
});

describe("pending state", () => {
  it("sends one request for a double click and disables the button while waiting", async () => {
    let release: (reply: Reply) => void = () => undefined;
    const calls = server(() => new Promise<Reply>((resolve) => (release = resolve)));
    show();
    await formReady();
    fill("The Ahmad Family");
    const form = sendButton().closest("form") as HTMLFormElement;
    submit();
    // Enter in a field submits the form without going through the (now disabled) button.
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect((sendButton() as HTMLButtonElement).disabled).toBe(true));
    expect(sendButton().textContent).toBe(ms.sending);
    expect(sendButton().getAttribute("aria-busy")).toBe("true");
    submit();
    expect(rsvpCalls(calls)).toHaveLength(1);
    release(createdReply("attending", 1));
    await screen.findByText(ms.successTitle);
    expect(rsvpCalls(calls)).toHaveLength(1);
  });
});

describe("server answers", () => {
  const attempt = async (reply: Reply | ((call: Call, n: number) => Reply)) => {
    const calls = server(reply);
    show();
    await formReady();
    fill("The Ahmad Family");
    submit();
    return calls;
  };

  it("duplicate: neutral message, form and typed details kept", async () => {
    await attempt(errorReply(409, "RSVP_DUPLICATE"));
    await waitFor(() => expect(alertText()).toBe(ms.errorDuplicate));
    expect(nameInput().value).toBe("The Ahmad Family");
    expect(alertText()).not.toMatch(/\d/);
  });

  it("closed: replaces the form with the closed notice", async () => {
    await attempt(errorReply(409, "RSVP_CLOSED"));
    expect(await screen.findByText(ms.closedTitle)).toBeTruthy();
    expect(screen.queryByLabelText(ms.familyLabel)).toBeNull();
    expect(screen.getByText(ms.closedBody)).toBeTruthy();
  });

  it("rate limited: asks to wait and keeps the details", async () => {
    await attempt(errorReply(429, "RATE_LIMITED"));
    await waitFor(() => expect(alertText()).toBe(ms.errorRateLimited));
    expect(nameInput().value).toBe("The Ahmad Family");
  });

  it("server-side name rejection: points at the name field", async () => {
    await attempt(errorReply(400, "VALIDATION_ERROR", ["familyGroupName"]));
    expect(await screen.findByText(ms.nameInvalid)).toBeTruthy();
    expect(nameInput().getAttribute("aria-invalid")).toBe("true");
  });

  it("other validation failure: generic message", async () => {
    await attempt(errorReply(400, "VALIDATION_ERROR", ["status"]));
    await waitFor(() => expect(alertText()).toBe(ms.errorValidation));
  });

  it("limit exceeded (the invite was rotated meanwhile): refreshes the limit, shrinks the count and says so", async () => {
    localStorage.setItem(INVITE_STORAGE_KEY, VALID_INVITE);
    let configAnswers = 0;
    const calls = mockFetch((call) => {
      if (call.path === "/api/rsvp/config") return configReply(configAnswers++ === 0 ? 10 : 2);
      return errorReply(400, "ATTENDEE_LIMIT_EXCEEDED", ["attendeeCount"]);
    });
    show(VALID_INVITE);
    await formReady();
    fill("Keluarga Besar");
    for (let i = 0; i < 6; i++) fireEvent.click(plus());
    submit();

    await waitFor(() => expect(screen.getByText(ms.max(2))).toBeTruthy());
    expect(alertText()).toBe(ms.errorLimitChanged(2));
    expect(shownCount()).toBe("2");
    expect(nameInput().value).toBe("Keluarga Besar");
    expect(configCalls(calls)).toHaveLength(2);
    expect(localStorage.getItem(INVITE_STORAGE_KEY)).toBeNull();
  });

  it("server error (5xx): says it was not sent and keeps the details", async () => {
    await attempt(errorReply(500, "INTERNAL_ERROR"));
    await waitFor(() => expect(alertText()).toBe(ms.errorFailed));
    expect(nameInput().value).toBe("The Ahmad Family");
  });
});

describe("retry after no answer", () => {
  it("explains a duplicate honestly when the same submission may already have gone through", async () => {
    let n = 0;
    server(() => (n++ === 0 ? errorReply(503, "INTERNAL_ERROR") : errorReply(409, "RSVP_DUPLICATE")));
    show();
    await formReady();
    fill("The Ahmad Family");
    submit();
    await waitFor(() => expect(alertText()).toBe(ms.errorFailed));
    submit();
    await waitFor(() => expect(alertText()).toBe(ms.errorDuplicateAfterRetry));
  });

  it("does not make that claim after the guest changed the family name", async () => {
    let n = 0;
    server(() => (n++ === 0 ? errorReply(503, "INTERNAL_ERROR") : errorReply(409, "RSVP_DUPLICATE")));
    show();
    await formReady();
    fill("The Ahmad Family");
    submit();
    await waitFor(() => expect(alertText()).toBe(ms.errorFailed));
    typeName("Another Family");
    submit();
    await waitFor(() => expect(alertText()).toBe(ms.errorDuplicate));
  });

  it("also treats a dropped connection as 'not sent' and lets the guest retry successfully", async () => {
    let n = 0;
    server(() => (n++ === 0 ? (new TypeError("Failed to fetch") as unknown as Reply) : createdReply("attending", 1)));
    show();
    await formReady();
    fill("The Ahmad Family");
    submit();
    await waitFor(() => expect(alertText()).toBe(ms.errorFailed));
    submit();
    await screen.findByText(ms.successTitle);
  });
});

describe("closed and unreachable", () => {
  it("shows only the closed notice when the server says RSVP is closed", async () => {
    mockFetch(() => configReply(2, false));
    show();
    expect(await screen.findByText(ms.closedTitle)).toBeTruthy();
    expect(screen.queryByLabelText(ms.familyLabel)).toBeNull();
    expect(screen.queryByRole("button", { name: ms.send })).toBeNull();
  });

  it("offers a retry when the form cannot be loaded, then shows the form", async () => {
    let n = 0;
    const calls = mockFetch(() => (n++ === 0 ? new TypeError("offline") : configReply(2)));
    show();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(alertText()).toBe(ms.configFailed);
    expect(screen.queryByLabelText(ms.familyLabel)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: ms.retry }));
    await formReady();
    expect(configCalls(calls)).toHaveLength(2);
  });

  it("shows the 'could not be loaded' state, not the form, when the service reports it is not ready", async () => {
    mockFetch(() => errorReply(503, "SERVICE_NOT_READY"));
    show();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(alertText()).toBe(ms.configFailed);
    expect(screen.queryByLabelText(ms.familyLabel)).toBeNull();
    expect(screen.getByRole("button", { name: ms.retry })).toBeTruthy();
  });

  it("treats a malformed config response as unreachable, never as permission", async () => {
    mockFetch(() => ({ status: 200, json: { data: { maxAttendees: "10", rsvpOpen: true }, error: null } }));
    show(VALID_INVITE);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByLabelText(ms.familyLabel)).toBeNull();
  });
});

describe("when the browser machine-translates the page", () => {
  afterEach(() => document.documentElement.classList.remove("translated-ltr"));

  it("still lets the guest choose 'unable to attend', go back, change the count and see errors", async () => {
    server(createdReply("declined", 0));
    const { container } = show();
    await formReady();
    simulateTranslator(container);

    fireEvent.click(screen.getByRole("radio", { name: ms.statusDeclined }));
    expect(container.querySelector("form")).not.toBeNull();
    expect(screen.queryByRole("group", { name: ms.countLabel })).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: ms.statusAttending }));
    fireEvent.click(plus());
    submit();
    expect(screen.getByText(ms.nameRequired(2))).toBeTruthy();
    expect(container.querySelector("form")).not.toBeNull();
  });

  it("still submits a declined RSVP and shows the confirmation", async () => {
    server(createdReply("declined", 0));
    const { container } = show();
    await formReady();
    simulateTranslator(container);

    fireEvent.click(screen.getByRole("radio", { name: ms.statusDeclined }));
    fill("Keluarga Lim");
    submit();
    expect(await screen.findByRole("heading", { name: ms.successTitle })).toBeTruthy();
  });
});

describe("English", () => {
  it("shows the English copy and the English confirmation", async () => {
    server(createdReply("attending", 1));
    show(undefined, "en");
    await screen.findByLabelText(en.familyLabel);
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByText(en.deadline("20 December 2026"))).toBeTruthy();
    expect(screen.getByText(en.max(2))).toBeTruthy();
    fireEvent.change(screen.getByLabelText(en.familyLabel), { target: { value: "The Ahmad Family" } });
    fireEvent.change(screen.getByLabelText(en.phoneLabel), { target: { value: PHONE } });
    fireEvent.click(screen.getByRole("button", { name: en.send }));
    expect(await screen.findByRole("heading", { name: en.successTitle })).toBeTruthy();
    expect(screen.getByText(en.successAttending)).toBeTruthy();
  });
});
