import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// One entry per file. `must` strings have to appear (case-insensitive), `mustNot` must not.
export const RULES = [];

for (const r of RULES) {
  test(`${r.file}`, () => {
    assert.ok(existsSync(r.file), `${r.file} missing`);
    const text = readFileSync(r.file, 'utf8').toLowerCase();
    for (const s of r.must ?? []) assert.ok(text.includes(s.toLowerCase()), `${r.file} must mention "${s}"`);
    for (const s of r.mustNot ?? []) assert.ok(!text.includes(s.toLowerCase()), `${r.file} must not mention "${s}"`);
  });
}
