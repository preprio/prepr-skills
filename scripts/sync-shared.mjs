import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHARED_MAP } from './shared-map.mjs';

// Copies shared/<file> into skills/<skill>/references/<file>. With check, writes nothing and returns drifted paths.
export function sync(root, { check }) {
  const drift = [];
  for (const [file, skills] of Object.entries(SHARED_MAP)) {
    const source = readFileSync(join(root, 'shared', file), 'utf8');
    for (const skill of skills) {
      const target = join(root, 'skills', skill, 'references', file);
      const current = existsSync(target) ? readFileSync(target, 'utf8') : null;
      if (current === source) continue;
      drift.push(`skills/${skill}/references/${file}`);
      if (!check) {
        mkdirSync(join(root, 'skills', skill, 'references'), { recursive: true });
        writeFileSync(target, source);
      }
    }
  }
  return drift;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const drift = sync(process.cwd(), { check });
  if (check && drift.length) {
    console.error(`Out of sync with shared/ (run node scripts/sync-shared.mjs):\n  ${drift.join('\n  ')}`);
    process.exit(1);
  }
  if (!check) console.log(drift.length ? `Updated:\n  ${drift.join('\n  ')}` : 'Already in sync.');
}
