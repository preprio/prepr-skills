import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstSkill } from '../scripts/eval-routing.mjs';
import { summarize } from '../scripts/scenario.mjs';

const line = (o) => JSON.stringify(o);
const use = (name, input) => line({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });

test('firstSkill returns the first Skill call without the plugin prefix', () => {
  const out = [use('Grep', {}), use('Skill', { skill: 'prepr:create-schema' }), use('Skill', { skill: 'review-schema' })].join('\n');
  assert.equal(firstSkill(out), 'create-schema');
});

test('firstSkill returns null when no skill loaded and ignores junk lines', () => {
  assert.equal(firstSkill(['not json', use('Read', {})].join('\n')), null);
});

test('summarize marks writes and redacts confirm tokens', () => {
  const out = [
    line({ type: 'system', session_id: 's1' }),
    use('mcp__prepr__list_schema', {}),
    use('mcp__prepr__delete_schema_field', { fieldId: 'f', confirm: true, confirmToken: 'secret-token' }),
    line({ type: 'result', result: 'done', session_id: 's1' }),
  ].join('\n');
  const s = summarize(out);
  assert.equal(s.session, 's1');
  assert.equal(s.result, 'done');
  assert.ok(s.calls.some((c) => c.startsWith('READ  mcp__prepr__list_schema')));
  assert.ok(s.calls.some((c) => c.startsWith('WRITE mcp__prepr__delete_schema_field')));
  assert.ok(!JSON.stringify(s).includes('secret-token'));
});
