#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

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
      ddl += "\n\n-- MIGRATION: " + p + "\n" + await fs.readFile(p, "utf8");
    }
  } catch {}
  return ddl;
}

async function main() {
  const report = [];

  const api = await fs.readFile(apiPath, "utf8");
  for (const p of requiredPaths) {
    const pattern = new RegExp(`${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\n\\s+post:`, "m");
    const ok = pattern.test(api);
    report.push(`- [${ok ? "OK" : "FAIL"}] OpenAPI path POST ${p}`);
  }

  const effectiveDDL = await loadEffectiveDDL();
  for (const t of requiredTables) {
    const ok = tableExists(effectiveDDL, t);
    report.push(`- [${ok ? "OK" : "FAIL"}] DDL table ${t}`);
  }

  const fail = report.some(line => line.includes("FAIL"));
  const body = `# Spec↔OpenAPI↔DDL Drift Report\n\n${report.join("\n")}\n`;
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, body, "utf8");
  console.log(`[drift] report -> ${reportPath}`);
  if (fail) process.exit(2);
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
