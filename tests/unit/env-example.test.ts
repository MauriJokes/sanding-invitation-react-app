import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { databaseSchema, inviteSchema, rateLimitSchema, sheetsSchema } from "../../server/config/env";

const documented = new Set(
  readFileSync(new URL("../../.env.example", import.meta.url), "utf8")
    .split("\n")
    .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
    .filter((name): name is string => name !== undefined),
);

describe(".env.example", () => {
  it("documents every server variable the schemas read", () => {
    const required = [databaseSchema, sheetsSchema, inviteSchema, rateLimitSchema].flatMap((schema) =>
      Object.keys(schema.shape),
    );
    expect(required.filter((name) => !documented.has(name))).toEqual([]);
  });

  it("holds no values for secrets", () => {
    const text = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
    const secrets = ["MONGODB_URI", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "INTERNAL_INVITE_CODE", "RATE_LIMIT_SALT"];
    for (const name of secrets) expect(text).toMatch(new RegExp(`^${name}=$`, "m"));
  });
});
