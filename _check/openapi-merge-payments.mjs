#!/usr/bin/env node
/**
 * OpenAPI Merge — Provider‑neutral Payments Snippet → api-spec.yaml
 * EN canonical. Safe, idempotent, non-destructive.
 *
 * What it does
 * 1) Reads base spec:      openapi/api-spec.yaml
 * 2) Reads payments snippet openapi/api-spec.payments.snippet.yaml
 * 3) Merges components (securitySchemes, parameters, schemas), tags, and paths
 * 4) Writes a backup        openapi/api-spec.before-payments.yaml
 * 5) Writes updated spec    openapi/api-spec.yaml
 * 6) Emits a human report   reports/openapi-merge-report.md
 *
 * Usage
 *   npm i -D yaml
 *   node scripts/openapi-merge-payments.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const BASE_PATH = path.join(ROOT, 'openapi', 'api-spec.yaml');
const SNIP_PATH = path.join(ROOT, 'openapi', 'api-spec.payments.snippet.yaml');
const BACKUP_PATH = path.join(ROOT, 'openapi', 'api-spec.before-payments.yaml');
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'openapi-merge-report.md');

const report = {
  added: { components: { securitySchemes: [], parameters: [], schemas: [] }, tags: [], paths: [] },
  updated: { paths: [] },
  conflicts: { parameters: [], schemas: [], paths: [] },
  notes: []
};

function ensure(obj, key, fallback) { if (!obj[key]) obj[key] = fallback; return obj[key]; }

function deepEqual(a, b) { try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; } }

function safeMergeDict(target, src, kind, conflictPolicy = 'keep-base') {
  if (!src) return;
  for (const [k, v] of Object.entries(src)) {
    if (target[k] === undefined) {
      target[k] = v;
      report.added.components[kind].push(k);
    } else if (!deepEqual(target[k], v)) {
      // conflict: keep-base, record
      report.conflicts[kind].push(k);
      if (conflictPolicy === 'overwrite') {
        target[k] = v;
        report.notes.push(`Overwrote ${kind}.${k} by policy`);
      }
    }
  }
}

function mergeTags(baseTags = [], addTags = []) {
  const out = [...baseTags];
  const names = new Set(baseTags.map(t => t.name));
  for (const t of addTags) {
    if (!names.has(t.name)) { out.push(t); report.added.tags.push(t.name); }
  }
  return out;
}

function mergePaths(basePaths = {}, addPaths = {}) {
  for (const [pth, ops] of Object.entries(addPaths)) {
    if (!basePaths[pth]) {
      basePaths[pth] = ops; report.added.paths.push(pth); continue;
    }
    // path exists — merge operations (post/get/etc.) conservatively
    const baseOps = basePaths[pth];
    for (const [verb, op] of Object.entries(ops)) {
      if (!baseOps[verb]) { baseOps[verb] = op; report.updated.paths.push(`${pth}#${verb}`); }
      else if (!deepEqual(baseOps[verb], op)) { report.conflicts.paths.push(`${pth}#${verb}`); }
    }
  }
}

async function main() {
  const [baseRaw, snipRaw] = await Promise.all([
    fs.readFile(BASE_PATH, 'utf8'),
    fs.readFile(SNIP_PATH, 'utf8')
  ]);

  const base = YAML.parse(baseRaw);
  const snip = YAML.parse(snipRaw);

  // backup
  await fs.writeFile(BACKUP_PATH, YAML.stringify(base));

  // components
  ensure(base, 'components', {});
  const bComp = base.components;
  const sComp = snip.components || {};

  ensure(bComp, 'securitySchemes', {});
  safeMergeDict(bComp.securitySchemes, sComp.securitySchemes, 'securitySchemes');

  ensure(bComp, 'parameters', {});
  safeMergeDict(bComp.parameters, sComp.parameters, 'parameters');

  ensure(bComp, 'schemas', {});
  safeMergeDict(bComp.schemas, sComp.schemas, 'schemas');

  // tags
  base.tags = mergeTags(base.tags || [], snip.tags || []);

  // paths
  ensure(base, 'paths', {});
  mergePaths(base.paths, snip.paths || {});

  // write updated spec
  await fs.mkdir(path.dirname(BASE_PATH), { recursive: true });
  await fs.writeFile(BASE_PATH, YAML.stringify(base));

  // report
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const md = `# OpenAPI Merge Report — Payments Snippet\n\n` +
    `**Added**\n` +
    `- components.securitySchemes: ${fmtList(report.added.components.securitySchemes)}\n` +
    `- components.parameters: ${fmtList(report.added.components.parameters)}\n` +
    `- components.schemas: ${fmtList(report.added.components.schemas)}\n` +
    `- tags: ${fmtList(report.added.tags)}\n` +
    `- paths: ${fmtList(report.added.paths)}\n\n` +
    `**Updated**\n` +
    `- paths: ${fmtList(report.updated.paths)}\n\n` +
    `**Conflicts (kept base)**\n` +
    `- parameters: ${fmtList(report.conflicts.parameters)}\n` +
    `- schemas: ${fmtList(report.conflicts.schemas)}\n` +
    `- paths: ${fmtList(report.conflicts.paths)}\n\n` +
    (report.notes.length ? `**Notes**\n- ${report.notes.join('\n- ')}\n` : '');
  await fs.writeFile(REPORT_PATH, md);

  console.log('✔ OpenAPI merge complete');
  console.log(`Backup : ${rel(BACKUP_PATH)}`);
  console.log(`Updated: ${rel(BASE_PATH)}`);
  console.log(`Report : ${rel(REPORT_PATH)}`);
}

function fmtList(arr) { return arr.length ? arr.join(', ') : '(none)'; }
function rel(p) { return path.relative(ROOT, p); }

main().catch((e) => {
  console.error('\n✖ Merge failed:', e?.message || e);
  process.exit(1);
});
