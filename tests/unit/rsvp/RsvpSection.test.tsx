// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INVITE_STORAGE_KEY } from "../../../src/features/rsvp/invite";
import { RsvpSection } from "../../../src/features/rsvp/RsvpSection";
import { I18nProvider } from "../../../src/i18n/I18nProvider";
import type { Lang } from "../../../src/i18n/strings";
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
  type Call,
  type Reply,
} from "./helpers";

const wrap = (node: ReactNode, lang: Lang = "ms") => <I18nProvider initialLang={lang}>{node}</I18nProvider>;
const show = (invite?: string, lang: Lang = "ms") => render(wrap(<RsvpSection invite={invite} />, lang));

/** A server whose RSVP endpoint answers with `rsvp`, and whose config behaves like the real one. */
const server = (rsvp: Reply | ((call: Call, n: number) => Reply | Promise<Reply>)) =>
  mockFetch((call, index) =>
    call.path === "/api/rsvp/config" ? serverConfig(call) : typeof rsvp === "function" ? rsvp(call, index) : rsvp,
  );

const nameInput = () => screen.getByLabelText<HTMLInputElement>("Nama keluarga / kumpulan");
const sendButton = () => screen.getByRole("button", { name: /Send RSVP|Menghantar|Sending/ });
const typeName = (value: string) => fireEvent.change(nameInput(), { target: { value } });
const submit = () => fireEvent.click(sendButton());
const formReady = () => screen.findByLabelText("Nama keluarga / kumpulan");
const plus = () => screen.getByRole("button", { name: "Tambah" });
const minus = () => screen.getByRole("button", { name: "Kurang" });
const alertText = () => screen.getByRole("alert").textContent;
const stepper = () => screen.getByRole("group", { name: "Jumlah kehadiran" });
const shownCount = () => stepper().querySelector("output")?.textContent;

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("clean link (external guest)", () => {
  it("asks the server for the limit without any invite and shows the form with a limit of 2", async () => {
    const calls = server(createdReply("attending", 1));
    show();
    expect(screen.getByRole("status").textContent).toBe("Menyemak…");
    await formReady();
    expect(configCalls(calls)).toHaveLength(1);
    expect(configCalls(calls)[0]?.body).toEqual({});
    expect(screen.getByText("Maksimum 2 orang.")).toBeTruthy();
  });

  it("states that the RSVP covers the family for Walimatulurus only, and the deadline in venue time", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    expect(screen.getByText("Satu RSVP untuk seluruh keluarga / kumpulan anda.")).toBeTruthy();
    expect(screen.getByText("RSVP ini untuk majlis Walimatulurus sahaja.")).toBeTruthy();
    expect(screen.getByText("RSVP ditutup pada 20 Disember 2026.")).toBeTruthy();
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
    typeName("  The   Ahmad Family ");
    fireEvent.click(plus());
    submit();
    await screen.findByText("Terima kasih");
    expect(rsvpCalls(calls)[0]?.body).toEqual({ familyGroupName: "The Ahmad Family", status: "attending", attendeeCount: 2 });
  });
});

describe("valid invite (internal guest)", () => {
  it("sends the invite in the config body, remembers it, shows a limit of 10 and submits with it", async () => {
    const calls = server(createdReply("attending", 10));
    show(VALID_INVITE);
    await formReady();

    expect(configCalls(calls)[0]?.body).toEqual({ invite: VALID_INVITE });
    expect(localStorage.getItem(INVITE_STORAGE_KEY)).toBe(VALID_INVITE);
    expect(screen.getByText("Maksimum 10 orang.")).toBeTruthy();

    typeName("Keluarga Besar");
    for (let i = 0; i < 12; i++) fireEvent.click(plus());
    expect(shownCount()).toBe("10");
    submit();
    await screen.findByText("Terima kasih");

    const body = rsvpCalls(calls)[0]?.body ?? {};
    expect(body).toEqual({ familyGroupName: "Keluarga Besar", status: "attending", attendeeCount: 10, invite: VALID_INVITE });
    expect(Object.keys(body)).not.toContain("guestType");
  });

  it("reuses a remembered invite on a later visit without it in the link", async () => {
    localStorage.setItem(INVITE_STORAGE_KEY, VALID_INVITE);
    const calls = server(createdReply("attending", 1));
    show(VALID_INVITE);
    await formReady();
    expect(configCalls(calls)[0]?.body.invite).toBe(VALID_INVITE);
    expect(screen.getByText("Maksimum 10 orang.")).toBeTruthy();
  });
});

