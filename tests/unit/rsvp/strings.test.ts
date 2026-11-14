import { describe, expect, it } from "vitest";
import { strings, type Strings } from "../../../src/i18n/strings";

const sample = (value: Strings[keyof Strings]): string =>
  typeof value === "function" ? (value as (arg: never) => string)(7 as never) : value;

describe("UI strings", () => {
  it("define the same keys in both languages", () => {
    expect(Object.keys(strings.en).sort()).toEqual(Object.keys(strings.ms).sort());
  });

  it("have no empty strings and no unfilled placeholders", () => {
    for (const lang of ["ms", "en"] as const) {
      for (const [key, value] of Object.entries(strings[lang]) as [string, Strings[keyof Strings]][]) {
        const text = sample(value);
        expect(text.trim(), `${lang}.${key}`).not.toBe("");
        expect(text, `${lang}.${key}`).not.toMatch(/[{}]|undefined|NaN/);
      }
    }
  });

  it("interpolate numbers and dates", () => {
    expect(strings.ms.max(10)).toBe("Maksimum 10 orang.");
    expect(strings.en.max(2)).toBe("Maximum 2 people.");
    expect(strings.ms.deadline("20 Disember 2026")).toBe("RSVP ditutup pada 20 Disember 2026.");
  });

  it("state that the RSVP is for the Walimatulurus celebration only", () => {
    expect(strings.ms.scopeNote).toMatch(/Walimatulurus sahaja/);
    expect(strings.en.scopeNote).toMatch(/Walimatulurus celebration only/);
    expect(strings.ms.successAttending).toMatch(/Walimatulurus/);
    expect(strings.en.successDeclined).toMatch(/Walimatulurus/);
  });

  it("do not tell a duplicate submitter anything beyond 'already received'", () => {
    for (const lang of ["ms", "en"] as const) {
      expect(strings[lang].errorDuplicate).not.toMatch(/\d/);
      expect(strings[lang].errorDuplicateAfterRetry).not.toMatch(/\d/);
    }
  });
});
