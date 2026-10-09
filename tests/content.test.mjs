import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// One entry per file. `must` strings have to appear (case-insensitive), `mustNot` must not.
export const RULES = [];

RULES.push(
  { file: 'shared/mcp-connection.md',
    must: ['https://mcp.prepr.io', 'list_schema', 'connect-prepr', 'not authorized', 'never ask', 'non-interactive', '## The check'],
    mustNot: ['mcp.prepr.io/mcp'] },
  { file: 'shared/write-safety.md',
    must: ['## Plan', '## Confirm', '## Apply', '## Verify', 'environment', 'explicit yes', 'stop at the first error',
           'get_schema_entity', 'confirmToken', 'read first', 'merge', 'replaces the whole list', 'no content check'] },
  { file: 'shared/mcp-limits.md',
    must: ['no dry-run', 'one locale per', 'filters', 'upload_asset_from_public_url', 'create_asset_upload_url',
           'https://docs.prepr.io/prepr-mcp-server/release-notes', 'Settings → Integrations → MCP Server'] },
  { file: 'shared/schema-design-principles.md',
    mustNot: ['../', 'prepr/schema/', 'sync-schema', 'plan-project', 'setup-project'] },
);

RULES.push({
  file: 'skills/connect-prepr/references/clients.md',
  must: ['## Claude Code', '## Cursor', '## VS Code', '## Codex', '## OpenCode', '## GitHub Copilot CLI', '## Claude Desktop', '## ChatGPT',
         'PREPR_MCP_TOKEN', 'bearer_token_env_var', 'Source:', 'https://mcp.prepr.io'],
  mustNot: ['mcp.prepr.io/mcp', 'YOUR_ACCESS_TOKEN'],
});

for (const r of RULES) {
  test(`${r.file}`, () => {
    assert.ok(existsSync(r.file), `${r.file} missing`);
    const text = readFileSync(r.file, 'utf8').toLowerCase();
    for (const s of r.must ?? []) assert.ok(text.includes(s.toLowerCase()), `${r.file} must mention "${s}"`);
    for (const s of r.mustNot ?? []) assert.ok(!text.includes(s.toLowerCase()), `${r.file} must not mention "${s}"`);
  });
}
