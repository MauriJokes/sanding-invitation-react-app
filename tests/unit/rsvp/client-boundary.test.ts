import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sources(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}
const files = sources(path.resolve(__dirname, "../../../src"));

describe("browser source", () => {
  it("has files to check", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("never mentions a guest type: the server derives it, the client never sends it", () => {
    for (const file of files) expect(readFileSync(file, "utf8"), file).not.toMatch(/guestType/);
  });

  it("never reads the invite from a place other than the address bar and storage, and never logs it", () => {
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/console\.(log|info|debug|warn|error)/);
      expect(text, file).not.toMatch(/INTERNAL_INVITE_CODE|process\.env/);
    }
  });
});
