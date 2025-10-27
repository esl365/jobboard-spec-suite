#!/usr/bin/env node
import fs from "node:fs/promises";
import YAML from "yaml";

const mainPath = "openapi/api-spec.yaml";
const patchPath = "openapi/api-spec.payments.snippet.yaml";

function deepMerge(a, b, path = []) {
  // Special handling for 'parameters' arrays in OpenAPI - dedupe by (in, name)
  if (Array.isArray(a) && Array.isArray(b) && path[path.length - 1] === 'parameters') {
    const merged = [...a];
    for (const bItem of b) {
      const isDupe = merged.some(aItem =>
        aItem.in === bItem.in && aItem.name === bItem.name
      );
      if (!isDupe) merged.push(bItem);
    }
    return merged;
  }
  // General array merging - use Set for primitives
  if (Array.isArray(a) && Array.isArray(b)) return Array.from(new Set([...a, ...b]));
  // Object merging
  if (a && typeof a === "object" && b && typeof b === "object") {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) {
      out[k] = k in out ? deepMerge(out[k], v, [...path, k]) : v;
    }
    return out;
  }
  return b ?? a;
}

async function main() {
  const main = YAML.parse(await fs.readFile(mainPath, "utf8"));
  const patch = YAML.parse(await fs.readFile(patchPath, "utf8"));

  // For paths: completely replace any path that exists in patch (don't merge)
  // This prevents accumulation of duplicates on repeated runs
  if (patch.paths) {
    main.paths = main.paths || {};
    for (const [path, pathSpec] of Object.entries(patch.paths)) {
      main.paths[path] = pathSpec; // Replace, don't merge
    }
  }

  // For components: deep merge is fine since schemas don't have arrays with duplicates
  main.components = deepMerge(main.components || {}, patch.components || {});

  await fs.writeFile(mainPath, YAML.stringify(main), "utf8");
  console.log(`[merge] merged ${patchPath} -> ${mainPath}`);
}
main().catch(e => { console.error(e); process.exit(1); });
