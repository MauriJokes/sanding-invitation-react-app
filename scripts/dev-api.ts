import { existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { Readable } from "node:stream";
import { loadEnv, type Plugin, type ViteDevServer } from "vite";

type Handler = (request: Request) => Response | Promise<Response>;
type ApiModule = { default?: { fetch?: Handler } } & Record<string, unknown>;

const errorBody = (code: string, message: string) => JSON.stringify({ data: null, error: { code, message } });

/**
 * Dev-only: serves api/** through the Vite dev server so `npm run dev` works without
 * the Vercel CLI. Mirrors the web-standard handler convention used by Vercel Functions.
 */
export function devApi(): Plugin {
  return {
    name: "dev-api",
    apply: "serve",
    configureServer(server) {
      for (const [key, value] of Object.entries(loadEnv(server.config.mode, server.config.root, ""))) {
        process.env[key] ??= value;
      }
      server.middlewares.use((req, res, next) => {
        handle(server, req, res, next).catch(next);
      });
    },
  };
}

function findRouteFile(root: string, route: string): string | undefined {
  if (!/^[a-z0-9][a-z0-9/-]*$/i.test(route)) return undefined;
  return [`${route}.ts`, `${route}/index.ts`]
    .map((candidate) => path.join(root, "api", candidate))
    .find((candidate) => existsSync(candidate));
}

async function handle(
  server: ViteDevServer,
  req: IncomingMessage,
  res: ServerResponse,
  next: (error?: unknown) => void,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/")) return next();

  const send = (status: number, body: string) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(body);
  };

  const route = url.pathname.slice("/api/".length).replace(/\/+$/, "");
  const file = findRouteFile(server.config.root, route);
  if (!file) return send(404, errorBody("NOT_FOUND", "Not found."));

  try {
    const mod = (await server.ssrLoadModule(file)) as ApiModule;
    const handler = mod.default?.fetch ?? (mod[req.method ?? "GET"] as Handler | undefined);
    if (!handler) return send(405, errorBody("METHOD_NOT_ALLOWED", "Method not allowed."));

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      ...(hasBody ? { body: Readable.toWeb(req), duplex: "half" } : {}),
    } as RequestInit);

    const response = await handler(request);
    res.statusCode = response.status;
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    server.config.logger.error(`[dev-api] ${error instanceof Error ? error.name : "error"} in ${route}`);
    send(500, errorBody("INTERNAL_ERROR", "Something went wrong."));
  }
}
