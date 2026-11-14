// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuestbookSection } from "../../../src/features/guestbook/GuestbookSection";
import { I18nProvider } from "../../../src/i18n/I18nProvider";
import type { Lang } from "../../../src/i18n/strings";
import { errorReply, mockFetch, simulateTranslator, type Call, type Reply } from "../rsvp/helpers";

const CURSOR = `1781000000000_${"b".repeat(24)}`;
interface Entry {
  displayName: string;
  message: string;
  createdAt: string;
}
const wish = (n: number, over: Partial<Entry> = {}): Entry => ({
  displayName: `Guest ${n}`,
  message: `Wish ${n}`,
  createdAt: `2026-12-01T10:00:0${n}.000Z`,
  ...over,
});
const pageReply = (entries: Entry[], nextCursor: string | null = null): Reply => ({
  status: 200,
  json: { data: { entries, nextCursor }, error: null },
});
const publishedReply = (published: boolean): Reply => ({ status: 201, json: { data: { published }, error: null } });

const show = (lang: Lang = "ms") => render(<I18nProvider initialLang={lang}>{<GuestbookSection />}</I18nProvider>);
const gets = (calls: Call[]) => calls.filter((c) => c.method === "GET");
const posts = (calls: Call[]) => calls.filter((c) => c.method === "POST");

/** Serves the list and answers submissions with `post`. */
function server(list: Reply | ((call: Call, n: number) => Reply), post: Reply | ((call: Call, n: number) => Reply | Promise<Reply> | Error) = publishedReply(true)) {
  let listCalls = 0;
  let postCalls = 0;
  return mockFetch((call) => (call.method === "GET" ? (typeof list === "function" ? list(call, listCalls++) : list) : typeof post === "function" ? post(call, postCalls++) : post));
}

const nameInput = () => screen.getByLabelText<HTMLInputElement>("Nama (pilihan)");
const messageInput = () => screen.getByLabelText<HTMLTextAreaElement>("Ucapan anda");
const anonBox = () => screen.getByLabelText<HTMLInputElement>("Hantar tanpa nama");
const sendBtn = () => screen.getByRole("button", { name: /Hantar Ucapan|Menghantar/ });
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const alerts = () => screen.getAllByRole("alert").map((a) => a.textContent ?? "").filter(Boolean);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("translated-ltr");
});

