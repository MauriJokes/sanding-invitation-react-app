// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuestbookSection } from "../../../src/features/guestbook/GuestbookSection";
import { I18nProvider } from "../../../src/i18n/I18nProvider";
import { strings, type Lang } from "../../../src/i18n/strings";
import {
  errorReply,
  mockFetch,
  simulateTranslator,
  type Call,
  type Reply,
} from "../rsvp/helpers";
import { stubDialog } from "./dom";
import { embla } from "./fakeEmbla";

vi.mock("embla-carousel-react", async () => ({
  default: (await import("./fakeEmbla")).default,
}));

const ms = strings.ms;
const en = strings.en;

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
const pageReply = (
  entries: Entry[],
  nextCursor: string | null = null,
): Reply => ({
  status: 200,
  json: { data: { entries, nextCursor }, error: null },
});
const publishedReply = (published: boolean): Reply => ({
  status: 201,
  json: { data: { published }, error: null },
});

const show = (lang: Lang = "ms") =>
  render(
    <I18nProvider initialLang={lang}>
      <GuestbookSection />
    </I18nProvider>,
  );
const gets = (calls: Call[]) => calls.filter((c) => c.method === "GET");
const posts = (calls: Call[]) => calls.filter((c) => c.method === "POST");

/** Serves the list and answers submissions with `post`. */
function server(
  list: Reply | ((call: Call, n: number) => Reply),
  post:
    | Reply
    | ((
        call: Call,
        n: number,
      ) => Reply | Promise<Reply> | Error) = publishedReply(true),
) {
  let listCalls = 0;
  let postCalls = 0;
  return mockFetch((call) =>
    call.method === "GET"
      ? typeof list === "function"
        ? list(call, listCalls++)
        : list
      : typeof post === "function"
        ? post(call, postCalls++)
        : post,
  );
}

const dialog = () => document.querySelector("dialog");
const openButton = (lang: "ms" | "en" = "ms") =>
  screen.getByRole("button", { name: strings[lang].guestbookOpen });
/** Opens the pop-up with the form. */
const openForm = (lang: "ms" | "en" = "ms") =>
  fireEvent.click(openButton(lang));
const nameInput = () =>
  screen.getByLabelText<HTMLInputElement>(ms.guestbookNameLabel);
const messageInput = () =>
  screen.getByLabelText<HTMLTextAreaElement>(ms.guestbookMessageLabel);
const anonBox = () =>
  screen.getByLabelText<HTMLInputElement>(ms.guestbookAnonymous);
const sendBtn = () =>
  screen.getByRole("button", {
    name: (name) => [ms.guestbookSend, ms.sending].includes(name),
  });
const type = (el: HTMLElement, value: string) =>
  fireEvent.change(el, { target: { value } });
const alerts = () =>
  screen
    .getAllByRole("alert")
    .map((a) => a.textContent ?? "")
    .filter(Boolean);
const slides = () =>
  Array.from(document.querySelectorAll("[aria-roledescription=slide]"));
const slideText = () =>
  slides().map((slide) => slide.querySelector("blockquote")?.textContent);

beforeEach(() => stubDialog());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("translated-ltr");
});

