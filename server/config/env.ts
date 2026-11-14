import { z } from "zod";

/** Lists variable names only. Values must never appear in errors or logs. */
export class ConfigError extends Error {
  readonly variables: string[];

  constructor(variables: string[]) {
    super(`Invalid server configuration: ${variables.join(", ")}`);
    this.name = "ConfigError";
    this.variables = variables;
  }
}

const urlSafe = /^[A-Za-z0-9_-]+$/;

export const databaseSchema = z.object({
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//),
  MONGODB_DATABASE: z.string().min(1),
});

export const sheetsSchema = z.object({
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.email(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z
    .string()
    .min(1)
    .transform((key) => key.replace(/\\n/g, "\n")),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1),
  GOOGLE_SHEETS_RSVP_WORKSHEET_NAME: z.string().min(1).default("Family RSVP"),
  GOOGLE_SHEETS_GUESTBOOK_WORKSHEET_NAME: z.string().min(1).default("Guestbook"),
});

export const inviteSchema = z.object({
  // At least 22 URL-safe characters (about 128 bits when random); it is used in a URL.
  INTERNAL_INVITE_CODE: z.string().min(22).max(128).regex(urlSafe),
});

export const rateLimitSchema = z.object({
  RATE_LIMIT_SALT: z.string().min(32),
});

export function parseEnv<S extends z.ZodType>(
  schema: S,
  source: Record<string, string | undefined> = process.env,
): z.output<S> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const names = result.error.issues.map((issue) => String(issue.path[0] ?? "unknown"));
    throw new ConfigError([...new Set(names)]);
  }
  return result.data;
}

/** Each feature validates only the configuration it needs, when it first needs it. */
export const getDatabaseEnv = () => parseEnv(databaseSchema);
export const getSheetsEnv = () => parseEnv(sheetsSchema);
export const getInviteEnv = () => parseEnv(inviteSchema);
export const getRateLimitEnv = () => parseEnv(rateLimitSchema);
