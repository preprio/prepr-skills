import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { checkRepo } from '../scripts/check.mjs';
import { sync } from '../scripts/sync-shared.mjs';
import { SKILLS, SHARED_MAP } from '../scripts/shared-map.mjs';

function write(root, path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

function makeRepo() {
  const root = mkdtempSync(join(tmpdir(), 'prepr-skills-'));
  write(root, '.claude-plugin/plugin.json', JSON.stringify({ name: 'prepr', version: '0.1.0' }));
  write(root, '.mcp.json', JSON.stringify({ mcpServers: { prepr: { type: 'http', url: 'https://mcp.prepr.io', headers: { 'X-Prepr-Client': 'prepr-skills/0.1.0' } } } }));
  for (const file of Object.keys(SHARED_MAP)) write(root, `shared/${file}`, `# ${file}\n`);
  for (const s of SKILLS) write(root, `skills/${s}/SKILL.md`, `---\nname: ${s}\ndescription: >-\n  Does ${s}.\n---\n\n# ${s}\n`);
  sync(root, { check: false });
  return root;
}

test('clean fixture passes', () => {
  const root = makeRepo();
  assert.deepEqual(checkRepo(root), []);
  rmSync(root, { recursive: true });
});

test('missing skill is reported', () => {
  const root = makeRepo();
  rmSync(join(root, 'skills/review-schema'), { recursive: true });
  assert.ok(checkRepo(root).some((e) => e.includes('review-schema')));
});

test('unexpected skill is reported', () => {
  const root = makeRepo();
  write(root, 'skills/extra/SKILL.md', '---\nname: extra\ndescription: x\n---\n');
  assert.ok(checkRepo(root).some((e) => e.includes('extra')));
});

test('frontmatter name must match folder', () => {
  const root = makeRepo();
  write(root, 'skills/create-schema/SKILL.md', '---\nname: wrong\ndescription: x\n---\n');
  assert.ok(checkRepo(root).some((e) => e.includes('create-schema') && e.includes('name')));
});

test('missing description is reported', () => {
  const root = makeRepo();
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\n---\n');
  assert.ok(checkRepo(root).some((e) => e.includes('description')));
});

test('link escaping the skill folder is reported', () => {
  const root = makeRepo();
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n[x](../design-schema/SKILL.md)\n');
  assert.ok(checkRepo(root).some((e) => e.includes('escapes')));
});

test('broken relative link is reported, URLs and valid anchors pass', () => {
  const root = makeRepo();
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n# Top\n[ok](references/write-safety.md) [web](https://docs.prepr.io) [a](#top) [bad](references/nope.md)\n');
  const errors = checkRepo(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('nope.md'));
});

test('drifted shared copy is reported', () => {
  const root = makeRepo();
  write(root, 'skills/create-schema/references/write-safety.md', 'edited by hand\n');
  assert.ok(checkRepo(root).some((e) => e.includes('create-schema/references/write-safety.md')));
});

test('wrong MCP url is reported', () => {
  const root = makeRepo();
  write(root, '.mcp.json', JSON.stringify({ mcpServers: { prepr: { type: 'http', url: 'https://mcp.prepr.io/mcp', headers: { 'X-Prepr-Client': 'prepr-skills/0.1.0' } } } }));
  assert.ok(checkRepo(root).some((e) => e.includes('url')));
});

test('client header must match plugin version', () => {
  const root = makeRepo();
  write(root, '.claude-plugin/plugin.json', JSON.stringify({ name: 'prepr', version: '0.2.0' }));
  assert.ok(checkRepo(root).some((e) => e.includes('X-Prepr-Client')));
});

import { fileURLToPath } from 'node:url';
test('the real repo passes checkRepo', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  assert.deepEqual(checkRepo(root), []);
});

test('empty folded description is reported', () => {
  const root = makeRepo();
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: >-\nlicense: MIT\n---\n');
  assert.ok(checkRepo(root).some((e) => e.includes('description')));
});

test('links with a title or angle brackets are checked', () => {
  const root = makeRepo();
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n[a](references/nope.md "t") [b](<references/gone.md>)\n');
  const errors = checkRepo(root);
  assert.ok(errors.some((e) => e.includes('nope.md')));
  assert.ok(errors.some((e) => e.includes('gone.md')));
});

test('reference-style link escaping the folder is reported', () => {
  const root = makeRepo();
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n[r]: ../design-schema/SKILL.md\n');
  assert.ok(checkRepo(root).some((e) => e.includes('escapes')));
});

test('broken anchors are reported, valid ones pass', () => {
  const root = makeRepo();
  write(root, 'shared/write-safety.md', '# Write safety\n\n## Plan\n');
  sync(root, { check: false });
  write(root, 'skills/create-schema/SKILL.md', '---\nname: create-schema\ndescription: x\n---\n[ok](references/write-safety.md#plan) [bad](references/write-safety.md#nope) [self](#create-schema)\n\n# create-schema\n');
  const errors = checkRepo(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('#nope'));
});

test('CRLF frontmatter is parsed', () => {
  const root = makeRepo();
  write(root, 'skills/create-schema/SKILL.md', '---\r\nname: create-schema\r\ndescription: x\r\n---\r\n');
  assert.deepEqual(checkRepo(root), []);
});
