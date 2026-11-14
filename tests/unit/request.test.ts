import { describe, expect, it } from "vitest";
import { AppError } from "../../server/http/errors";
import { getClientIp, readJsonBody } from "../../server/http/request";

const post = (body: BodyInit | null, headers: Record<string, string> = { "content-type": "application/json" }) =>
  new Request("https://example.test/api/x", { method: "POST", headers, body });

async function code(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return "no error";
  } catch (error) {
    return error instanceof AppError ? `${error.status} ${error.code}` : "other error";
  }
}

describe("readJsonBody", () => {
  it("parses a JSON body, with or without a charset", async () => {
    expect(await readJsonBody(post('{"a":1}'))).toEqual({ a: 1 });
    expect(await readJsonBody(post('{"a":1}', { "content-type": "application/json; charset=utf-8" }))).toEqual({ a: 1 });
  });

  it.each([
    ["missing", {}],
    ["form encoded", { "content-type": "application/x-www-form-urlencoded" }],
    ["text/plain (a CORS-simple type)", { "content-type": "text/plain" }],
    ["lookalike", { "content-type": "application/jsonp" }],
  ])("rejects a %s content type with 415", async (_name, headers) => {
    expect(await code(readJsonBody(post('{"a":1}', headers)))).toBe("415 UNSUPPORTED_MEDIA_TYPE");
  });

  it("rejects a body that declares too large a size before reading it", async () => {
    const request = post("{}", { "content-type": "application/json", "content-length": "99999" });
    expect(await code(readJsonBody(request, 100))).toBe("413 PAYLOAD_TOO_LARGE");
  });

  it("stops reading a streamed body that exceeds the limit even without a content-length", async () => {
    const chunk = new TextEncoder().encode("x".repeat(60));
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++;
        controller.enqueue(chunk);
        if (pulled > 50) controller.close();
      },
    });
    const request = new Request("https://example.test/api/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit);
    expect(await code(readJsonBody(request, 100))).toBe("413 PAYLOAD_TOO_LARGE");
    expect(pulled).toBeLessThan(10);
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["empty body", ""],
  ])("rejects %s with 400", async (_name, body) => {
    expect(await code(readJsonBody(post(body)))).toBe("400 BAD_REQUEST");
  });

  it("rejects invalid UTF-8 with 400", async () => {
    const bad = new Uint8Array([0x7b, 0x22, 0xff, 0xfe, 0x22, 0x3a, 0x31, 0x7d]);
    expect(await code(readJsonBody(post(bad)))).toBe("400 BAD_REQUEST");
  });
});

describe("getClientIp", () => {
  it("prefers x-real-ip, then the first x-forwarded-for entry, then unknown", () => {
    const req = (headers: Record<string, string>) => new Request("https://example.test", { headers });
    expect(getClientIp(req({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe("1.2.3.4");
    expect(getClientIp(req({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(getClientIp(req({}))).toBe("unknown");
  });
});
