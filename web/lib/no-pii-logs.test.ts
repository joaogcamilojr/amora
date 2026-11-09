import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SOURCE_DIRS = ["app", "lib", "components", "mcp"];
/** Único arquivo autorizado a chamar `console.*`: o helper que registra só nome e código do erro. */
const ALLOWED = new Set(["lib/log.ts"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

const files = [...SOURCE_DIRS.flatMap((d) => sourceFiles(join(ROOT, d))), join(ROOT, "proxy.ts")].map((path) => ({
  path: relative(ROOT, path),
  text: readFileSync(path, "utf8"),
}));

describe("logs sem dados pessoais", () => {
  it("nenhum console.* fora do helper lib/log.ts", () => {
    const offenders = files
      .filter((f) => !ALLOWED.has(f.path) && /\bconsole\s*\.\s*(log|info|warn|error|debug|trace)\b/.test(f.text))
      .map((f) => f.path);
    assert.deepEqual(offenders, [], "use logError() de @/lib/log; console.* pode vazar e-mail, nomes e valores");
  });

  it("logError recebe só a etiqueta e o erro (sem contexto livre)", () => {
    const offenders = files
      .filter((f) => f.path !== "lib/log.ts")
      .flatMap((f) => [...f.text.matchAll(/\blogError\(([^)]*)\)/g)].map((m) => ({ path: f.path, args: m[1] })))
      .filter(({ args }) => args.split(",").length !== 2 || !/^\s*"[a-z0-9-]+"\s*,/.test(args))
      .map(({ path, args }) => `${path}: logError(${args})`);
    assert.deepEqual(offenders, []);
  });

  it("o helper não interpola a mensagem nem o stack do erro", () => {
    const helper = files.find((f) => f.path === "lib/log.ts")?.text ?? "";
    assert.ok(helper.length > 0);
    assert.ok(!/\.message|\.stack|String\(error\)|JSON\.stringify\(error/.test(helper.replace(/\/\*\*[\s\S]*?\*\//g, "")));
  });
});
