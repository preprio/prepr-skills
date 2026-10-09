import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { bump } from '../scripts/bump-version.mjs';

function write(root, path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

function makeRepo(t) {
  const root = mkdtempSync(join(tmpdir(), 'prepr-bump-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, '.claude-plugin/plugin.json', JSON.stringify({ name: 'prepr', version: '0.1.0' }, null, 2) + '\n');
  write(root, '.claude-plugin/marketplace.json', JSON.stringify({ metadata: { version: '0.1.0' } }, null, 2) + '\n');
  write(root, '.mcp.json', '{ "headers": { "X-Prepr-Client": "prepr-skills/0.1.0" } }\n');
  write(root, 'skills/connect-prepr/references/clients.md', '`prepr-skills/0.1.0` and again prepr-skills/0.1.0\n');
  write(root, 'CHANGELOG.md', '# Changelog\n\n## Unreleased\n\n- Something new.\n\n## 0.1.0\n\n- First.\n');
  return root;
}

const read = (root, p) => readFileSync(join(root, p), 'utf8');

test('bump rewrites every version and dates the Unreleased section', (t) => {
  const root = makeRepo(t);
  bump(root, '0.2.0', '2026-10-20');
  assert.equal(JSON.parse(read(root, '.claude-plugin/plugin.json')).version, '0.2.0');
  assert.equal(JSON.parse(read(root, '.claude-plugin/marketplace.json')).metadata.version, '0.2.0');
  assert.ok(read(root, '.mcp.json').includes('prepr-skills/0.2.0'));
  assert.ok(!read(root, 'skills/connect-prepr/references/clients.md').includes('0.1.0'));
  assert.ok(read(root, 'CHANGELOG.md').includes('## Unreleased\n\n## 0.2.0 (2026-10-20)\n\n- Something new.'));
});

test('bump rejects a non-semver or non-increasing version', (t) => {
  const root = makeRepo(t);
  assert.throws(() => bump(root, 'v0.2'), /semver/);
  assert.throws(() => bump(root, '0.1.0'), /greater/);
});

test('bump refuses an empty Unreleased section', (t) => {
  const root = makeRepo(t);
  write(root, 'CHANGELOG.md', '# Changelog\n\n## Unreleased\n\n## 0.1.0\n\n- First.\n');
  assert.throws(() => bump(root, '0.2.0'), /Unreleased/);
});
