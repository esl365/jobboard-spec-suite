#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { parseYaml } from "./lib/ruby-yaml.js";

const apiPath = "openapi/api-spec.yaml";
const baseDDLPath = "db/schema.pg.sql";
const migrationsDir = "migrations";
const reportPath = "reports/spec-openapi-ddl-drift.md";

const requiredPaths = ["/payments/prepare", "/webhooks/payments/{provider}"];
const requiredTables = ["orders", "idempotency_keys", "webhook_events", "wallet_ledger"];

function tableExists(sql, name) {
  const re = new RegExp(`create\\s+table\\s+(if\\s+not\\s+exists\\s+)?("?${name}"?)\\s*\\(`, "i");
  return re.test(sql);
}

async function loadEffectiveDDL() {
  let ddl = "";
  try { ddl += await fs.readFile(baseDDLPath, "utf8"); } catch {}
  try {
    const files = await fs.readdir(migrationsDir);
    const sqls = files
      .filter(f => f.toLowerCase().endsWith(".sql"))
      .sort()
      .map(f => path.join(migrationsDir, f));
    for (const p of sqls) {
      ddl += `\n\n-- MIGRATION: ${p}\n`;
      ddl += await fs.readFile(p, "utf8");
    }
  } catch {}
  return ddl;
}

async function main() {
  const reportLines = [];

  const apiDoc = parseYaml(await fs.readFile(apiPath, "utf8")) ?? {};
  for (const p of requiredPaths) {
    const ok = Boolean(apiDoc.paths?.[p]?.post);
    reportLines.push(`- [${ok ? "OK" : "FAIL"}] OpenAPI path POST ${p}`);
  }

  const ddl = await loadEffectiveDDL();
  for (const table of requiredTables) {
    const ok = tableExists(ddl, table);
    reportLines.push(`- [${ok ? "OK" : "FAIL"}] DDL table ${table}`);
  }

  const mismatches = reportLines.filter(line => line.includes("FAIL")).length;
  const header = `# Spec↔OpenAPI↔DDL Drift Report\n\nSummary: mismatches=${mismatches}`;
  const body = `${header}\n\n${reportLines.join("\n")}\n`;
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, body, "utf8");
  console.log(`[drift] report -> ${reportPath}`);
  console.log(`[drift] mismatches=${mismatches}`);
  if (mismatches > 0) process.exit(2);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