describe("the list", () => {
  it("shows a loading state, then the wishes newest first with names", async () => {
    server(pageReply([wish(2), wish(1)]));
    show();
    expect(screen.getByText("Memuatkan ucapan…")).toBeTruthy();
    const items = within(await screen.findByRole("list", { name: "Ucapan daripada tetamu" })).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["Wish 2Guest 2", "Wish 1Guest 1"]);
  });

  it("shows an invitation to be first when there are no wishes", async () => {
    server(pageReply([]));
    show();
    expect(await screen.findByText("Belum ada ucapan. Jadilah yang pertama!")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("button", { name: "Muat lagi" })).toBeNull();
  });

  it("renders everything a guest wrote as plain text, keeping line breaks", async () => {
    server(pageReply([wish(1, { message: "<img src=x onerror=alert(1)>\nline two", displayName: "<b>Bold</b>" })]));
    const { container } = show();
    await screen.findByRole("list");
    expect(container.querySelector("img, b, script")).toBeNull();
    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("<img src=x onerror=alert(1)>\nline two");
    expect(item.textContent).toContain("<b>Bold</b>");
    expect(item.querySelector("p")?.className).toContain("whitespace-pre-wrap");
  });

  it("offers a retry when the wishes cannot be loaded, then shows them", async () => {
    let n = 0;
    server(() => (n++ === 0 ? errorReply(500, "INTERNAL_ERROR") : pageReply([wish(1)])));
    show();
    expect(await screen.findByText("Ucapan tidak dapat dimuatkan.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cuba lagi" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cuba lagi" }));
    expect(await screen.findByText("Wish 1")).toBeTruthy();
  });

  it("treats a malformed list response as 'could not be loaded', never a crash", async () => {
    server({ status: 200, json: { data: { entries: [{ nope: true }], nextCursor: null }, error: null } });
    show();
    expect(await screen.findByText("Ucapan tidak dapat dimuatkan.")).toBeTruthy();
    expect(screen.getByLabelText("Ucapan anda")).toBeTruthy();
  });

  it("keeps the form usable while the list is loading or has failed", async () => {
    server(errorReply(500, "INTERNAL_ERROR"));
    show();
    expect(nameInput()).toBeTruthy();
    expect(sendBtn()).toBeTruthy();
    await screen.findByText("Ucapan tidak dapat dimuatkan.");
    expect(sendBtn()).toBeTruthy();
  });
});

describe("load more", () => {
  it("appends the next page using the cursor, then removes the button at the end", async () => {
    const calls = server((call) => (call.path.includes("cursor") ? pageReply([wish(1)]) : pageReply([wish(3), wish(2)], CURSOR)));
    show();
    await screen.findByText("Wish 3");
    fireEvent.click(screen.getByRole("button", { name: "Muat lagi" }));
    await screen.findByText("Wish 1");
    expect(gets(calls)[1]?.path).toBe(`/api/guestbook?cursor=${encodeURIComponent(CURSOR)}`);
    expect(screen.getAllByRole("listitem").map((li) => li.querySelector("p")?.textContent)).toEqual(["Wish 3", "Wish 2", "Wish 1"]);
    expect(screen.queryByRole("button", { name: "Muat lagi" })).toBeNull();
  });

  it("disables the button while loading and fetches the page only once", async () => {
    let release: (r: Reply) => void = () => undefined;
    const calls = mockFetch(
      (call, index) => (index === 0 && call.method === "GET" ? pageReply([wish(2)], CURSOR) : new Promise<Reply>((resolve) => (release = resolve))),
    );
    show();
    await screen.findByText("Wish 2");
    const button = screen.getByRole("button", { name: "Muat lagi" });
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole<HTMLButtonElement>("button", { name: "Memuatkan ucapan…" }).disabled).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: "Memuatkan ucapan…" }));
    release(pageReply([wish(1)]));
    await screen.findByText("Wish 1");
    expect(gets(calls)).toHaveLength(2);
  });

  it("keeps what is shown, says so and lets the guest try again when the next page fails", async () => {
    let n = 0;
    server((call) => {
      if (!call.path.includes("cursor")) return pageReply([wish(2)], CURSOR);
      return n++ === 0 ? errorReply(503, "INTERNAL_ERROR") : pageReply([wish(1)]);
    });
    show();
    await screen.findByText("Wish 2");
    fireEvent.click(screen.getByRole("button", { name: "Muat lagi" }));
    expect(await screen.findByText("Ucapan tidak dapat dimuatkan.")).toBeTruthy();
    expect(screen.getByText("Wish 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Muat lagi" }));
    expect(await screen.findByText("Wish 1")).toBeTruthy();
  });
});

