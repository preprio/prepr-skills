import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

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
    must: ['use when', "don't use when", 'Stack', 'Component', 'Content reference', 'Enum', 'minimum of 1'],
    mustNot: ['"type":', 'prepr/schema/', 'importer', 'schema_version'] },
);

RULES.push({
  file: 'skills/review-schema/SKILL.md',
  must: ['name: review-schema', 'list_schema', 'get_schema_entity', 'read-only', 'create-schema', 'connect-prepr',
         'references/schema-design-principles.md', 'Fix before content exists', 'Fix any time', "What's good", 'environment'],
  mustNot: ['../', 'prepr/schema/', 'validator', 'Blocks import', 'CI guardrail', 'sync-schema', 'scripts/'],
});

RULES.push({
  file: 'skills/manage-content/SKILL.md',
  must: ['name: manage-content', 'references/write-safety.md', 'references/mcp-limits.md', 'connect-prepr',
         'upload_asset_from_public_url', 'create_asset_upload_url', 'unpublish', 'one locale per', 'workflow', 'environment'],
  mustNot: ['../', 'Mutation API', 'upload_asset`', 'migrate-content', 'manage-environments'],
});

RULES.push(
  { file: 'README.md',
    must: ['claude plugin marketplace add preprio/prepr-skills', 'claude plugin install prepr@prepr', 'npx skills add preprio/prepr-skills',
           'connect-prepr', 'design-schema', 'create-schema', 'review-schema', 'manage-content', 'https://mcp.prepr.io', 'shared/', 'sync-shared'] },
  { file: 'FRESHNESS.md',
    must: ['https://mcp.prepr.io', 'list_schema', 'get_schema_entity', 'confirmToken', 'bearer_token_env_var',
           'Settings → Integrations → MCP Server', 'release-notes', 'Last verified'] },
  { file: 'docs/scenarios.md',
    must: ['Scratch', 'connect-prepr', 'PREPR_MCP_TOKEN', 'enum', 'confirmToken', 'review-schema', 'unpublish'] },
);

// Final-review fixes
RULES.push(
  { file: 'skills/connect-prepr/SKILL.md',
    must: ['.vscode/mcp.json', 'claude mcp get prepr', 'whole entry', 'mask', 'rotate', '"type"', 'prepr-token'] },
  { file: 'skills/connect-prepr/references/clients.md',
    must: ['prepr-token', 'let the user run'],
    mustNot: ['and GitHub Copilot CLI. Write the OAuth entry there once'] },
  { file: 'shared/mcp-connection.md',
    must: ['organization', 'never print, copy or write', 'ask the user which environment', 'environment argument'] },
  { file: 'shared/write-safety.md',
    must: ['do not write until'] },
  { file: 'skills/manage-content/SKILL.md',
    must: ['the user has said'],
    mustNot: ['recreating freely'] },
);

// Deferred-minor fixes
RULES.push(
  { file: 'shared/schema-design-principles.md',
    mustNot: ['localize-content', 'query-content', "spec's"] },
  { file: 'shared/write-safety.md',
    must: ['unless the confirmed plan says to continue', 'schema tools have no dry-run', 'immediately before the write',
           'removing an option', 'the **environment** you will write to', 'comments'] },
  { file: 'shared/mcp-connection.md',
    must: ['not installed', 'https://docs.prepr.io/prepr-mcp-server/getting-started'] },
  { file: 'skills/manage-content/SKILL.md',
    must: ['validateonly', 'up to 25 items'],
    mustNot: ['without confirmation', 'do them in batches', 'a few dozen'] },
  { file: 'skills/connect-prepr/references/clients.md',
    must: ['"oauth": false'] },
  { file: 'skills/review-schema/SKILL.md',
    mustNot: ['middle group', 'references/write-safety.md'] },
  { file: 'skills/create-schema/SKILL.md',
    must: ['name the environment'] },
);

// Publishing
RULES.push(
  { file: '.claude-plugin/plugin.json',
    must: ['"icon": "./assets/icon.png"', '"documentationUrl": "https://', '"supportUrl": "https://', '"privacyPolicyUrl": "https://', '"termsOfServiceUrl": "https://'] },
  { file: '.github/workflows/ci.yml', must: ['plugin validate --strict'] },
  { file: 'README.md', must: ['claude plugin install prepr --marketplace preprio/prepr-skills', 'claude plugin update prepr@prepr', 'auto-update', 'bump-version'] },
  { file: 'CHANGELOG.md', must: ['## Unreleased', '## 0.1.0'] },
);

