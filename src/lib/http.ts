export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: "api"; status: number; code: string; fields: string[] }
  /** No usable response: offline, timeout, aborted, or a body that is not the documented shape. */
  | { ok: false; kind: "network" };

const REQUEST_TIMEOUT_MS = 15_000;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Calls the same-origin API and validates the documented `{ data, error }` envelope by hand.
 * `parse` returns undefined for anything that is not the expected shape, which counts as "no usable answer".
 * Nothing is logged: bodies can hold guests' names and messages.
 */
export async function requestJson<T>(
  method: "GET" | "POST",
  path: string,
  body: unknown,
  parse: (data: unknown) => T | undefined,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  try {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const response = await fetch(path, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      // Same-origin only: sends no cookie cross-site, but lets a protected Vercel preview recognise a signed-in
      // team member. The app sets no cookies of its own, and the API never reads any.
      credentials: "same-origin",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });

    let envelope: unknown;
    try {
      envelope = await response.json();
    } catch {
      return { ok: false, kind: "network" };
    }
    if (!isRecord(envelope)) return { ok: false, kind: "network" };

    if (response.ok) {
      const data = parse(envelope.data);
      return data === undefined ? { ok: false, kind: "network" } : { ok: true, data };
    }

    const error = envelope.error;
    if (!isRecord(error) || typeof error.code !== "string") return { ok: false, kind: "network" };
    const fields = Array.isArray(error.fields) ? error.fields.filter((f): f is string => typeof f === "string") : [];
    return { ok: false, kind: "api", status: response.status, code: error.code, fields };
  } catch {
    return { ok: false, kind: "network" };
  }
}
