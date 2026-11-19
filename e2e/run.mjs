// Runs every browser suite in sequence and prints a summary.
// Screenshots from the runs are written to e2e/.artifacts/.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const artifacts = join(here, '.artifacts');
mkdirSync(artifacts, { recursive: true });

const only = process.argv[2];
const suites = ['auth-flow', 'doctors-flow', 'patients-flow', 'dashboard-flow'].filter((s) => !only || s.startsWith(only));
let failed = 0;

for (const suite of suites) {
  console.log(`\n▶ ${suite}`);
  const result = spawnSync(process.execPath, [join(here, `${suite}.mjs`), artifacts], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed++;
    console.log(`✘ ${suite} failed`);
  }
}

console.log(`\n${suites.length - failed}/${suites.length} suites passed`);
process.exit(failed ? 1 : 0);
