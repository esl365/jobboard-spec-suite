#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const specPath = process.argv[2] ?? path.join('openapi', 'api-spec.yaml');

const runners = [
  {
    mode: 'vendored',
    command: path.join(repoRoot, 'tools', 'redocly-cli', 'redocly'),
    args: ['lint', specPath],
    available: () => existsSync(path.join(repoRoot, 'tools', 'redocly-cli', 'redocly'))
  },
  {
    mode: 'global',
    command: 'redocly',
    args: ['lint', specPath],
    available: () => {
      const probe = spawnSync('redocly', ['--version'], { stdio: 'ignore' });
      return !probe.error && probe.status === 0;
    }
  }
];

for (const runner of runners) {
  if (!runner.available()) continue;
  const result = spawnSync(runner.command, runner.args, { stdio: 'inherit' });
  if (result.status === 0) {
    console.log(`[openapi-lint] mode=${runner.mode} status=passed`);
    process.exit(0);
  }
  console.error(`[openapi-lint] mode=${runner.mode} status=failed`);
  process.exit(result.status ?? 1);
}

try {
  const content = readFileSync(path.resolve(repoRoot, specPath), 'utf8');
  if (!/^openapi:\s*3\./m.test(content)) throw new Error('missing openapi version header');
  if (!/^info:\s*\n/m.test(content)) throw new Error('missing info object');
  if (!/^paths:\s*\n/m.test(content)) throw new Error('missing paths object');
  console.log('[openapi-lint] mode=offline status=passed');
  process.exit(0);
} catch (error) {
  console.error('[openapi-lint] mode=offline status=failed');
  console.error(error.message);
  process.exit(1);
}
