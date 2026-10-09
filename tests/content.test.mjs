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

RULES.push({
  file: 'skills/connect-prepr/SKILL.md',
  must: ['name: connect-prepr', 'references/clients.md', 'references/mcp-connection.md', 'OAuth', 'PREPR_MCP_TOKEN',
         'support@prepr.io', 'existing entry', 'other servers', 'list_schema', 'Settings → Integrations → MCP Server',
         'shell profile', 'environment'],
  mustNot: ['../', 'mcp.prepr.io/mcp', 'paste your token', 'enter your token'],
});

RULES.push({
  file: 'skills/design-schema/SKILL.md',
  must: ['name: design-schema', 'list_schema', 'create-schema', 'references/schema-design-principles.md',
         'references/mcp-connection.md', 'without MCP', 'only if the user asks'],
  mustNot: ['../', 'plan-project', 'setup-project', 'sync-schema', 'schema JSON', 'prepr/schema/', 'schema-spec',
            'RemoteSource', 'project-plan.md', 'validator'],
});

RULES.push(
  { file: 'skills/create-schema/SKILL.md',
    must: ['name: create-schema', 'references/write-safety.md', 'references/field-types.md', 'references/mcp-limits.md',
           'list_schema', 'get_schema_entity', 'connect-prepr', 'environment', 'one call', 'AI', 'naming', 'design-schema'],
    mustNot: ['../', 'prepr/schema/', 'validator', 'sync-schema', 'JSON file', 'schema-spec', 'RemoteSource'] },
  { file: 'skills/create-schema/references/field-types.md',
    must: ['use when', "don't use when", 'Stack', 'Component', 'Content reference', 'Enum'],
    mustNot: ['"type":', 'prepr/schema/', 'importer', 'schema_version'] },
);

RULES.push({
  file: 'skills/review-schema/SKILL.md',
  must: ['name: review-schema', 'list_schema', 'get_schema_entity', 'read-only', 'create-schema', 'connect-prepr',
         'references/schema-design-principles.md', 'Fix before content exists', 'Fix any time', "What's good", 'environment'],
  mustNot: ['../', 'prepr/schema/', 'validator', 'Blocks import', 'CI guardrail', 'sync-schema', 'scripts/'],
});

for (const r of RULES) {
  test(`${r.file}`, () => {
    assert.ok(existsSync(r.file), `${r.file} missing`);
    const text = readFileSync(r.file, 'utf8').toLowerCase();
    for (const s of r.must ?? []) assert.ok(text.includes(s.toLowerCase()), `${r.file} must mention "${s}"`);
    for (const s of r.mustNot ?? []) assert.ok(!text.includes(s.toLowerCase()), `${r.file} must not mention "${s}"`);
  });
}
