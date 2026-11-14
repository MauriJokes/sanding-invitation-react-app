import { describe, expect, it } from "vitest";
import { deriveGuestType } from "../../server/rsvp/guest-type";

const CODE = "k7Qm2-xV9pLr4TnB8wZc_Hd3";

describe("deriveGuestType", () => {
  it("is internal only for an exact match", () => {
    expect(deriveGuestType(CODE, CODE)).toBe("internal");
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["wrong", "not-the-code-at-all-123456"],
    ["different case", CODE.toUpperCase()],
    ["prefix", CODE.slice(0, -1)],
    ["suffix", `${CODE}x`],
    ["padded", ` ${CODE} `],
    ["rotated (old code)", "an-older-invite-code-12345"],
    ["very long", "A".repeat(10_000)],
  ])("is external for a %s invite", (_name, invite) => {
    expect(deriveGuestType(invite, CODE)).toBe("external");
  });

  it("fails closed when the server secret is empty", () => {
    expect(deriveGuestType("", "")).toBe("external");
    expect(deriveGuestType("anything", "")).toBe("external");
  });
});
