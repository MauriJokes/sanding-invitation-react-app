import { describe, expect, it } from "vitest";
import {
  ConfigError,
  databaseSchema,
  inviteSchema,
  parseEnv,
  rateLimitSchema,
  sheetsSchema,
} from "../../server/config/env";

const validInvite = "A".repeat(22);
const validSalt = "s".repeat(32);

describe("parseEnv", () => {
  it("accepts a valid database configuration", () => {
    const env = parseEnv(databaseSchema, {
      MONGODB_URI: "mongodb+srv://user:pass@cluster.example.mongodb.net/",
      MONGODB_DATABASE: "wedding",
    });
    expect(env.MONGODB_DATABASE).toBe("wedding");
  });

  it("reports missing variables by name only and never echoes values", () => {
    const secret = "super-secret-password";
    try {
      parseEnv(databaseSchema, { MONGODB_URI: `http://user:${secret}@host` });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const { message, variables } = error as ConfigError;
      expect(variables.sort()).toEqual(["MONGODB_DATABASE", "MONGODB_URI"]);
      expect(message).not.toContain(secret);
    }
  });

  it("restores newlines in the Google private key and applies worksheet defaults", () => {
    const env = parseEnv(sheetsSchema, {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: "svc@project.iam.gserviceaccount.com",
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: "line1\\nline2",
      GOOGLE_SHEETS_SPREADSHEET_ID: "sheet-id",
    });
    expect(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).toBe("line1\nline2");
    expect(env.GOOGLE_SHEETS_RSVP_WORKSHEET_NAME).toBe("Family RSVP");
    expect(env.GOOGLE_SHEETS_GUESTBOOK_WORKSHEET_NAME).toBe("Guestbook");
  });

  it("uses the default tab names for blank values and trims custom ones", () => {
    const base = {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: "svc@project.iam.gserviceaccount.com",
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: "k",
      GOOGLE_SHEETS_SPREADSHEET_ID: "sheet-id",
    };
    const blank = parseEnv(sheetsSchema, { ...base, GOOGLE_SHEETS_RSVP_WORKSHEET_NAME: "", GOOGLE_SHEETS_GUESTBOOK_WORKSHEET_NAME: "   " });
    expect([blank.GOOGLE_SHEETS_RSVP_WORKSHEET_NAME, blank.GOOGLE_SHEETS_GUESTBOOK_WORKSHEET_NAME]).toEqual(["Family RSVP", "Guestbook"]);
    const custom = parseEnv(sheetsSchema, { ...base, GOOGLE_SHEETS_RSVP_WORKSHEET_NAME: " Tetamu " });
    expect(custom.GOOGLE_SHEETS_RSVP_WORKSHEET_NAME).toBe("Tetamu");
  });

  it("requires a long URL-safe invite code", () => {
    expect(() => parseEnv(inviteSchema, { INTERNAL_INVITE_CODE: validInvite })).not.toThrow();
    for (const bad of ["short", "A".repeat(21), `${"A".repeat(21)}!`, `${"A".repeat(21)} `, "A".repeat(129)]) {
      expect(() => parseEnv(inviteSchema, { INTERNAL_INVITE_CODE: bad })).toThrow(ConfigError);
    }
  });

  it("requires a long rate-limit salt", () => {
    expect(() => parseEnv(rateLimitSchema, { RATE_LIMIT_SALT: validSalt })).not.toThrow();
    expect(() => parseEnv(rateLimitSchema, { RATE_LIMIT_SALT: "short" })).toThrow(ConfigError);
  });
});
