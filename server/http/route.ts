import type { Db } from "mongodb";
import { ZodError, type z } from "zod";
import { ConfigError, getRateLimitEnv } from "../config/env.js";
import { getDb } from "../db/client.js";
import { enforceRateLimit, type RateLimitPolicy } from "../rate-limit/rate-limit.js";
import { AppError } from "./errors.js";
import { getClientIp, readJsonBody } from "./request.js";
import { fail } from "./response.js";

export interface RouteContext {
  db: Db;
  now: Date;
}

interface PostRouteOptions<S extends z.ZodType> {
  schema: S;
  rateLimit: RateLimitPolicy;
  maxBodyBytes?: number;
  handle: (input: z.output<S>, context: RouteContext) => Promise<Response>;
}

/** Logs the failure class only, never messages, bodies, URLs or query strings. */
function toErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return fail(error.code, error.message, error.status, {
      headers: error.headers,
      ...(error.fields ? { fields: error.fields } : {}),
    });
  }
  if (error instanceof ZodError) {
    const fields = [...new Set(error.issues.map((issue) => String(issue.path[0] ?? "")))].filter(Boolean);
    return fail("VALIDATION_ERROR", "Please check your responses.", 400, { fields });
  }
  const detail = error instanceof ConfigError ? `config:${error.variables.join(",")}` : error instanceof Error ? error.name : "unknown";
  console.error(JSON.stringify({ event: "api_error", detail }));
  return fail("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
}

/**
 * Shared pipeline for public JSON POST endpoints:
 * method, bounded body, schema, rate limit, then the feature handler. Cheap rejects happen before any database call.
 */
export function jsonPostRoute<S extends z.ZodType>(options: PostRouteOptions<S>) {
  return {
    async fetch(request: Request): Promise<Response> {
      try {
        if (request.method !== "POST") {
          throw new AppError("METHOD_NOT_ALLOWED", 405, "Method not allowed.", { headers: { Allow: "POST" } });
        }
        const body = await readJsonBody(request, options.maxBodyBytes);
        const input = options.schema.parse(body);
        const now = new Date();
        const { RATE_LIMIT_SALT } = getRateLimitEnv();
        const db = await getDb();
        await enforceRateLimit(db, options.rateLimit, getClientIp(request), RATE_LIMIT_SALT, now);
        return await options.handle(input, { db, now });
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  };
}

interface GetRouteOptions<T> {
  /** Parses and validates the query string. May throw a ZodError (becomes 400). */
  parse: (url: URL) => T;
  rateLimit: RateLimitPolicy;
  handle: (input: T, context: RouteContext) => Promise<Response>;
}

/** Public read-only JSON route: method, query validation, rate limit, then the feature handler. */
export function publicGetRoute<T>(options: GetRouteOptions<T>) {
  return {
    async fetch(request: Request): Promise<Response> {
      try {
        if (request.method !== "GET") {
          throw new AppError("METHOD_NOT_ALLOWED", 405, "Method not allowed.", { headers: { Allow: "GET" } });
        }
        const input = options.parse(new URL(request.url));
        const now = new Date();
        const { RATE_LIMIT_SALT } = getRateLimitEnv();
        const db = await getDb();
        await enforceRateLimit(db, options.rateLimit, getClientIp(request), RATE_LIMIT_SALT, now);
        return await options.handle(input, { db, now });
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  };
}