// Maintainer skill
RULES.push({
  file: '.claude/skills/check-freshness/SKILL.md',
  must: ['name: check-freshness', 'FRESHNESS.md', 'https://docs.prepr.io/prepr-mcp-server/release-notes',
         'safety-limitations', 'Source:', 'Last verified', 'report before changing', 'content.test.mjs', 'CHANGELOG.md',
         'unreachable', 'list_schema', 'internal: true'],
  mustNot: ['schema-spec', 'prepr-toolkit', 'action-schema-validation', 'recommedations'],
});

// Live-test improvements
RULES.push(
  { file: 'shared/mcp-connection.md', must: ['get_initial_context'] },
  { file: 'skills/connect-prepr/SKILL.md', must: ['get_initial_context'] },
  { file: 'skills/review-schema/SKILL.md', must: ['up to 3 items'] },
  { file: 'FRESHNESS.md', must: ['live tool schemas', 'get_initial_context', 'validateOnly'] },
);

// Codex plugin, onboarding friction, known errors, examples
RULES.push(
  { file: 'README.md',
    must: ['codex plugin marketplace add preprio/prepr-skills', 'codex plugin add prepr@prepr', 'codex mcp login prepr', '## What you can ask'] },
  { file: 'skills/connect-prepr/references/clients.md',
    must: ['Prepr Codex plugin'] },
  { file: 'skills/connect-prepr/SKILL.md',
    must: ['Scratch environment', 'permissions.allow', 'only after the user agrees'],
    mustNot: ['mcp__prepr__*'] },
  { file: 'shared/mcp-limits.md',
    must: ['## Known errors', 'validator.error.max.gte', '{"success":false}'] },
  { file: 'FRESHNESS.md',
    must: ['Codex plugin', '.agents/plugins/marketplace.json', 'agent-plugins.org'] },
  { file: 'AGENTS.md',
    must: ['plugin.json', 'mcp.json', '.agents/plugins/marketplace.json', 'eval-routing', 'scenario.mjs'] },
);

// Public-repo hygiene
const INTERNAL = ['kevin', 'preprio/prepr-mcp', 'prepr-mcp develop'];
RULES.push(
  { file: 'docs/scenarios.md', mustNot: INTERNAL },
  { file: 'FRESHNESS.md', mustNot: INTERNAL },
  { file: '.claude/skills/check-freshness/SKILL.md', mustNot: INTERNAL },
  { file: 'CHANGELOG.md', mustNot: ['## Unreleased\n\n-'] },
);

// AI context guidance
RULES.push(
  { file: 'shared/ai-context.md',
    must: ['ai_goal', 'ai_purpose', '## Models', '## Fields', '## Environment AI context', 'Weak', 'Strong',
           'Settings → General', 'get_initial_context', 'paste'] },
  { file: 'skills/create-schema/SKILL.md', must: ['references/ai-context.md'] },
  { file: 'skills/review-schema/SKILL.md', must: ['references/ai-context.md', 'weak'] },
  { file: 'skills/design-schema/SKILL.md', must: ['references/ai-context.md#environment-ai-context', 'Environment AI context'] },
  { file: 'skills/connect-prepr/SKILL.md', must: ['references/ai-context.md#environment-ai-context'] },
);

// get_initial_context returns the environment AI context
RULES.push(
  { file: 'shared/ai-context.md', must: ['`get_initial_context` returns'], mustNot: ["if it doesn't, ask"] },
  { file: 'skills/connect-prepr/SKILL.md', mustNot: ["if you\ncan't tell, skip this step", "can't tell, skip"] },
  { file: 'FRESHNESS.md', must: ['Environment AI context'] },
);

for (const r of RULES) {
  test(`${r.file}`, () => {
    const path = ROOT + r.file;
    assert.ok(existsSync(path), `${r.file} missing`);
    const text = readFileSync(path, 'utf8').toLowerCase();
    for (const s of r.must ?? []) assert.ok(text.includes(s.toLowerCase()), `${r.file} must mention "${s}"`);
    for (const s of r.mustNot ?? []) assert.ok(!text.includes(s.toLowerCase()), `${r.file} must not mention "${s}"`);
  });
}
