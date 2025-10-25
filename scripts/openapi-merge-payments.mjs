#!/usr/bin/env node
import fs from "node:fs/promises";

const mainPath = "openapi/api-spec.yaml";
const patchPath = "openapi/api-spec.payments.snippet.yaml";

async function main() {
  const main = await fs.readFile(mainPath, "utf8");
  if (main.includes("/payments/prepare:")) {
    console.log(`[merge] ${mainPath} already contains payments snippet; skipping`);
    return;
  }
  const snippet = await fs.readFile(patchPath, "utf8");
  const merged = `${main.trimEnd()}\n\n# merged payments snippet\n${snippet}`;
  await fs.writeFile(mainPath, merged, "utf8");
  console.log(`[merge] appended ${patchPath} -> ${mainPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
