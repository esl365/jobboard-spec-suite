#!/usr/bin/env node
import fs from "node:fs/promises";
import YAML from "yaml";

const mainPath = "openapi/api-spec.yaml";
const patchPath = "openapi/api-spec.payments.snippet.yaml";

function deepMerge(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return Array.from(new Set([...a, ...b]));
  if (a && typeof a === "object" && b && typeof b === "object") {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) {
      out[k] = k in out ? deepMerge(out[k], v) : v;
    }
    return out;
  }
  return b ?? a;
}

async function main() {
  const main = YAML.parse(await fs.readFile(mainPath, "utf8"));
  const patch = YAML.parse(await fs.readFile(patchPath, "utf8"));

  main.paths = deepMerge(main.paths || {}, patch.paths || {});
  main.components = deepMerge(main.components || {}, patch.components || {});

  await fs.writeFile(mainPath, YAML.stringify(main), "utf8");
  console.log(`[merge] merged ${patchPath} -> ${mainPath}`);
}
main().catch(e => { console.error(e); process.exit(1); });
