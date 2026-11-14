import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");

function apiEntryPoints(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return apiEntryPoints(full);
    return name.endsWith(".ts") ? [full] : [];
  });
}

describe("Vercel function compile", () => {
  /**
   * Vercel compiles each file in api/ using the ROOT tsconfig.json, not the per-folder ones used by
   * `npm run typecheck`. TypeScript 6 loads no @types by default, so a root config without
   * `types: ["node"]` breaks every function's compile (seen in a real deployment log).
   */
  it("compiles every api/ entry point cleanly with the root tsconfig.json", () => {
    const configPath = path.join(root, "tsconfig.json");
    const read = ts.readConfigFile(configPath, (file) => ts.sys.readFile(file));
    expect(read.error).toBeUndefined();
    const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, root);

    const files = apiEntryPoints(path.join(root, "api"));
    expect(files.length).toBeGreaterThanOrEqual(3);
    const program = ts.createProgram(files, { ...parsed.options, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program).map((d) => {
      const where = d.file ? `${path.relative(root, d.file.fileName)}: ` : "";
      return `${where}${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;
    });
    expect(diagnostics).toEqual([]);
  }, 60_000);
});
