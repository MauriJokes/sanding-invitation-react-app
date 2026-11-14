import { vi } from "vitest";

export const VALID_INVITE = "k7Qm2-xV9pLr4TnB8wZc_Hd3";
export const STALE_INVITE = "an-older-invite-code-12345";

export interface Call {
  path: string;
  body: Record<string, unknown>;
}
export interface Reply {
  status: number;
  json?: unknown;
  raw?: string;
}
type Responder = (call: Call, index: number) => Reply | Promise<Reply> | Error | Promise<Error>;

/** Replaces fetch. Records every call so tests can assert exactly what the browser sent. */
export function mockFetch(responder: Responder): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const raw = typeof init?.body === "string" ? init.body : "{}";
      const call: Call = { path: input, body: JSON.parse(raw) as Record<string, unknown> };
      calls.push(call);
      const reply = await responder(call, calls.length - 1);
      if (reply instanceof Error) throw reply;
      return new Response(reply.raw ?? JSON.stringify(reply.json ?? {}), {
        status: reply.status,
        headers: { "content-type": "application/json" },
      });
    }),
  );
  return calls;
}

export const configReply = (maxAttendees: number, rsvpOpen = true): Reply => ({
  status: 200,
  json: { data: { maxAttendees, rsvpOpen }, error: null },
});
export const createdReply = (status: "attending" | "declined", attendeeCount: number): Reply => ({
  status: 201,
  json: { data: { status, attendeeCount }, error: null },
});
export const errorReply = (status: number, code: string, fields?: string[]): Reply => ({
  status,
  json: { data: null, error: { code, message: "ignored by the UI", ...(fields ? { fields } : {}) } },
});

/** Config answers 10 for the valid invite and 2 for anything else, like the real server. */
export const serverConfig = (call: Call): Reply =>
  configReply(call.body.invite === VALID_INVITE ? 10 : 2);

export const rsvpCalls = (calls: Call[]) => calls.filter((c) => c.path === "/api/rsvp");
export const configCalls = (calls: Call[]) => calls.filter((c) => c.path === "/api/rsvp/config");

export class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}