describe("the slider", () => {
  it("shows a loading state, then the wishes newest first, each with its name and position", async () => {
    server(pageReply([wish(2), wish(1)]));
    show();
    expect(screen.getByText(ms.guestbookLoading)).toBeTruthy();
    await screen.findByRole("region", { name: ms.guestbookListLabel });
    expect(slideText()).toEqual(["Wish 2", "Wish 1"]);
    expect(
      slides().map((slide) => slide.querySelector("figcaption")?.textContent),
    ).toEqual(["Guest 2", "Guest 1"]);
    expect(slides().map((slide) => slide.getAttribute("aria-label"))).toEqual([
      ms.guestbookSlideLabel(1, 2),
      ms.guestbookSlideLabel(2, 2),
    ]);
  });

  it("is no longer a list with a load-more button", async () => {
    server(pageReply([wish(2), wish(1)]));
    show();
    await screen.findByRole("region", { name: ms.guestbookListLabel });
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("shows an invitation to be first, and no slider, when there are no wishes", async () => {
    server(pageReply([]));
    show();
    expect(await screen.findByText(ms.guestbookEmpty)).toBeTruthy();
    expect(
      screen.queryByRole("region", { name: ms.guestbookListLabel }),
    ).toBeNull();
    expect(slides()).toHaveLength(0);
    expect(openButton()).toBeTruthy();
  });

  it("shows no arrows, counter or pause button for a single wish", async () => {
    server(pageReply([wish(1)]));
    show();
    await screen.findByText("Wish 1");
    expect(screen.queryByRole("button", { name: ms.guestbookNext })).toBeNull();
    expect(
      screen.queryByRole("button", { name: ms.guestbookPause }),
    ).toBeNull();
  });

  it("renders everything a guest wrote as plain text, keeping line breaks", async () => {
    server(
      pageReply([
        wish(1, {
          message: "<img src=x onerror=alert(1)>\nline two",
          displayName: "<b>Bold</b>",
        }),
      ]),
    );
    const { container } = show();
    await screen.findByRole("region", { name: ms.guestbookListLabel });
    expect(container.querySelector("img, b, script")).toBeNull();
    const slide = slides()[0] as HTMLElement;
    expect(slide.textContent).toContain(
      "<img src=x onerror=alert(1)>\nline two",
    );
    expect(slide.textContent).toContain("<b>Bold</b>");
    expect(slide.querySelector("blockquote")?.className).toContain(
      "whitespace-pre-wrap",
    );
  });

  it("offers a retry when the wishes cannot be loaded, then shows them", async () => {
    let n = 0;
    server(() =>
      n++ === 0 ? errorReply(500, "INTERNAL_ERROR") : pageReply([wish(1)]),
    );
    show();
    expect(await screen.findByText(ms.guestbookLoadFailed)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: ms.retry }));
    expect(await screen.findByText("Wish 1")).toBeTruthy();
  });

  it("treats a malformed list response as 'could not be loaded', never a crash", async () => {
    server({
      status: 200,
      json: {
        data: { entries: [{ nope: true }], nextCursor: null },
        error: null,
      },
    });
    show();
    expect(await screen.findByText(ms.guestbookLoadFailed)).toBeTruthy();
    expect(openButton()).toBeTruthy();
  });

  it("keeps the button to leave a wish while the list is loading or has failed", async () => {
    server(errorReply(500, "INTERNAL_ERROR"));
    show();
    expect(openButton()).toBeTruthy();
    await screen.findByText(ms.guestbookLoadFailed);
    expect(openButton()).toBeTruthy();
  });
});

