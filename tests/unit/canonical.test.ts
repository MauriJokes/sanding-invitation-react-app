import { describe, expect, it } from "vitest";
import { canonicalGroupKey } from "../../server/rsvp/canonical";
import { normalizeFamilyName } from "../../shared/rsvp/schemas";

describe("canonicalGroupKey", () => {
  it.each([
    ["The Ahmad Family", "the ahmad family"],
    ["  the   AHMAD\tfamily \n", "the ahmad family"],
    ["Ｔhe Ahmad Family", "the ahmad family"], // full-width letter (NFKC)
    ["Zoë Lim", "zoë lim"],
  ])("normalises %j", (input, expected) => {
    expect(canonicalGroupKey(normalizeFamilyName(input))).toBe(expected);
  });

  it("treats composed and decomposed accents as the same family", () => {
    expect(canonicalGroupKey("Zo\u00eb Lim")).toBe(canonicalGroupKey("Zoe\u0308 Lim"));
  });

  it("does not invent extra matching rules", () => {
    expect(canonicalGroupKey("Ahmad Family")).not.toBe(canonicalGroupKey("The Ahmad Family"));
    expect(canonicalGroupKey("Ahmad")).not.toBe(canonicalGroupKey("Ahmad Family"));
    expect(canonicalGroupKey("Zoe Lim")).not.toBe(canonicalGroupKey("Zoë Lim"));
  });
});
