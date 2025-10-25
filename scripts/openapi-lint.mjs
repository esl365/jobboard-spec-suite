#!/usr/bin/env node
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import process from "node:process";
import fs from "node:fs/promises";

const SPEC_PATH = "openapi/api-spec.yaml";
const SUMMARY_PREFIX = "[openapi-lint]";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, args) {
  return new Promise(resolve => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", error => {
      if (error.code === "ENOENT") {
        resolve({ status: "missing" });
      } else {
        console.error(`${SUMMARY_PREFIX} failed to launch ${command}:`, error);
        resolve({ status: "error", code: 1 });
      }
    });
    child.on("close", code => {
      resolve({ status: "ok", code: code ?? 1 });
    });
  });
}

async function lintWithVendoredRedocly() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const binDir = path.join(rootDir, "tools", "redocly-cli", "bin");
  const scriptCandidates = [
    path.join(binDir, "redocly.mjs"),
    path.join(binDir, "redocly.js"),
    path.join(binDir, "redocly"),
  ];

  for (const candidate of scriptCandidates) {
    if (!(await exists(candidate))) continue;
    if (candidate.endsWith(".mjs") || candidate.endsWith(".js")) {
      return { mode: "vendored", result: await runCommand("node", [candidate, "lint", SPEC_PATH]) };
    }
    return { mode: "vendored", result: await runCommand(candidate, ["lint", SPEC_PATH]) };
  }
  return null;
}

async function lintWithGlobalRedocly() {
  const result = await runCommand("redocly", ["lint", SPEC_PATH]);
  if (result.status === "missing") return null;
  return { mode: "global", result };
}

async function lintOfflineFallback() {
  const raw = await fs.readFile(SPEC_PATH, "utf8");
  const errors = [];
  if (!/^openapi:\s+/m.test(raw)) errors.push("missing openapi version");
  if (!/^paths:/m.test(raw)) errors.push("missing paths section");
  if (!/\/payments\/prepare:\n\s+post:/m.test(raw)) errors.push("missing POST /payments/prepare");
  if (!/\/webhooks\/payments\/\{provider\}:\n\s+post:/m.test(raw)) errors.push("missing POST /webhooks/payments/{provider}");

  if (errors.length) {
    console.error(`${SUMMARY_PREFIX} offline fallback detected issues: ${errors.join(", ")}`);
    return { status: "error", code: 1 };
  }
  console.log(`${SUMMARY_PREFIX} offline fallback checks passed for ${SPEC_PATH}`);
  return { status: "ok", code: 0 };
}

async function main() {
  const attempts = [];
  const vendored = await lintWithVendoredRedocly();
  if (vendored) {
    attempts.push(vendored);
  } else {
    const global = await lintWithGlobalRedocly();
    if (global) {
      attempts.push(global);
    } else {
      const fallbackResult = await lintOfflineFallback();
      attempts.push({ mode: "fallback", result: fallbackResult });
    }
  }

  const { mode, result } = attempts.at(-1);
  if (result.status !== "ok" || ("code" in result && result.code !== 0)) {
    process.exitCode = result.code ?? 1;
    console.log(`${SUMMARY_PREFIX} mode=${mode} status=failed`);
  } else {
    process.exitCode = 0;
    console.log(`${SUMMARY_PREFIX} mode=${mode} status=passed`);
  }
}

main().catch(error => {
  console.error(`${SUMMARY_PREFIX} unexpected error`, error);
  process.exit(1);
});