describe("validation in the browser", () => {
  async function ready() {
    const calls = server(pageReply([]));
    show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    return calls;
  }

  it("blocks an empty wish, explains why, links the message to the field and focuses it", async () => {
    const calls = await ready();
    fireEvent.click(sendBtn());
    const field = messageInput();
    expect(field.getAttribute("aria-invalid")).toBe("true");
    const message = screen.getByText("Sila tulis ucapan anda.");
    expect(field.getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
    expect(document.activeElement).toBe(field);
    expect(posts(calls)).toHaveLength(0);
  });

  it("treats a whitespace-only wish as empty and clears the error on editing", async () => {
    await ready();
    type(messageInput(), "  \n \t ");
    fireEvent.click(sendBtn());
    expect(screen.getByText("Sila tulis ucapan anda.")).toBeTruthy();
    type(messageInput(), "Hi");
    expect(screen.queryByText("Sila tulis ucapan anda.")).toBeNull();
    expect(messageInput().getAttribute("aria-invalid")).toBeNull();
  });

  it.each([
    ["too long", "x".repeat(501), /terlalu panjang \(maksimum 500 aksara\)/],
    ["with a zero-width character", "Hi\u200bthere", /aksara yang tidak dibenarkan/],
  ])("rejects a wish that is %s without calling the server", async (_name, text, expected) => {
    const calls = await ready();
    type(messageInput(), text);
    fireEvent.click(sendBtn());
    expect(screen.getByText(expected)).toBeTruthy();
    expect(posts(calls)).toHaveLength(0);
  });

  it("rejects an over-long or invalid name and focuses the name field first", async () => {
    const calls = await ready();
    type(nameInput(), "n".repeat(61));
    type(messageInput(), "Hi");
    fireEvent.click(sendBtn());
    expect(screen.getByText("Nama terlalu panjang (maksimum 60 aksara).")).toBeTruthy();
    expect(document.activeElement).toBe(nameInput());
    expect(posts(calls)).toHaveLength(0);
    type(nameInput(), "Ai\u200bsyah");
    fireEvent.click(sendBtn());
    expect(screen.getByText("Nama mengandungi aksara yang tidak dibenarkan.")).toBeTruthy();
  });

  it("shows how many characters have been used", async () => {
    await ready();
    expect(screen.getByText("0/500")).toBeTruthy();
    type(messageInput(), "Selamat");
    expect(screen.getByText("7/500")).toBeTruthy();
  });
});

describe("submitting", () => {
  it("publishes a named wish: sends the cleaned values, shows the 'displayed' notice, empties the message and refreshes the list", async () => {
    let listCalls = 0;
    const calls = server(() => pageReply(listCalls++ === 0 ? [] : [wish(9, { displayName: "Aisyah", message: "Selamat!" })]), publishedReply(true));
    show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    type(nameInput(), "  Aisyah   Nik ");
    type(messageInput(), "  Selamat!\r\n\r\n\r\n\r\nSemoga bahagia  ");
    fireEvent.click(sendBtn());

    expect(await screen.findByText("Terima kasih! Ucapan anda telah dipaparkan.")).toBeTruthy();
    expect(posts(calls)[0]?.body).toEqual({ displayName: "Aisyah Nik", anonymous: false, message: "Selamat!\n\nSemoga bahagia", homepage: "" });
    expect(messageInput().value).toBe("");
    expect(nameInput().value).toBe("  Aisyah   Nik ");
    expect(await screen.findByText("Selamat!")).toBeTruthy();
    expect(gets(calls)).toHaveLength(2);
  });

  it("keeps a wish without a name private: no name sent, 'only the couple' notice, list not refreshed", async () => {
    const calls = server(pageReply([]), publishedReply(false));
    show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    type(messageInput(), "Secret");
    fireEvent.click(sendBtn());
    expect(await screen.findByText("Terima kasih! Ucapan anda telah diterima dan hanya dilihat oleh pasangan.")).toBeTruthy();
    expect(posts(calls)[0]?.body).toEqual({ anonymous: false, message: "Secret", homepage: "" });
    expect(gets(calls)).toHaveLength(1);
  });

  it("sends 'anonymous' with the name when the box is ticked", async () => {
    const calls = server(pageReply([]), publishedReply(false));
    show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    type(nameInput(), "Aisyah");
    fireEvent.click(anonBox());
    type(messageInput(), "Hi");
    fireEvent.click(sendBtn());
    await screen.findByText(/hanya dilihat oleh pasangan\./, { selector: "p" });
    expect(posts(calls)[0]?.body).toEqual({ displayName: "Aisyah", anonymous: true, message: "Hi", homepage: "" });
  });

  it("explains in advance that a blank name or an anonymous wish is not displayed", () => {
    server(pageReply([]));
    show();
    expect(screen.getByText("Jika dikosongkan, ucapan anda tidak akan dipaparkan.")).toBeTruthy();
    expect(screen.getByText("Ucapan tanpa nama hanya dilihat oleh pasangan dan tidak dipaparkan di sini.")).toBeTruthy();
    expect(anonBox().getAttribute("aria-describedby")).toBeTruthy();
  });

  it("sends one request for a double click and disables the button while waiting", async () => {
    let release: (r: Reply) => void = () => undefined;
    const calls = server(pageReply([]), () => new Promise<Reply>((resolve) => (release = resolve)));
    show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    type(nameInput(), "A");
    type(messageInput(), "Hi");
    const form = sendBtn().closest("form") as HTMLFormElement;
    fireEvent.click(sendBtn());
    // Enter in a field submits the form without going through the (now disabled) button.
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect((sendBtn() as HTMLButtonElement).disabled).toBe(true));
    expect(sendBtn().textContent).toBe("Menghantar…");
    expect(sendBtn().getAttribute("aria-busy")).toBe("true");
    release(publishedReply(true));
    await screen.findByText("Terima kasih! Ucapan anda telah dipaparkan.");
    expect(posts(calls)).toHaveLength(1);
  });

  it.each([
    ["rate limited", () => errorReply(429, "RATE_LIMITED"), "Terlalu banyak percubaan. Sila cuba lagi sebentar lagi."],
    ["rejected by the server", () => errorReply(400, "VALIDATION_ERROR"), "Sila semak jawapan anda."],
    ["a server error", () => errorReply(500, "INTERNAL_ERROR"), /Ucapan anda belum dihantar\./],
    ["a dropped connection", () => new TypeError("offline") as unknown as Reply, /Ucapan anda belum dihantar\./],
  ])("%s: says so and keeps what the guest wrote", async (_name, reply, expected) => {
    server(pageReply([]), reply);
    show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    type(nameInput(), "Aisyah");
    type(messageInput(), "Hello there");
    fireEvent.click(sendBtn());
    await waitFor(() => expect(alerts().join(" ")).toMatch(expected));
    expect(messageInput().value).toBe("Hello there");
    expect(nameInput().value).toBe("Aisyah");
    expect(screen.queryByText(/Terima kasih!/)).toBeNull();
  });

  it("lets the guest retry after a failure and clears the failure message on success", async () => {
    server(pageReply([]), (_call, n) => (n === 0 ? errorReply(503, "INTERNAL_ERROR") : publishedReply(true)));
    show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    type(nameInput(), "A");
    type(messageInput(), "Hi");
    fireEvent.click(sendBtn());
    await waitFor(() => expect(alerts().join(" ")).toMatch(/belum dihantar/));
    fireEvent.click(sendBtn());
    await screen.findByText("Terima kasih! Ucapan anda telah dipaparkan.");
    expect(alerts().join(" ")).not.toMatch(/belum dihantar/);
  });

  it("clears the previous notice when a new submission is attempted", async () => {
    server(pageReply([]), publishedReply(false));
    show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    type(messageInput(), "One");
    fireEvent.click(sendBtn());
    await screen.findByText(/hanya dilihat oleh pasangan\./, { selector: "p" });
    fireEvent.click(sendBtn());
    expect(screen.getByText("Sila tulis ucapan anda.")).toBeTruthy();
    expect(screen.queryByText(/Terima kasih!/)).toBeNull();
  });
});

