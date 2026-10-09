import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER = /^\d+\.\d+\.\d+$/;

function newer(a, b) {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

function filesUnder(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });
}

// Sets the plugin version everywhere it appears and dates the CHANGELOG's Unreleased section.
export function bump(root, version, date = new Date().toISOString().slice(0, 10)) {
  if (!SEMVER.test(version)) throw new Error(`"${version}" is not semver (x.y.z)`);
  const pluginPath = join(root, '.claude-plugin/plugin.json');
  const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'));
  const current = plugin.version;
  if (!newer(version, current)) throw new Error(`${version} must be greater than the current ${current}`);

  const changelogPath = join(root, 'CHANGELOG.md');
  const changelog = readFileSync(changelogPath, 'utf8');
  const unreleased = changelog.match(/## Unreleased\n([\s\S]*?)(?=\n## |$)/);
  if (!unreleased || !unreleased[1].trim()) throw new Error('CHANGELOG.md has no entries under ## Unreleased');

  plugin.version = version;
  writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + '\n');

  const marketplacePath = join(root, '.claude-plugin/marketplace.json');
  if (existsSync(marketplacePath)) {
    const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf8'));
    marketplace.metadata = { ...marketplace.metadata, version };
    writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n');
  }

  const header = new RegExp(`prepr-skills/${current.replace(/\./g, '\\.')}`, 'g');
  for (const file of [join(root, '.mcp.json'), ...filesUnder(join(root, 'skills')), ...(existsSync(join(root, 'shared')) ? filesUnder(join(root, 'shared')) : [])]) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    if (text.includes(`prepr-skills/${current}`)) writeFileSync(file, text.replace(header, `prepr-skills/${version}`));
  }

  writeFileSync(changelogPath, changelog.replace('## Unreleased\n', `## Unreleased\n\n## ${version} (${date})\n`));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const version = process.argv[2];
  try {
    bump(process.cwd(), version);
    console.log(`Bumped to ${version}. Next: review the diff, commit, then: git tag v${version} && git push --follow-tags`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
