import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { checkRepo } from '../scripts/check.mjs';
import { sync } from '../scripts/sync-shared.mjs';
import { SKILLS, SHARED_MAP } from '../scripts/shared-map.mjs';

function write(root, path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

const refsOf = (s) => Object.entries(SHARED_MAP).filter(([, skills]) => skills.includes(s)).map(([f]) => `[${f}](references/${f})`).join('\n');

function makeRepo(t) {
  const root = mkdtempSync(join(tmpdir(), 'prepr-skills-'));
  t?.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, '.claude-plugin/plugin.json', JSON.stringify({ name: 'prepr', version: '0.1.0' }));
  write(root, '.mcp.json', JSON.stringify({ mcpServers: { prepr: { type: 'http', url: 'https://mcp.prepr.io', headers: { 'X-Prepr-Client': 'prepr-skills/0.1.0' } } } }));
  for (const file of Object.keys(SHARED_MAP)) write(root, `shared/${file}`, `# ${file}\n`);
  for (const s of SKILLS) {
    const refs = Object.entries(SHARED_MAP).filter(([, skills]) => skills.includes(s)).map(([f]) => `[${f}](references/${f})`).join('\n');
    write(root, `skills/${s}/SKILL.md`, `---\nname: ${s}\ndescription: >-\n  Does ${s}.\n---\n\n# ${s}\n\n${refs}\n`);
  }
  sync(root, { check: false });
  return root;
}

test('clean fixture passes', (t) => {
  const root = makeRepo(t);
  assert.deepEqual(checkRepo(root), []);
});

test('missing skill is reported', (t) => {
  const root = makeRepo(t);
  rmSync(join(root, 'skills/review-schema'), { recursive: true });
  assert.ok(checkRepo(root).some((e) => e.includes('review-schema')));
});

test('unexpected skill is reported', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/extra/SKILL.md', '---\nname: extra\ndescription: x\n---\n');
  assert.ok(checkRepo(root).some((e) => e.includes('extra')));
});

test('frontmatter name must match folder', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/SKILL.md', '---\nname: wrong\ndescription: x\n---\n');
  assert.ok(checkRepo(root).some((e) => e.includes('create-schema') && e.includes('name')));
});

test('missing description is reported', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\n---\n');
  assert.ok(checkRepo(root).some((e) => e.includes('description')));
});

test('link escaping the skill folder is reported', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n[x](../design-schema/SKILL.md)\n' + refsOf('create-schema'));
  assert.ok(checkRepo(root).some((e) => e.includes('escapes')));
});

test('broken relative link is reported, URLs and valid anchors pass', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n# Top\n[ok](references/write-safety.md) [web](https://docs.prepr.io) [a](#top) [bad](references/nope.md)\n' + refsOf('create-schema'));
  const errors = checkRepo(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('nope.md'));
});

test('drifted shared copy is reported', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/references/write-safety.md', 'edited by hand\n');
  assert.ok(checkRepo(root).some((e) => e.includes('create-schema/references/write-safety.md')));
});

test('wrong MCP url is reported', (t) => {
  const root = makeRepo(t);
  write(root, '.mcp.json', JSON.stringify({ mcpServers: { prepr: { type: 'http', url: 'https://mcp.prepr.io/mcp', headers: { 'X-Prepr-Client': 'prepr-skills/0.1.0' } } } }));
  assert.ok(checkRepo(root).some((e) => e.includes('url')));
});

test('client header must match plugin version', (t) => {
  const root = makeRepo(t);
  write(root, '.claude-plugin/plugin.json', JSON.stringify({ name: 'prepr', version: '0.2.0' }));
  assert.ok(checkRepo(root).some((e) => e.includes('X-Prepr-Client')));
});

import { fileURLToPath } from 'node:url';
test('the real repo passes checkRepo', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  assert.deepEqual(checkRepo(root), []);
});

test('empty folded description is reported', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: >-\nlicense: MIT\n---\n');
  assert.ok(checkRepo(root).some((e) => e.includes('description')));
});

