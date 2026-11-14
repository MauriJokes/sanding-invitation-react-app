import { describe, expect, it } from "vitest";
import {
  INVITE_STORAGE_KEY,
  clearInvite,
  consumeInviteFromUrl,
  isPlausibleInvite,
  readStoredInvite,
  storeInvite,
} from "../../../src/features/rsvp/invite";
import { MemoryStorage, STALE_INVITE, VALID_INVITE } from "./helpers";

function browser(href: string) {
  const replaced: string[] = [];
  return {
    location: { href },
    history: { state: { keep: true }, replaceState: (_s: unknown, _t: string, url?: string | URL | null) => void replaced.push(String(url)) },
    replaced,
  };
}

describe("consumeInviteFromUrl", () => {
  it("returns the invite and removes it from the address bar, keeping other parameters and the hash", () => {
    const b = browser(`https://site.test/path?utm=1&invite=${VALID_INVITE}&x=2#rsvp`);
    expect(consumeInviteFromUrl(b.location, b.history)).toBe(VALID_INVITE);
    expect(b.replaced).toEqual(["/path?utm=1&x=2#rsvp"]);
    expect(b.replaced[0]).not.toContain(VALID_INVITE);
  });

  it("leaves the address bar alone when there is no invite", () => {
    const b = browser("https://site.test/?utm=1");
    expect(consumeInviteFromUrl(b.location, b.history)).toBeUndefined();
    expect(b.replaced).toEqual([]);
  });

  it.each([
    ["empty", ""],
    ["with spaces", "has space"],
    ["with markup", "<script>alert(1)</script>"],
    ["too long", "A".repeat(129)],
  ])("strips a %s invite from the address bar but never uses it", (_name, value) => {
    const b = browser(`https://site.test/?invite=${encodeURIComponent(value)}`);
    expect(consumeInviteFromUrl(b.location, b.history)).toBeUndefined();
    expect(b.replaced).toEqual(["/"]);
  });
});

describe("isPlausibleInvite", () => {
  it("accepts only URL-safe codes up to 128 characters", () => {
    expect(isPlausibleInvite(VALID_INVITE)).toBe(true);
    expect(isPlausibleInvite("A".repeat(128))).toBe(true);
    for (const bad of ["", "a b", "a/b", "é", "A".repeat(129), 5, null, undefined]) {
      expect(isPlausibleInvite(bad)).toBe(false);
    }
  });
});

describe("stored invite", () => {
  it("stores, reads and clears", () => {
    const storage = new MemoryStorage();
    expect(readStoredInvite(storage)).toBeUndefined();
    storeInvite(VALID_INVITE, storage);
    expect(storage.getItem(INVITE_STORAGE_KEY)).toBe(VALID_INVITE);
    expect(readStoredInvite(storage)).toBe(VALID_INVITE);
    clearInvite(storage);
    expect(readStoredInvite(storage)).toBeUndefined();
  });

  it("ignores a tampered stored value", () => {
    const storage = new MemoryStorage();
    storage.setItem(INVITE_STORAGE_KEY, "<b>nope</b>");
    expect(readStoredInvite(storage)).toBeUndefined();
    storeInvite(STALE_INVITE, storage);
    expect(readStoredInvite(storage)).toBe(STALE_INVITE);
  });

  it("never throws when storage is unavailable or blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    } as unknown as Storage;
    expect(() => storeInvite(VALID_INVITE, blocked)).not.toThrow();
    expect(() => clearInvite(blocked)).not.toThrow();
    expect(readStoredInvite(blocked)).toBeUndefined();
    expect(readStoredInvite(undefined)).toBeUndefined();
    expect(() => storeInvite(VALID_INVITE, undefined)).not.toThrow();
  });
});
