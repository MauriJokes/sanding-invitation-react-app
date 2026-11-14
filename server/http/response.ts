/** Common response shape from docs/API_CONTRACTS.md. Never include internals or secrets. */
const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
} as const;

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data, error: null }, { status, headers: BASE_HEADERS });
}

export function fail(
  code: string,
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return Response.json(
    { data: null, error: { code, message } },
    { status, headers: { ...BASE_HEADERS, ...extraHeaders } },
  );
}
