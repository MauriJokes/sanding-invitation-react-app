import { beforeEach, vi } from "vitest";

/**
 * Safety net for every test: the real Google client can never be created, so no test can reach Google,
 * whatever credentials happen to be in the environment. Tests that need the real client use vi.importActual.
 */
vi.mock("../server/sheets/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../server/sheets/client")>();
  const { fakeSheets } = await import("./fake-sheets");
  return {
    ...actual,
    getSheetsApi: () => fakeSheets,
    getWorksheetNames: () => ({ rsvp: "Family RSVP", guestbook: "Guestbook" }),
  };
});

beforeEach(async () => {
  const { fakeSheets } = await import("./fake-sheets");
  fakeSheets.reset();
});