describe("the spam trap", () => {
  it("is invisible to assistive technology and the tab order, and a person leaves it empty", async () => {
    const calls = server(pageReply([]));
    const { container } = show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    const trap = container.querySelector<HTMLInputElement>('input[name="homepage"]');
    expect(trap).not.toBeNull();
    expect(trap?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(trap?.tabIndex).toBe(-1);
    expect(trap?.getAttribute("autocomplete")).toBe("off");
    // getByLabelText ignores aria-hidden, so check the accessibility tree instead.
    expect(screen.queryByRole("textbox", { name: "Leave this field empty" })).toBeNull();
    type(messageInput(), "Hi");
    fireEvent.click(sendBtn());
    await waitFor(() => expect(posts(calls)).toHaveLength(1));
    expect(posts(calls)[0]?.body.homepage).toBe("");
  });

  it("passes whatever a bot typed in it to the server, which rejects it", async () => {
    const calls = server(pageReply([]));
    const { container } = show();
    await screen.findByText("Belum ada ucapan. Jadilah yang pertama!");
    const trap = container.querySelector<HTMLInputElement>('input[name="homepage"]');
    if (!trap) throw new Error("spam trap missing");
    type(trap, "http://spam.example");
    type(messageInput(), "Buy now");
    fireEvent.click(sendBtn());
    await waitFor(() => expect(posts(calls)).toHaveLength(1));
    expect(posts(calls)[0]?.body.homepage).toBe("http://spam.example");
  });
});

describe("English", () => {
  it("shows the English copy for the form, the notice and the list", async () => {
    server(pageReply([wish(1)]), publishedReply(true));
    show("en");
    expect(await screen.findByRole("list", { name: "Wishes from guests" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Name (optional)"), { target: { value: "Aisyah" } });
    fireEvent.change(screen.getByLabelText("Your wishes"), { target: { value: "Congratulations" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Wishes" }));
    expect(await screen.findByText("Thank you! Your wish is now displayed.")).toBeTruthy();
    expect(screen.getByText("Anonymous wishes are seen only by the couple and are not displayed here.")).toBeTruthy();
  });
});

describe("when the browser machine-translates the page", () => {
  it("still validates, submits, shows notices and loads more", async () => {
    server((call) => (call.path.includes("cursor") ? pageReply([wish(1)]) : pageReply([wish(2)], CURSOR)), publishedReply(false));
    const { container } = show();
    await screen.findByText("Wish 2");
    simulateTranslator(container);

    fireEvent.click(sendBtn());
    expect(container.querySelector("form")).not.toBeNull();
    expect(screen.getByText("Sila tulis ucapan anda.")).toBeTruthy();
    fireEvent.click(anonBox());
    type(messageInput(), "Hello");
    fireEvent.click(sendBtn());
    expect(await screen.findByText(/hanya dilihat oleh pasangan\./, { selector: "p" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Muat lagi" }));
    expect(await screen.findByText("Wish 1")).toBeTruthy();
    expect(container.querySelector("form")).not.toBeNull();
  });
});
