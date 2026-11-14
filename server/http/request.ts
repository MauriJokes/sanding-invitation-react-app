import { AppError } from "./errors.js";

export const DEFAULT_MAX_BODY_BYTES = 4096;

/** Reads a bounded JSON body. Rejects early on the declared size and again while streaming. */
export async function readJsonBody(
  request: Request,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json\s*(;|$)/i.test(contentType)) {
    throw new AppError("UNSUPPORTED_MEDIA_TYPE", 415, "Content-Type must be application/json.");
  }

  const tooLarge = () => new AppError("PAYLOAD_TOO_LARGE", 413, "Request body is too large.");
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) throw tooLarge();

  if (!request.body) throw new AppError("BAD_REQUEST", 400, "Invalid request.");
  const reader = request.body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw tooLarge();
    }
    chunks.push(value);
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError("BAD_REQUEST", 400, "Invalid request.");
  }
}

/** Vercel overwrites these headers, so the first value is the client. Local dev falls back to "unknown". */
export function getClientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