test('links with a title or angle brackets are checked', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n[a](references/nope.md "t") [b](<references/gone.md>)\n' + refsOf('create-schema'));
  const errors = checkRepo(root);
  assert.ok(errors.some((e) => e.includes('nope.md')));
  assert.ok(errors.some((e) => e.includes('gone.md')));
});

test('reference-style link escaping the folder is reported', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n' + refsOf('create-schema') + '\n\n[r]: ../design-schema/SKILL.md\n');
  assert.ok(checkRepo(root).some((e) => e.includes('escapes')));
});

test('broken anchors are reported, valid ones pass', (t) => {
  const root = makeRepo(t);
  write(root, 'shared/write-safety.md', '# Write safety\n\n## Plan\n');
  sync(root, { check: false });
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n[ok](references/write-safety.md#plan) [bad](references/write-safety.md#nope) [self](#create-schema)\n\n# create-schema\n' + refsOf('create-schema'));
  const errors = checkRepo(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('#nope'));
});

test('CRLF frontmatter is parsed', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/SKILL.md', '---\r\nname: create-schema\r\ndescription: x\r\n---\r\n' + refsOf('create-schema'));
  assert.deepEqual(checkRepo(root), []);
});

test('a reference no markdown file in the skill links to is reported', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/create-schema/references/orphan.md', '# Orphan\n');
  assert.ok(checkRepo(root).some((e) => e.includes('orphan.md') && e.includes('not linked')));
});

test('a stale prepr-skills version in a skill file is reported', (t) => {
  const root = makeRepo(t);
  write(root, 'skills/connect-prepr/references/clients.md', '# Clients\n`X-Prepr-Client: prepr-skills/0.0.9`\n');
  write(root, 'skills/connect-prepr/SKILL.md', '---\nname: connect-prepr\ndescription: x\n---\n[c](references/clients.md)\n' + refsOf('connect-prepr'));
  assert.ok(checkRepo(root).some((e) => e.includes('prepr-skills/0.0.9')));
});

test('marketplace metadata version must match plugin version', (t) => {
  const root = makeRepo(t);
  write(root, '.claude-plugin/marketplace.json', JSON.stringify({ metadata: { version: '0.0.1' } }));
  assert.ok(checkRepo(root).some((e) => e.includes('marketplace.json')));
});

function writePortable(root, { version = '0.1.0', url = 'https://mcp.prepr.io', header = 'prepr-skills/0.1.0', name = 'prepr' } = {}) {
  write(root, 'plugin.json', JSON.stringify({ $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', name, version }));
  write(root, 'mcp.json', JSON.stringify({ $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json', mcpServers: { prepr: { type: 'streamable-http', url, headers: { 'X-Prepr-Client': header } } } }));
}

test('portable manifest must match the Claude manifest', (t) => {
  const root = makeRepo(t);
  writePortable(root);
  assert.deepEqual(checkRepo(root), []);
  writePortable(root, { version: '0.2.0' });
  assert.ok(checkRepo(root).some((e) => e.startsWith('plugin.json') && e.includes('version')));
  writePortable(root, { name: 'other' });
  assert.ok(checkRepo(root).some((e) => e.startsWith('plugin.json') && e.includes('name')));
});

test('portable mcp.json must use the Prepr URL, streamable-http and the client header', (t) => {
  const root = makeRepo(t);
  writePortable(root, { url: 'https://mcp.prepr.io/mcp' });
  assert.ok(checkRepo(root).some((e) => e.startsWith('mcp.json') && e.includes('url')));
  writePortable(root, { header: 'prepr-skills/0.0.1' });
  assert.ok(checkRepo(root).some((e) => e.startsWith('mcp.json') && e.includes('X-Prepr-Client')));
});

test('the real repo ships a portable Codex package', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  for (const f of ['plugin.json', 'mcp.json', '.agents/plugins/marketplace.json']) assert.ok(existsSync(join(root, f)), `${f} missing`);
});
