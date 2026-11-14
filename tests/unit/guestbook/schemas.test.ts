import { describe, expect, it } from "vitest";
import {
  DISPLAY_NAME_MAX,
  MESSAGE_MAX,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  guestbookQuerySchema,
  guestbookRequestSchema,
  normalizeMessage,
} from "../../../shared/guestbook/schemas";

const valid = { displayName: "Aisyah", message: "Selamat pengantin baru!" };

describe("limits", () => {
  it("are 60 characters for a name and 500 for a message, pages of 20 up to 50", () => {
    expect([DISPLAY_NAME_MAX, MESSAGE_MAX, PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX]).toEqual([60, 500, 20, 50]);
  });
});

describe("guestbookRequestSchema", () => {
  it("accepts a normal entry and normalises it", () => {
    const parsed = guestbookRequestSchema.parse({ displayName: "  Nik   Aisyah ", message: "  Hello\r\n\r\n\r\n\r\nworld  " });
    expect(parsed.displayName).toBe("Nik Aisyah");
    expect(parsed.message).toBe("Hello\n\nworld");
  });

  it("allows a missing name, an empty name and the anonymous flag", () => {
    expect(guestbookRequestSchema.parse({ message: "Hi" }).displayName).toBeUndefined();
    expect(guestbookRequestSchema.parse({ displayName: "   ", message: "Hi" }).displayName).toBe("");
    expect(guestbookRequestSchema.parse({ ...valid, anonymous: true }).anonymous).toBe(true);
  });

  it("keeps markup as plain text and strips unknown keys", () => {
    const parsed = guestbookRequestSchema.parse({ ...valid, message: "<script>alert(1)</script>", isPublic: true, role: "admin" });
    expect(parsed.message).toBe("<script>alert(1)</script>");
    expect(parsed).not.toHaveProperty("isPublic");
    expect(parsed).not.toHaveProperty("role");
  });

  it.each<[string, Record<string, unknown>]>([
    ["no message", { displayName: "A" }],
    ["empty message", { ...valid, message: "" }],
    ["whitespace-only message", { ...valid, message: " \n \t " }],
    ["message over 500 characters", { ...valid, message: "x".repeat(501) }],
    ["name over 60 characters", { displayName: "x".repeat(61), message: "Hi" }],
    ["zero-width character in the name", { displayName: "Ai\u200bsyah", message: "Hi" }],
    ["bidi override in the message", { ...valid, message: "Hi \u202e there" }],
    ["NUL in the message", { ...valid, message: "Hi\u0000" }],
    ["lone surrogate in the message", { ...valid, message: "Hi \ud800" }],
    ["non-string message", { ...valid, message: 42 }],
    ["non-string name", { displayName: 42, message: "Hi" }],
    ["non-boolean anonymous", { ...valid, anonymous: "yes" }],
    ["non-string honeypot", { ...valid, homepage: 5 }],
  ])("rejects %s", (_name, body) => {
    expect(guestbookRequestSchema.safeParse(body).success).toBe(false);
  });

  it("accepts a message and a name exactly at the limits, with emoji and non-Latin text", () => {
    expect(guestbookRequestSchema.safeParse({ displayName: "x".repeat(60), message: "y".repeat(500) }).success).toBe(true);
    expect(guestbookRequestSchema.safeParse({ displayName: "李 Zoë 🌸", message: "Selamat 🎉 الف مبروك" }).success).toBe(true);
  });

  it("keeps single line breaks and at most one blank line", () => {
    expect(normalizeMessage("a\nb\n\n\n\nc")).toBe("a\nb\n\nc");
    expect(normalizeMessage("a  \n  b\t\tc")).toBe("a\nb c");
  });
});

describe("guestbookQuerySchema", () => {
  it("defaults the page size", () => {
    expect(guestbookQuerySchema.parse({})).toEqual({ limit: 20 });
  });

  it.each([
    [{ limit: "1" }, 1],
    [{ limit: "50" }, 50],
    [{ limit: "7" }, 7],
  ])("accepts %j", (input, limit) => {
    expect(guestbookQuerySchema.parse(input).limit).toBe(limit);
  });

  it.each([{ limit: "0" }, { limit: "51" }, { limit: "-1" }, { limit: "abc" }, { limit: "2.5" }, { cursor: "nope" }, { cursor: "1_2" }, { cursor: `${"1".repeat(13)}_${"g".repeat(24)}` }])(
    "rejects %j",
    (input) => {
      expect(guestbookQuerySchema.safeParse(input).success).toBe(false);
    },
  );

  it("accepts a well-formed cursor", () => {
    expect(guestbookQuerySchema.safeParse({ cursor: `1781000000000_${"a".repeat(24)}` }).success).toBe(true);
  });
});
