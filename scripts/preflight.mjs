#!/usr/bin/env node
// scripts/preflight.mjs
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const run = (cmd, args, opts={}) => new Promise((res) => {
  const p = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32", ...opts });
  p.on("exit", (code) => res(code ?? 1));
});

const step = async (name, fn) => {
  console.log(`\n[preflight] >>> ${name}`);
  const code = await fn();
  if (code !== 0) {
    console.error(`[preflight] FAILED at: ${name}`);
    process.exit(code);
  }
};

// 1) merge (payments snippet -> main)
await step("merge", () => run("node", [path.join(root, "openapi-merge-payments.mjs")]));

// 2) normalize/fixup (license/security/opIds/params/4xx)
await step("openapi-fixup", () => run("node", [path.join(root, "openapi-fixup.mjs")]));

// 3) lint: prefer Redocly (vendored). If not runnable, fallback to lightweight linter.
let lintOK = await run("npx", ["--no-install", "@redocly/cli", "lint", "openapi/api-spec.yaml"]);
if (lintOK !== 0) {
  console.warn("[preflight] Redocly lint failed or not runnable — falling back to offline linter.");
  lintOK = await run("node", [path.join(root, "openapi-lint.mjs"), "openapi/api-spec.yaml"]);
}
if (lintOK !== 0) process.exit(lintOK);

// 4) drift check (OpenAPI↔DDL)
await step("drift", () => run("node", [path.join(root, "spec-drift-check.mjs")]));

console.log("\n[preflight] ✅ all checks passed.");
