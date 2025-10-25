#!/usr/bin/env node
// Lightweight OpenAPI 3.x structural lint (offline)
// Usage: node scripts/openapi-lint.mjs [path]  (default: openapi/api-spec.yaml)
import fs from "node:fs/promises";
import YAML from "yaml";

const file = process.argv[2] || "openapi/api-spec.yaml";
const ERR = [];
const WARN = [];

const METHODS = new Set(["get","put","post","delete","patch","options","head","trace"]);

function pathHasSuccess(responses) {
  if (!responses || typeof responses !== "object") return false;
  return Object.keys(responses).some(k => k === "default" || /^2\d\d$/.test(k));
}

(async () => {
  let raw;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (e) {
    console.error(`[lint] cannot read file: ${file}`);
    process.exit(2);
  }

  let doc;
  try {
    doc = YAML.parse(raw);
  } catch (e) {
    console.error(`[lint] YAML parse error: ${e?.message}`);
    process.exit(2);
  }

  // Top-level checks
  if (!doc.openapi || !/^3\./.test(String(doc.openapi))) ERR.push("Top: missing/invalid 'openapi' (expect 3.x).");
  if (!doc.info || !doc.info.title) ERR.push("Top: missing 'info.title'.");
  if (!doc.info || !doc.info.version) ERR.push("Top: missing 'info.version'.");
  if (!doc.paths || typeof doc.paths !== "object" || !Object.keys(doc.paths).length) ERR.push("Top: 'paths' must be a non-empty object.");

  // Paths & operations
  if (doc.paths && typeof doc.paths === "object") {
    for (const [p, opObj] of Object.entries(doc.paths)) {
      if (!opObj || typeof opObj !== "object") { ERR.push(`Path '${p}': value must be an object.`); continue; }
      const methods = Object.keys(opObj).filter(k => METHODS.has(k.toLowerCase()));
      if (!methods.length) WARN.push(`Path '${p}': no HTTP methods defined.`);
      for (const m of methods) {
        const op = opObj[m];
        if (!op || typeof op !== "object") { ERR.push(`Path '${p}' ${m.toUpperCase()}: operation must be an object.`); continue; }
        if (!op.responses) ERR.push(`Path '${p}' ${m.toUpperCase()}: missing 'responses'.`);
        else if (!pathHasSuccess(op.responses)) ERR.push(`Path '${p}' ${m.toUpperCase()}: responses missing 2xx/default.`);
        // Basic requestBody sanity (if present)
        if (op.requestBody && !op.requestBody.content) WARN.push(`Path '${p}' ${m.toUpperCase()}: requestBody without 'content'.`);
      }
    }
  }

  // Components (light)
  if (doc.components && doc.components.schemas && typeof doc.components.schemas !== "object") {
    ERR.push("Top: 'components.schemas' must be an object.");
  }

  // Report
  if (WARN.length) console.log(`[lint] WARNINGS:\n - ` + WARN.join("\n - "));
  if (ERR.length) {
    console.error(`[lint] ERRORS:\n - ` + ERR.join("\n - "));
    process.exit(2);
  }
  console.log(`[lint] OK: ${file}`);
})().catch(e => { console.error(e); process.exit(2); });
