import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");

describe("search-engine privacy", () => {
  it("tells crawlers not to index the page (meta tag)", () => {
    expect(read("index.html")).toMatch(/<meta name="robots" content="noindex, nofollow, noarchive"/);
  });

  it("sends the same directive as an HTTP header for every route, including /api", () => {
    const config = JSON.parse(read("vercel.json")) as {
      headers: { source: string; headers: { key: string; value: string }[] }[];
    };
    const global = config.headers.find((entry) => entry.source === "/(.*)");
    const robots = global?.headers.find((header) => header.key === "X-Robots-Tag");
    expect(robots?.value).toBe("noindex, nofollow, noarchive");
  });

  it("does not ship a robots.txt that would stop crawlers from reading the noindex directive", () => {
    expect(() => read("public/robots.txt")).toThrow();
  });
});
