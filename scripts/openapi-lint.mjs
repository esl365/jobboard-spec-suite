#!/usr/bin/env node
import fs from "node:fs/promises";

const specPath = "openapi/api-spec.yaml";

async function main() {
  const raw = await fs.readFile(specPath, "utf8");
  const errors = [];
  if (!/^openapi:\s+/m.test(raw)) errors.push("missing openapi version");
  if (!/^paths:/m.test(raw)) errors.push("missing paths section");
  if (!/\/payments\/prepare:\n\s+post:/m.test(raw)) errors.push("missing POST /payments/prepare");
  if (!/\/webhooks\/payments\/\{provider\}:\n\s+post:/m.test(raw)) errors.push("missing POST /webhooks/payments/{provider}");

  if (errors.length) {
    console.error(`[lint] ${errors.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`[lint] ${specPath} basic checks passed`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
