import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

describe("browser auto-translation", () => {
  it("is switched off: the site has its own BM/EN toggle and translators rewrite the page DOM", () => {
    expect(html).toMatch(/<html[^>]*\btranslate="no"/);
    expect(html).toMatch(/<meta name="google" content="notranslate"/);
  });
});
