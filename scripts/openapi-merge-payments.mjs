#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parseYaml, dumpYaml } from "./lib/ruby-yaml.js";

const mainPath = "openapi/api-spec.yaml";
const snippetPath = "openapi/api-spec.payments.snippet.yaml";

function deepMerge(base, patch) {
  if (Array.isArray(base) && Array.isArray(patch)) {
    const seen = new Set();
    const merged = [];
    for (const item of [...base, ...patch]) {
      const key = JSON.stringify(item);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    return merged;
  }
  if (base && typeof base === "object" && patch && typeof patch === "object") {
    const out = { ...base };
    for (const [k, value] of Object.entries(patch)) {
      out[k] = k in out ? deepMerge(out[k], value) : value;
    }
    return out;
  }
  return patch ?? base;
}

async function readYaml(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return parseYaml(raw);
}

async function writeYaml(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const rendered = dumpYaml(data);
  await fs.writeFile(filePath, rendered.endsWith("\n") ? rendered : `${rendered}\n`, "utf8");
}

async function main() {
  const [mainDoc, snippetDoc] = await Promise.all([
    readYaml(mainPath),
    readYaml(snippetPath)
  ]);

  const paymentsPath = snippetDoc?.paths?.["/payments/prepare"];
  if (paymentsPath && mainDoc?.paths?.["/payments/prepare"]) {
    console.log(`[merge] ${snippetPath} already applied; skipping`);
    return;
  }

  const merged = {
    ...mainDoc,
    paths: deepMerge(mainDoc?.paths ?? {}, snippetDoc?.paths ?? {}),
    components: deepMerge(mainDoc?.components ?? {}, snippetDoc?.components ?? {})
  };

  await writeYaml(mainPath, merged);
  console.log(`[merge] merged ${snippetPath} -> ${mainPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