describe("wrong, stale or rotated invite", () => {
  it("falls back to 2 quietly, forgets the stored code and does not send it with the RSVP", async () => {
    localStorage.setItem(INVITE_STORAGE_KEY, STALE_INVITE);
    const calls = server(createdReply("attending", 1));
    show(STALE_INVITE);
    await formReady();

    expect(screen.getByText("Maksimum 2 orang.")).toBeTruthy();
    expect(localStorage.getItem(INVITE_STORAGE_KEY)).toBeNull();
    expect(screen.queryByText(/invite|jemputan tidak sah|invalid/i)).toBeNull();

    typeName("Keluarga Tan");
    submit();
    await screen.findByText("Terima kasih");
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
    const message = screen.getByText(/Sila masukkan nama keluarga \/ kumpulan \(sekurang-kurangnya 2 aksara\)\./);
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
    expect(screen.queryByText(/Sila masukkan nama keluarga/)).toBeNull();
  });

  it.each([
    ["one character", "A", /sekurang-kurangnya 2 aksara/],
    ["only spaces", "      ", /sekurang-kurangnya 2 aksara/],
    ["a zero-width character", "Ahmad\u200bFamily", /aksara yang tidak dibenarkan/],
    ["too many characters", "A".repeat(101), /terlalu panjang \(maksimum 100 aksara\)/],
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

describe("declining", () => {
  it("hides the count and sends zero attendees", async () => {
    const calls = server(createdReply("declined", 0));
    show();
    await formReady();
    typeName("Keluarga Lim");
    fireEvent.click(plus());
    fireEvent.click(screen.getByLabelText("Tidak dapat hadir"));
    expect(screen.queryByRole("group", { name: "Jumlah kehadiran" })).toBeNull();
    submit();
    await screen.findByText("Terima kasih");
    expect(rsvpCalls(calls)[0]?.body).toEqual({ familyGroupName: "Keluarga Lim", status: "declined", attendeeCount: 0 });
    expect(screen.getByText(/Terima kasih kerana memaklumkan kami\./)).toBeTruthy();
    expect(screen.queryByText("Jumlah")).toBeNull();
  });
});

describe("confirmation", () => {
  it("replaces the form, repeats what was sent, says Walimatulurus only and that it is final, and takes focus", async () => {
    server(createdReply("attending", 2));
    show();
    await formReady();
    typeName("The Ahmad Family");
    fireEvent.click(plus());
    submit();

    const heading = await screen.findByRole("heading", { name: "Terima kasih" });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText("RSVP anda untuk majlis Walimatulurus telah diterima.")).toBeTruthy();
    const summary = within(screen.getByText("Keluarga / kumpulan").closest("dl") as HTMLElement);
    expect(summary.getByText("The Ahmad Family")).toBeTruthy();
    expect(summary.getByText("Akan hadir")).toBeTruthy();
    expect(summary.getByText("2")).toBeTruthy();
    expect(screen.getByText(/RSVP ini muktamad\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Send RSVP/ })).toBeNull();
    expect(screen.queryByLabelText("Nama keluarga / kumpulan")).toBeNull();
  });

  it("renders guest-typed text as plain text, never as markup", async () => {
    server(createdReply("attending", 1));
    show();
    await formReady();
    typeName("<img src=x onerror=alert(1)> Family");
    submit();
    await screen.findByText("Terima kasih");
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
    typeName("The Ahmad Family");
    submit();
    submit();
    await waitFor(() => expect((sendButton() as HTMLButtonElement).disabled).toBe(true));
    expect(sendButton().textContent).toBe("Menghantar…");
    expect(sendButton().getAttribute("aria-busy")).toBe("true");
    submit();
    expect(rsvpCalls(calls)).toHaveLength(1);
    release(createdReply("attending", 1));
    await screen.findByText("Terima kasih");
    expect(rsvpCalls(calls)).toHaveLength(1);
  });
});

describe("server answers", () => {
  const attempt = async (reply: Reply | ((call: Call, n: number) => Reply)) => {
    const calls = server(reply);
    show();
    await formReady();
    typeName("The Ahmad Family");
    submit();
    return calls;
  };

  it("duplicate: neutral message, form and typed details kept", async () => {
    await attempt(errorReply(409, "RSVP_DUPLICATE"));
    await waitFor(() => expect(alertText()).toBe("Satu RSVP untuk keluarga / kumpulan ini telah diterima."));
    expect(nameInput().value).toBe("The Ahmad Family");
    expect(alertText()).not.toMatch(/\d/);
  });

  it("closed: replaces the form with the closed notice", async () => {
    await attempt(errorReply(409, "RSVP_CLOSED"));
    expect(await screen.findByText("RSVP telah ditutup.")).toBeTruthy();
    expect(screen.queryByLabelText("Nama keluarga / kumpulan")).toBeNull();
    expect(screen.getByText(/hubungi pasangan secara terus/)).toBeTruthy();
  });

  it("rate limited: asks to wait and keeps the details", async () => {
    await attempt(errorReply(429, "RATE_LIMITED"));
    await waitFor(() => expect(alertText()).toBe("Terlalu banyak percubaan. Sila cuba lagi sebentar lagi."));
    expect(nameInput().value).toBe("The Ahmad Family");
  });

  it("server-side name rejection: points at the name field", async () => {
    await attempt(errorReply(400, "VALIDATION_ERROR", ["familyGroupName"]));
    expect(await screen.findByText(/aksara yang tidak dibenarkan/)).toBeTruthy();
    expect(nameInput().getAttribute("aria-invalid")).toBe("true");
  });

  it("other validation failure: generic message", async () => {
    await attempt(errorReply(400, "VALIDATION_ERROR", ["status"]));
    await waitFor(() => expect(alertText()).toBe("Sila semak jawapan anda."));
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
    typeName("Keluarga Besar");
    for (let i = 0; i < 6; i++) fireEvent.click(plus());
    submit();

    await waitFor(() => expect(screen.getByText("Maksimum 2 orang.")).toBeTruthy());
    expect(alertText()).toBe("Had telah dikemas kini kepada 2 orang. Sila semak jumlah anda.");
    expect(shownCount()).toBe("2");
    expect(nameInput().value).toBe("Keluarga Besar");
    expect(configCalls(calls)).toHaveLength(2);
    expect(localStorage.getItem(INVITE_STORAGE_KEY)).toBeNull();
  });

  it("server error (5xx): says it was not sent and keeps the details", async () => {
    await attempt(errorReply(500, "INTERNAL_ERROR"));
    await waitFor(() => expect(alertText()).toMatch(/RSVP anda belum dihantar\./));
    expect(nameInput().value).toBe("The Ahmad Family");
  });
});

describe("retry after no answer", () => {
  it("explains a duplicate honestly when the same submission may already have gone through", async () => {
    let n = 0;
    server(() => (n++ === 0 ? errorReply(503, "INTERNAL_ERROR") : errorReply(409, "RSVP_DUPLICATE")));
    show();
    await formReady();
    typeName("The Ahmad Family");
    submit();
    await waitFor(() => expect(alertText()).toMatch(/belum dihantar/));
    submit();
    await waitFor(() => expect(alertText()).toMatch(/mungkin telah berjaya/));
  });

  it("does not make that claim after the guest changed the family name", async () => {
    let n = 0;
    server(() => (n++ === 0 ? errorReply(503, "INTERNAL_ERROR") : errorReply(409, "RSVP_DUPLICATE")));
    show();
    await formReady();
    typeName("The Ahmad Family");
    submit();
    await waitFor(() => expect(alertText()).toMatch(/belum dihantar/));
    typeName("Another Family");
    submit();
    await waitFor(() => expect(alertText()).toBe("Satu RSVP untuk keluarga / kumpulan ini telah diterima."));
  });

  it("also treats a dropped connection as 'not sent' and lets the guest retry successfully", async () => {
    let n = 0;
    server(() => (n++ === 0 ? (new TypeError("Failed to fetch") as unknown as Reply) : createdReply("attending", 1)));
    show();
    await formReady();
    typeName("The Ahmad Family");
    submit();
    await waitFor(() => expect(alertText()).toMatch(/belum dihantar/));
    submit();
    await screen.findByText("Terima kasih");
  });
});

describe("closed and unreachable", () => {
  it("shows only the closed notice when the server says RSVP is closed", async () => {
    mockFetch(() => configReply(2, false));
    show();
    expect(await screen.findByText("RSVP telah ditutup.")).toBeTruthy();
    expect(screen.queryByLabelText("Nama keluarga / kumpulan")).toBeNull();
    expect(screen.queryByRole("button", { name: /Send RSVP/ })).toBeNull();
  });

  it("offers a retry when the form cannot be loaded, then shows the form", async () => {
    let n = 0;
    const calls = mockFetch(() => (n++ === 0 ? new TypeError("offline") : configReply(2)));
    show();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(alertText()).toMatch(/Borang RSVP tidak dapat dimuatkan/);
    expect(screen.queryByLabelText("Nama keluarga / kumpulan")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cuba lagi" }));
    await formReady();
    expect(configCalls(calls)).toHaveLength(2);
  });

  it("treats a malformed config response as unreachable, never as permission", async () => {
    mockFetch(() => ({ status: 200, json: { data: { maxAttendees: "10", rsvpOpen: true }, error: null } }));
    show(VALID_INVITE);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByLabelText("Nama keluarga / kumpulan")).toBeNull();
  });
});

describe("English", () => {
  it("shows the English copy, the same scope statement and the English confirmation", async () => {
    server(createdReply("attending", 1));
    show(undefined, "en");
    await screen.findByLabelText("Family / group name");
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByText("This RSVP is for the Walimatulurus celebration only.")).toBeTruthy();
    expect(screen.getByText("RSVP closes on 20 December 2026.")).toBeTruthy();
    expect(screen.getByText("Maximum 2 people.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Family / group name"), { target: { value: "The Ahmad Family" } });
    fireEvent.click(screen.getByRole("button", { name: "Send RSVP" }));
    expect(await screen.findByRole("heading", { name: "Thank you" })).toBeTruthy();
    expect(screen.getByText("Your RSVP for the Walimatulurus celebration has been received.")).toBeTruthy();
  });
});