describe("loading older wishes", () => {
  it("fetches the next page by itself when the wish on screen is near the end, and then stops", async () => {
    const calls = server((call) =>
      call.path.includes("cursor")
        ? pageReply([wish(1)])
        : pageReply([wish(3), wish(2)], CURSOR),
    );
    show();
    await waitFor(() =>
      expect(slideText()).toEqual(["Wish 3", "Wish 2", "Wish 1"]),
    );
    expect(gets(calls)[1]?.path).toBe(
      `/api/guestbook?cursor=${encodeURIComponent(CURSOR)}`,
    );
    expect(gets(calls)).toHaveLength(2);
  });

  it("fetches the next page only once while it is loading", async () => {
    let release: (r: Reply) => void = () => undefined;
    const calls = mockFetch((call, index) =>
      index === 0 && call.method === "GET"
        ? pageReply([wish(2)], CURSOR)
        : new Promise<Reply>((resolve) => (release = resolve)),
    );
    show();
    await screen.findByText("Wish 2");
    await waitFor(() => expect(gets(calls)).toHaveLength(2));
    act(() => void embla.api?.emit("reInit"));
    release(pageReply([wish(1)]));
    await screen.findByText("Wish 1");
    expect(gets(calls)).toHaveLength(2);
  });

  it("keeps what is shown, says so and lets the guest try again when the next page fails", async () => {
    let n = 0;
    server((call) => {
      if (!call.path.includes("cursor")) return pageReply([wish(2)], CURSOR);
      return n++ === 0
        ? errorReply(503, "INTERNAL_ERROR")
        : pageReply([wish(1)]);
    });
    show();
    expect(await screen.findByText(ms.guestbookLoadFailed)).toBeTruthy();
    expect(screen.getByText("Wish 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: ms.retry }));
    expect(await screen.findByText("Wish 1")).toBeTruthy();
    expect(screen.queryByText(ms.guestbookLoadFailed)).toBeNull();
  });
});

describe("the pop-up", () => {
  it("is closed until the guest asks for it, then is a modal dialog labelled by its title", async () => {
    server(pageReply([]));
    show();
    await screen.findByText(ms.guestbookEmpty);
    expect(dialog()?.hasAttribute("open")).toBe(false);
    expect(screen.queryByLabelText(ms.guestbookMessageLabel)).toBeNull();
    openForm();
    expect(dialog()?.hasAttribute("open")).toBe(true);
    const title = screen.getByRole("heading", {
      name: ms.guestbookDialogTitle,
    });
    expect(dialog()?.getAttribute("aria-labelledby")).toBe(title.id);
  });

  it("puts the cursor in the name field when it opens", async () => {
    server(pageReply([]));
    show();
    await screen.findByText(ms.guestbookEmpty);
    openForm();
    expect(document.activeElement).toBe(nameInput());
  });

  it("closes with the close button, when the browser closes it (Escape), and on a click on the backdrop", async () => {
    server(pageReply([]));
    show();
    await screen.findByText(ms.guestbookEmpty);

    openForm();
    fireEvent.click(screen.getByRole("button", { name: ms.guestbookClose }));
    expect(dialog()?.hasAttribute("open")).toBe(false);

    openForm();
    act(() => void dialog()?.dispatchEvent(new Event("close")));
    expect(dialog()?.hasAttribute("open")).toBe(false);

    openForm();
    fireEvent.click(messageInput());
    expect(dialog()?.hasAttribute("open")).toBe(true);
    fireEvent.click(dialog() as HTMLDialogElement);
    expect(dialog()?.hasAttribute("open")).toBe(false);
  });

  it("starts empty every time it is opened", async () => {
    server(pageReply([]));
    show();
    await screen.findByText(ms.guestbookEmpty);
    openForm();
    type(nameInput(), "Aisyah");
    type(messageInput(), "Draft");
    fireEvent.click(screen.getByRole("button", { name: ms.guestbookClose }));
    openForm();
    expect(nameInput().value).toBe("");
    expect(messageInput().value).toBe("");
  });

  it("explains in advance that an anonymous wish is not displayed", async () => {
    server(pageReply([]));
    show();
    await screen.findByText(ms.guestbookEmpty);
    openForm();
    expect(screen.getByText(ms.guestbookAnonymousHint)).toBeTruthy();
    expect(anonBox().getAttribute("aria-describedby")).toBeTruthy();
  });
});

describe("validation in the browser", () => {
  async function ready() {
    const calls = server(pageReply([]));
    show();
    await screen.findByText(ms.guestbookEmpty);
    openForm();
    return calls;
  }

  it("requires a name: explains why, links the message to the field, focuses it and does not call the server", async () => {
    const calls = await ready();
    type(messageInput(), "Hi");
    fireEvent.click(sendBtn());
    const field = nameInput();
    expect(field.required).toBe(true);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    const message = screen.getByText(ms.guestbookNameRequired);
    expect(field.getAttribute("aria-describedby")?.split(" ")).toContain(
      message.id,
    );
    expect(document.activeElement).toBe(field);
    expect(posts(calls)).toHaveLength(0);
  });

  it("treats a whitespace-only name as missing and clears the error on editing", async () => {
    await ready();
    type(nameInput(), "   ");
    type(messageInput(), "Hi");
    fireEvent.click(sendBtn());
    expect(screen.getByText(ms.guestbookNameRequired)).toBeTruthy();
    type(nameInput(), "A");
    expect(screen.queryByText(ms.guestbookNameRequired)).toBeNull();
    expect(nameInput().getAttribute("aria-invalid")).toBeNull();
  });

  it("blocks an empty wish, explains why, links the message to the field and focuses it", async () => {
    const calls = await ready();
    type(nameInput(), "Aisyah");
    fireEvent.click(sendBtn());
    const field = messageInput();
    expect(field.getAttribute("aria-invalid")).toBe("true");
    const message = screen.getByText(ms.guestbookMessageRequired);
    expect(field.getAttribute("aria-describedby")?.split(" ")).toContain(
      message.id,
    );
    expect(document.activeElement).toBe(field);
    expect(posts(calls)).toHaveLength(0);
  });

  it("treats a whitespace-only wish as empty and clears the error on editing", async () => {
    await ready();
    type(nameInput(), "Aisyah");
    type(messageInput(), "  \n \t ");
    fireEvent.click(sendBtn());
    expect(screen.getByText(ms.guestbookMessageRequired)).toBeTruthy();
    type(messageInput(), "Hi");
    expect(screen.queryByText(ms.guestbookMessageRequired)).toBeNull();
    expect(messageInput().getAttribute("aria-invalid")).toBeNull();
  });

  it.each([
    ["too long", "x".repeat(501), ms.guestbookMessageTooLong(500)],
    [
      "with a zero-width character",
      "Hi\u200bthere",
      ms.guestbookMessageInvalid,
    ],
  ])(
    "rejects a wish that is %s without calling the server",
    async (_name, text, expected) => {
      const calls = await ready();
      type(nameInput(), "Aisyah");
      type(messageInput(), text);
      fireEvent.click(sendBtn());
      expect(screen.getByText(expected)).toBeTruthy();
      expect(posts(calls)).toHaveLength(0);
    },
  );

  it("rejects an over-long or invalid name and focuses the name field first", async () => {
    const calls = await ready();
    type(nameInput(), "n".repeat(61));
    type(messageInput(), "Hi");
    fireEvent.click(sendBtn());
    expect(screen.getByText(ms.nameTooLong(60))).toBeTruthy();
    expect(document.activeElement).toBe(nameInput());
    expect(posts(calls)).toHaveLength(0);
    type(nameInput(), "Ai\u200bsyah");
    fireEvent.click(sendBtn());
    expect(screen.getByText(ms.nameInvalid)).toBeTruthy();
  });

  it("shows how many characters have been used", async () => {
    await ready();
    expect(screen.getByText("0/500")).toBeTruthy();
    type(messageInput(), "Selamat");
    expect(screen.getByText("7/500")).toBeTruthy();
  });
});

describe("submitting", () => {
  it("publishes a named wish: sends the cleaned values, thanks the guest, refreshes the list and returns the slider to the newest wish on close", async () => {
    let listCalls = 0;
    const calls = server(
      () =>
        pageReply(
          listCalls++ === 0
            ? [wish(1)]
            : [
                wish(9, { displayName: "Aisyah", message: "Selamat!" }),
                wish(1),
              ],
        ),
      publishedReply(true),
    );
    show();
    await screen.findByText("Wish 1");
    openForm();
    type(nameInput(), "  Aisyah   Nik ");
    type(messageInput(), "  Selamat!\r\n\r\n\r\n\r\nSemoga bahagia  ");
    fireEvent.click(sendBtn());

    expect(await screen.findByText(ms.guestbookPublished)).toBeTruthy();
    expect(posts(calls)[0]?.body).toEqual({
      displayName: "Aisyah Nik",
      anonymous: false,
      message: "Selamat!\n\nSemoga bahagia",
      homepage: "",
    });
    expect(screen.queryByLabelText(ms.guestbookMessageLabel)).toBeNull();
    expect(await screen.findByText("Selamat!")).toBeTruthy();
    expect(gets(calls)).toHaveLength(2);

    expect(embla.api?.scrollTo).not.toHaveBeenCalled();
    fireEvent.click(
      screen
        .getAllByRole("button", { name: ms.guestbookClose })
        .at(-1) as HTMLElement,
    );
    expect(dialog()?.hasAttribute("open")).toBe(false);
    expect(embla.api?.scrollTo).toHaveBeenCalledWith(0, false);
  });

  it("keeps a private wish private: the name is still sent for the couple, 'only the couple' notice, list not refreshed, slider left alone", async () => {
    const calls = server(pageReply([wish(1)]), publishedReply(false));
    show();
    await screen.findByText("Wish 1");
    openForm();
    type(nameInput(), "Aisyah");
    fireEvent.click(anonBox());
    type(messageInput(), "Secret");
    fireEvent.click(sendBtn());
    expect(await screen.findByText(ms.guestbookPrivate)).toBeTruthy();
    expect(posts(calls)[0]?.body).toEqual({
      displayName: "Aisyah",
      anonymous: true,
      message: "Secret",
      homepage: "",
    });
    expect(gets(calls)).toHaveLength(1);
    fireEvent.click(
      screen
        .getAllByRole("button", { name: ms.guestbookClose })
        .at(-1) as HTMLElement,
    );
    expect(embla.api?.scrollTo).not.toHaveBeenCalled();
  });

  it("sends one request for a double click and disables the button while waiting", async () => {
    let release: (r: Reply) => void = () => undefined;
    const calls = server(
      pageReply([]),
      () => new Promise<Reply>((resolve) => (release = resolve)),
    );
    show();
    await screen.findByText(ms.guestbookEmpty);
    openForm();
    type(nameInput(), "A");
    type(messageInput(), "Hi");
    const form = sendBtn().closest("form") as HTMLFormElement;
    fireEvent.click(sendBtn());
    // Enter in a field submits the form without going through the (now disabled) button.
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() =>
      expect((sendBtn() as HTMLButtonElement).disabled).toBe(true),
    );
    expect(sendBtn().textContent).toBe(ms.sending);
    expect(sendBtn().getAttribute("aria-busy")).toBe("true");
    release(publishedReply(true));
    await screen.findByText(ms.guestbookPublished);
    expect(posts(calls)).toHaveLength(1);
  });

  it.each([
    [
      "rate limited",
      () => errorReply(429, "RATE_LIMITED"),
      ms.errorRateLimited,
    ],
    [
      "rejected by the server",
      () => errorReply(400, "VALIDATION_ERROR"),
      ms.errorValidation,
    ],
    [
      "a server error",
      () => errorReply(500, "INTERNAL_ERROR"),
      ms.guestbookErrorFailed,
    ],
    [
      "a dropped connection",
      () => new TypeError("offline") as unknown as Reply,
      ms.guestbookErrorFailed,
    ],
  ])(
    "%s: says so and keeps what the guest wrote",
    async (_name, reply, expected) => {
      server(pageReply([]), reply);
      show();
      await screen.findByText(ms.guestbookEmpty);
      openForm();
      type(nameInput(), "Aisyah");
      type(messageInput(), "Hello there");
      fireEvent.click(sendBtn());
      await waitFor(() => expect(alerts()).toContain(expected));
      expect(messageInput().value).toBe("Hello there");
      expect(nameInput().value).toBe("Aisyah");
      expect(screen.queryByText(ms.guestbookPublished)).toBeNull();
      expect(dialog()?.hasAttribute("open")).toBe(true);
    },
  );

  it("lets the guest retry after a failure and clears the failure message on success", async () => {
    server(pageReply([]), (_call, n) =>
      n === 0 ? errorReply(503, "INTERNAL_ERROR") : publishedReply(true),
    );
    show();
    await screen.findByText(ms.guestbookEmpty);
    openForm();
    type(nameInput(), "A");
    type(messageInput(), "Hi");
    fireEvent.click(sendBtn());
    await waitFor(() => expect(alerts()).toContain(ms.guestbookErrorFailed));
    fireEvent.click(sendBtn());
    await screen.findByText(ms.guestbookPublished);
    expect(screen.queryByText(ms.guestbookErrorFailed)).toBeNull();
  });
});

describe("the spam trap", () => {
  it("is invisible to assistive technology and the tab order, and a person leaves it empty", async () => {
    const calls = server(pageReply([]));
    const { container } = show();
    await screen.findByText(ms.guestbookEmpty);
    openForm();
    const trap = container.querySelector<HTMLInputElement>(
      'input[name="homepage"]',
    );
    expect(trap).not.toBeNull();
    expect(trap?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(trap?.tabIndex).toBe(-1);
    expect(trap?.getAttribute("autocomplete")).toBe("off");
    // getByLabelText ignores aria-hidden, so check the accessibility tree instead.
    expect(
      screen.queryByRole("textbox", { name: "Leave this field empty" }),
    ).toBeNull();
    type(nameInput(), "Aisyah");
    type(messageInput(), "Hi");
    fireEvent.click(sendBtn());
    await waitFor(() => expect(posts(calls)).toHaveLength(1));
    expect(posts(calls)[0]?.body.homepage).toBe("");
  });

  it("passes whatever a bot typed in it to the server, which rejects it", async () => {
    const calls = server(pageReply([]));
    const { container } = show();
    await screen.findByText(ms.guestbookEmpty);
    openForm();
    const trap = container.querySelector<HTMLInputElement>(
      'input[name="homepage"]',
    );
    if (!trap) throw new Error("spam trap missing");
    type(trap, "http://spam.example");
    type(nameInput(), "Spammer");
    type(messageInput(), "Buy now");
    fireEvent.click(sendBtn());
    await waitFor(() => expect(posts(calls)).toHaveLength(1));
    expect(posts(calls)[0]?.body.homepage).toBe("http://spam.example");
  });
});

describe("English", () => {
  it("shows the English copy for the slider, the pop-up and the thank-you", async () => {
    server(pageReply([wish(1)]), publishedReply(true));
    show("en");
    expect(
      await screen.findByRole("region", { name: en.guestbookListLabel }),
    ).toBeTruthy();
    expect(screen.getByText(en.guestbookLead)).toBeTruthy();
    openForm("en");
    expect(
      screen.getByRole("heading", { name: en.guestbookDialogTitle }),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText(en.guestbookNameLabel), {
      target: { value: "Aisyah" },
    });
    fireEvent.change(screen.getByLabelText(en.guestbookMessageLabel), {
      target: { value: "Congratulations" },
    });
    fireEvent.click(screen.getByRole("button", { name: en.guestbookSend }));
    expect(await screen.findByText(en.guestbookPublished)).toBeTruthy();
  });
});

describe("when the browser machine-translates the page", () => {
  it("still validates, submits and shows the thank-you", async () => {
    server(pageReply([wish(2)]), publishedReply(false));
    const { container } = show();
    await screen.findByText("Wish 2");
    openForm();
    simulateTranslator(container);

    fireEvent.click(sendBtn());
    expect(container.querySelector("form")).not.toBeNull();
    expect(screen.getByText(ms.guestbookNameRequired)).toBeTruthy();
    type(nameInput(), "Aisyah");
    fireEvent.click(sendBtn());
    expect(screen.getByText(ms.guestbookMessageRequired)).toBeTruthy();
    fireEvent.click(anonBox());
    type(messageInput(), "Hello");
    fireEvent.click(sendBtn());
    expect(await screen.findByText(ms.guestbookPrivate)).toBeTruthy();
  });
});
