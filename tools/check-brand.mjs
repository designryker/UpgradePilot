import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const forbidden = ['rig', 'pilot'].join('');
const trackedFiles = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .split(/\r?\n/)
  .filter(Boolean);
const violations = [];

for (const file of trackedFiles) {
  if (!existsSync(file)) continue;

  if (file.toLowerCase().includes(forbidden)) {
    violations.push(`${file}: forbidden brand in path`);
  }

  const contents = readFileSync(file);
  if (contents.includes(0)) continue;

  contents.toString('utf8').split(/\r?\n/).forEach((line, index) => {
    if (line.toLowerCase().includes(forbidden)) {
      violations.push(`${file}:${index + 1}: forbidden brand in content`);
    }
  });
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Brand check passed: UpgradePilot is the only project name');
