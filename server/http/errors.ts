/** A failure that is safe to show the guest: stable code, plain message, HTTP status. */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly fields: string[] | undefined;

  constructor(
    code: string,
    status: number,
    message: string,
    options: { headers?: Record<string, string>; fields?: string[] } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.headers = options.headers ?? {};
    this.fields = options.fields;
  }
}
