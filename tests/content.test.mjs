import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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
  mustNot: ['../', 'plan-project', 'setup-project', 'schema-spec', 'RemoteSource', 'project-plan.md'],
});

RULES.push(
  { file: 'skills/create-schema/SKILL.md',
    must: ['name: create-schema', 'references/write-safety.md', 'references/field-types.md', 'references/mcp-limits.md',
           'list_schema', 'get_schema_entity', 'connect-prepr', 'environment', 'one call', 'AI', 'naming', 'design-schema'],
    mustNot: ['../', 'schema-spec', 'RemoteSource'] },
  { file: 'skills/create-schema/references/field-types.md',
    must: ['use when', "don't use when", 'Stack', 'Component', 'Content reference', 'Enum', 'minimum of 1'],
    mustNot: ['"type":', 'prepr/schema/', 'importer', 'schema_version'] },
);

RULES.push({
  file: 'skills/review-schema/SKILL.md',
  must: ['name: review-schema', 'list_schema', 'get_schema_entity', 'read-only', 'create-schema', 'connect-prepr',
         'references/schema-design-principles.md', 'Fix before content exists', 'Fix any time', "What's good", 'environment'],
  mustNot: ['../', 'Blocks import', 'CI guardrail', 'scripts/'],
});

RULES.push({
  file: 'skills/manage-content/SKILL.md',
  must: ['name: manage-content', 'references/write-safety.md', 'references/mcp-limits.md', 'connect-prepr',
         'upload_asset_from_public_url', 'create_asset_upload_url', 'unpublish', 'one locale per', 'workflow', 'environment'],
  mustNot: ['../', 'Mutation API', 'upload_asset`', 'manage-environments'],
});

RULES.push(
  { file: 'README.md',
    must: ['claude plugin marketplace add preprio/prepr-skills', 'claude plugin install prepr@prepr', 'npx skills add preprio/prepr-skills',
           'connect-prepr', 'design-schema', 'create-schema', 'review-schema', 'manage-content', 'migrate-content',
           'https://mcp.prepr.io', 'shared/', 'sync-shared'] },
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

// Adaptive content: personalization and A/B test variants in stacks
RULES.push(
  { file: 'skills/manage-content/SKILL.md', must: ['references/adaptive-content.md', 'personaliz', 'A/B'] },
  { file: 'skills/manage-content/references/adaptive-content.md',
    must: ['_context', 'group', 'segments', 'JSON Pointer', '_Segments', 'includeRaw', 'replaces the whole',
           'Prepr-Segments', 'default variant', '## A/B tests', 'ab_test', '["A"]', '["B"]'],
    mustNot: ['../', 'Mutation API'] },
  { file: 'FRESHNESS.md', must: ['Adaptive content'] },
);

// Two schema routes: live through MCP, or files in prepr/schema/ with Git sync
RULES.push(
  { file: 'shared/schema-route.md',
    must: ['prepr/schema/', 'Git sync', 'run Export', 'A commit is not a sync', 'Export', 'Import', 'deletes',
           'not documented', 'ask the user', 'both are fine'],
    mustNot: ['../', 'source of truth', 'unless the user explicitly chooses'] },
  { file: 'shared/schema-files.md',
    must: ['one JSON file per', 'body_singular', 'api_id', '## Validation is not import', 'schema_version'],
    mustNot: ['../', '_shared', 'setup-project', 'plan-project'] },
  { file: 'skills/sync-schema/SKILL.md',
    must: ['name: sync-schema', 'references/schema-route.md', 'references/schema-files.md', 'references/mcp-connection.md',
           'prepr-schema-validation.yml@v1.0.15', 'A commit is not a sync', 'github.validation.failed', 'Export', 'Import',
           'environment'],
    mustNot: ['../', 'setup-project', 'migrate-content', 'manage-environments', 'create-component', 'plan-project'] },
  { file: 'skills/create-schema/SKILL.md',
    must: ['references/schema-route.md', 'references/schema-files.md', 'prepr/schema/', 'sync-schema', 'run Export'],
    mustNot: ['unless the user explicitly chooses otherwise'] },
  { file: 'skills/review-schema/SKILL.md', must: ['references/schema-route.md', 'prepr/schema/', 'drift'] },
  { file: 'skills/design-schema/SKILL.md', must: ['create-schema picks the route'] },
  { file: 'README.md', must: ['sync-schema', 'prepr/schema/'] },
  { file: 'AGENTS.md', must: ['sync-schema', 'prepr/schema/'], mustNot: ['MCP only', 'Only the five skills'] },
  { file: 'FRESHNESS.md', must: ['Git sync', 'prepr-schema-validation.yml@v1.0.15'] },
);

// Findings from live use of the MCP server
RULES.push(
  { file: 'shared/mcp-limits.md',
    must: ['Missing required fields for workflow stage Done', 'additional properties'],
    mustNot: ['review_urls/0/url', '403'] },
  { file: 'skills/manage-content/SKILL.md',
    must: ['returned slug', 'archived', 'locales', 'query_assets'] },
  { file: 'skills/connect-prepr/SKILL.md', must: ['same environment'] },
  { file: 'shared/write-safety.md', must: ['is not the yes', 'also in a cleanup'] },
);

// Review 2026-10-13: route contradictions, docs alignment, routing gaps
RULES.push(
  { file: 'shared/mcp-connection.md', mustNot: ['Only\n  `design-schema` continues without MCP', 'Every other skill stops here'],
    must: ['schema files in `prepr/schema/`'] },
  { file: 'shared/schema-route.md', must: ['Singular name', 'Type name', 'rename'] },
  { file: 'skills/sync-schema/SKILL.md', must: ['import preview', 'schema_version', 'drift'],
    mustNot: ['source of truth', 'the one known cause'] },
  { file: 'shared/schema-files.md', must: ['unique across'] },
  { file: 'skills/manage-content/SKILL.md', must: ['A/B test variants'] },
  { file: 'skills/design-schema/SKILL.md', must: ['read the files in `prepr/schema/`'] },
  { file: 'skills/connect-prepr/SKILL.md', must: ['(`sync-schema`)'] },
  { file: 'FRESHNESS.md', must: ['import preview', 'Ignore required fields with conditional visibility'] },
  { file: 'shared/mcp-limits.md', must: ['Ignore required fields with conditional visibility', 'Required field validation'],
    mustNot: ['The check applies even when the editor hides that field'] },
  { file: 'skills/manage-content/SKILL.md', mustNot: ['403', 'check the asset permissions'] },
);

// Lessons from a scripted demo build: batch route
RULES.push(
  { file: 'shared/batch-route.md',
    must: ['connected MCP tools', 'one plan', 'one yes', 'state file', 'stop at the first error', 'phase',
           'at most 25', 'more than 25 content items', 'Optional: a script', 'already set',
           'https://mcp.prepr.io', 'tools/call', 'text/event-stream', 'isError', 'get_initial_context',
           'never print'],
    mustNot: ['../', 'mcp.prepr.io/mcp', 'Mutation API', 'about 50', 'ask the user to set it', 'Prepr Support'] },
  { file: 'skills/manage-content/SKILL.md', must: ['references/batch-route.md', 'more than 25 items'],
    mustNot: ['about 50', 'write a script'] },
  { file: 'skills/create-schema/SKILL.md', must: ['references/batch-route.md'], mustNot: ['Write a script'] },
  { file: 'docs/scenarios.md', must: ['## 10. Batch route', 'state file', 'without `PREPR_MCP_TOKEN`'] },
  { file: 'shared/mcp-limits.md', must: ['read tools'] },
);

// Editor experience: help text, sections, widths, component display, conditions
RULES.push(
  { file: 'shared/schema-design-principles.md',
    must: ['### Help text', 'above the field', 'tooltip', 'placeholder', 'Help text field', '### Sections',
           'collapsed', 'no tabs', '### Field widths', 'always full width', '### Component display',
           'display fields as a group', 'preview image', '### Field order', '### Required and defaults',
           'Done', 'examples', 'read-only', 'filled', 'regex', 'the ID does not change'] },
  { file: 'shared/schema-files.md',
    must: ['"placeholder"', '`100`, `80`, `75`, `67`, `50`, `33`, `25`, or `20`', '"filled"', '"regex"',
           '"closed"', 'appearance_image', 'appearance_tag', '"developer_only"', '"framed": true'],
    mustNot: ['`100`, `50`, or `33`'] },
  { file: 'skills/create-schema/SKILL.md',
    must: ['## Design the editor\'s form', 'references/schema-design-principles.md#the-editors-form',
           'move_schema_field', 'Column', 'cannot be created through MCP', 'help text', 'width', 'condition'] },
  { file: 'skills/create-schema/references/field-types.md',
    must: ['## Settings every field has', '## Section', 'Display fields as a group', 'Stack and Dynamic content',
           'Help text field', 'empty or not empty'] },
  { file: 'skills/design-schema/SKILL.md',
    must: ['**Form**', 'sections', 'help text', 'conditions'] },
  { file: 'skills/review-schema/SKILL.md',
    must: ['help text', 'collapsed', 'side by side', 'placeholder', 'framed'] },
  { file: 'shared/schema-design-principles.md',
    must: ['### Composable sections', 'label, heading, sub-heading', 'shared heading component',
           'one content section with blocks', 'Developer-friendly first', 'Few options', 'as simple as'],
    mustNot: ['Key insight', 'does most of the work', 'generic block container'] },
  { file: 'shared/schema-design-principles.md',
    must: ['one grid component with a columns enum', 'Group by owner', 'once a second model', 'one way',
           'per stack', 'Ask'],
    mustNot: ['BentoGrid', 'PricingCardGrid', 'toggle_discount_label', 'card_width', 'NavColumn', 'menu groups',
              'site-wide stats', 'MediaWidth', 'override_defaults', '_Sections', '_Blocks', '_Shared',
              'every `sections` and `blocks` stack', 'Add a `Personalization` model', 'price_monthly',
              'price_annually', 'CaseStudy', 'FeatureGrid', '{parent_page.slug}/{internal_title}/'] },
  { file: 'FRESHNESS.md',
    must: ['Field help text', 'Field widths', 'Conditional visibility', 'Sections', 'Component display', 'Column field'] },
);


// migrate-content: move content from another CMS or an old Prepr environment into a new schema
RULES.push(
  { file: 'skills/migrate-content/SKILL.md',
    must: ['name: migrate-content', 'references/mcp-connection.md', 'references/write-safety.md',
           'references/payloads.md', 'references/script.md', 'Export to', 'design-schema', 'create-schema',
           'manage-content', 'Test environment', 'empty', 'create', 'fill', 'id map', '--dry-run', 'Review',
           'Mutation API', 'Settings → Access tokens', 'Bound to user', 'PREPR_TARGET_TOKEN', 'PREPR_SOURCE_TOKEN',
           '.gitignore', 'never print', 'never writes to the source', 'ask about', 'report', 'Production'],
    mustNot: ['../', 'prepr-migrator', 'mcp.prepr.io/mcp', 'paste your token', 'enter your token'] },
  { file: 'skills/migrate-content/references/payloads.md',
    must: ['https://mutation.prepr.io', 'POST /content_items', 'PUT /content_items/{id}', 'entire body',
           '{"value"', '{"body"', '"items": [{"id"', 'component', 'not its `ref`', 'workflow_stage', 'publish_on',
           'slug', 'unique', 'allowed', 'Y-m-d', 'latitude', 'reference_id', '25MB'],
    mustNot: ['../', 'prepr-migrator'] },
  { file: 'skills/migrate-content/references/script.md',
    must: ['--dry-run', '--model', '--slug', '--id', '--limit', 'id-map', '429', 'X-Prepr-Retry-After',
           '200', 'report', 'plain JavaScript', 'process.env.PREPR_TARGET_TOKEN', 'one mapper', 'exit'],
    mustNot: ['../', 'prepr-migrator', 'console.log(process.env', 'TypeScript types'] },
  { file: 'skills/manage-content/SKILL.md', must: ['migrate-content'] },
  { file: 'docs/scenarios.md', must: ['## 11. Migrate content', '11c', 'WordPress'] },
  { file: 'skills/migrate-content/SKILL.md',
    must: ['## Sources outside Prepr', 'references/transform.md', 'snapshot', 'SOURCE_', 'read-only',
           'translation', 'taxonom', 'Tags field', 'content freeze', 'UNIX timestamp', 'timezone'] },
  { file: 'skills/migrate-content/SKILL.md', must: ['references/umbraco.md', 'Umbraco'] },
  { file: 'skills/migrate-content/references/umbraco.md',
    must: ['Content Delivery API', '/umbraco/delivery/api/v2/content', 'Api-Key', 'Accept-Language', 'skip', 'take',
           'sort=', 'expand=properties[$all]', 'published', 'Preview: true', 'Media Delivery API', 'relative',
           'markup', 'umb-rte-block', 'Block List', 'Block Grid', 'localLink', 'data-udi', 'Management API',
           'uSync', 'Nested Content', 'UMBRACO_MACRO', 'Accept-Language', 'umbracoRedirectUrl', 'Members',
           'Umbraco Forms', 'Dictionary', 'version', 'UMBRACO_API_KEY'],
    mustNot: ['../', 'prepr-migrator'] },
  { file: 'docs/scenarios.md', must: ['11d', 'Umbraco'] },
  { file: 'FRESHNESS.md', must: ['Umbraco'] },
  { file: 'skills/migrate-content/references/transform.md',
    must: ['Portable Text', 'Gutenberg', 'shortcode', 'Contentful', 'clean HTML', 'dynamic content',
           '<img', 'upload', 'internal links', 'id map', 'redirect map', 'old URL', 'Social', 'YouTube',
           'report'],
    mustNot: ['../', 'prepr-migrator'] },
  { file: 'FRESHNESS.md', must: ['Mutation API', 'Bound to user', 'X-Prepr-Retry-After'] },
);

// Front end: build-frontend and personalize-and-track, with a shared toolkit reference
RULES.push(
  { file: 'skills/build-frontend/SKILL.md',
    must: ['name: build-frontend', 'references/mcp-connection.md', 'references/queries.md', 'references/fetchers.md',
           'references/types.md', 'references/rendering.md', 'references/caching-preview.md', 'references/toolkit.md',
           'introspection', 'prepr/schema/', 'read-only', 'Preview token', 'unpublished', '__typename', '404',
           'personalize-and-track', 'ask', 'prefer `.graphql` files'],
    mustNot: ['../', 'as a secret', 'createPreprProxy', 'PreprStack'] },
  { file: 'skills/build-frontend/references/queries.md',
    must: ['_id', '_slug', '__typename', '_context', 'where', 'limit', 'skip', 'total', '_slug_any', 'locale',
           'Prepr-Locale', 'url(width:', '... on', 'ContentItems', 'defaults to 10', 'items {'],
    mustNot: ['../', '_typename {'] },
  { file: 'skills/build-frontend/references/fetchers.md',
    must: ['https://graphql.prepr.io/', 'fetch(', 'axios', 'graphql-request', 'urql', 'Apollo', 'PHP', 'errors',
           '415', 'Content-Type', 'Preview token', 'getPreprHeaders'],
    mustNot: ['../', 'never in the browser', 'as a secret'] },
  { file: 'skills/build-frontend/references/types.md',
    must: ['@graphql-codegen/cli', "preset: 'client'", 'fragmentMasking', 'strict mode', 'introspection', 'alias',
           'one fragment per', 'schema.changed', '## Where queries live', 'prefer `.graphql` files',
           'already has', 'graphql(`', "'src/**/*.{ts,tsx}'"],
    mustNot: ['../'] },
  { file: 'skills/build-frontend/references/rendering.md',
    must: ['registry', '__typename', 'null', 'warn', '_id', 'Redirect', '404', 'data.Page', 'limit', 'rich text',
           'stega', 'width', 'height'],
    mustNot: ['../'] },
  { file: 'skills/build-frontend/references/caching-preview.md',
    must: ['webhook', 'Prepr-Signature', 'tag', 'Preview token', 'draft', 'frame-ancestors', 'Enable edit mode',
           'stega', 'X-Prepr-Cache', 'personaliz', '12 seconds'],
    mustNot: ['../', 'rate limit', 'What your app may cache', 'cache them (static generation', 'Prefer revalidation',
              'safest start'] },
  { file: 'skills/personalize-and-track/SKILL.md',
    must: ['name: personalize-and-track', 'references/mcp-connection.md', 'references/tracking.md',
           'references/personalization.md', 'references/toolkit.md', 'build-frontend', 'consent', 'Segments'],
    mustNot: ['../', 'createPreprProxy', 'PreprStack'] },
  { file: 'skills/personalize-and-track/references/tracking.md',
    must: ['Settings → Event management', 'prepr:id', 'prepr:locale', 'prepr:customer-id', 'data-prepr-variant-key',
           'data-prepr-variant-event', 'data-prepr-item-id', 'trackEvent', 'View', 'SignUp', 'pixel.gif',
           'https://tracking.prepr.io/events', 'consent', 'tracking-only', 'impression', 'conversion'],
    mustNot: ['../', 'email address as'] },
  { file: 'skills/personalize-and-track/references/personalization.md',
    must: ['Prepr-Customer-Id', '__prepr_uid', 'Prepr-Segments', 'Prepr-Visitor-IP', 'Prepr-ABTesting',
           'case-insensitive', 'personalize: false', 'Prepr-Bucket-Customer', 'X-Prepr-Customer-Bucket', '_context',
           'variant_key', 'never cache', 'fall back', 'Vary', 'Similar_', 'prepr_preview_segment', 'first'],
    mustNot: ['../'] },
  { file: 'shared/toolkit.md',
    must: ['@preprio/toolkit', '0.4', 'reads no environment variables', 'createPreprMiddleware', 'onPreprRequest',
           'preprHandle', 'handlePreprRequest', 'processPreprRequest', 'getPreprHeaders', 'PreprTrackingPixel',
           'extractAccessToken', 'features', 'README', '@preprio/prepr-nextjs', 'preview'],
    mustNot: ['../', 'createPreprProxy', 'PreprStack', 'preview: true }'] },
  { file: 'README.md', must: ['build-frontend', 'personalize-and-track'] },
  { file: 'FRESHNESS.md', must: ['GraphQL endpoint', 'Toolkit', 'Tracking'] },
  { file: 'docs/scenarios.md', must: ['## 12. Build a front end', '## 13. Personalize and track'] },
);

// Pages that will be personalized or A/B tested are never cached
RULES.push(
  { file: 'skills/build-frontend/SKILL.md', must: ['A/B test or personalize', 'not cached'] },
  { file: 'skills/build-frontend/references/caching-preview.md',
    must: ['## Pages that are personalized or A/B tested', 'plans to', 'whole page', 'static generation', 'ISR',
           'CDN', 'Cache-Control: private, no-store', 'later'] },
  { file: 'skills/personalize-and-track/SKILL.md', must: ['Never cache a page', 'Cache-Control: private, no-store'] },
  { file: 'skills/personalize-and-track/references/personalization.md',
    must: ['## Never cache the page', 'Cache-Control: private, no-store', 'switch those pages'],
    mustNot: ['a static\n  page with a personalized section'] },
);

// Preview access patterns
RULES.push(
  { file: 'skills/build-frontend/references/caching-preview.md',
    must: ['### Preview patterns', 'Vercel Deployment Protection', 'x-vercel-protection-bypass',
           'x-vercel-set-bypass-cookie=samesitenone', 'iframe', 'Your own authentication', 'SameSite=None; Secure',
           'webhook', 'draft mode', '/api/draft?secret=', 'redirect=/{slug}', 'relative path', '404',
           'not the preview token', 'rest of the browser session'] },
  { file: 'FRESHNESS.md', must: ['Preview access'] },
);

// Updating migrated items without losing data
RULES.push(
  { file: 'skills/migrate-content/SKILL.md', must: ['references/updates.md'] },
  { file: 'skills/migrate-content/references/updates.md',
    must: ['entire body', 'emptied', 'who owns', 'read the item', 'merge', 'changed_on', 'conflict', 'backup',
           'last written', 'dry run', 'diff', 'PATCH', 'Stack', 'goes live', 'workflow_stage', 'one locale',
           'round trip', 'restore'],
    mustNot: ['../', 'prepr-migrator'] },
  { file: 'docs/scenarios.md', must: ['11e'] },
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

// Skills teach patterns; they never point at a specific project or site
test('no skill or shared file refers to a specific project', () => {
  const files = [...readdirSync(ROOT + 'shared').map((f) => 'shared/' + f)];
  for (const skill of readdirSync(ROOT + 'skills')) {
    files.push(`skills/${skill}/SKILL.md`);
    const refs = ROOT + `skills/${skill}/references`;
    if (existsSync(refs)) for (const f of readdirSync(refs)) files.push(`skills/${skill}/references/${f}`);
  }
  const banned = ['worked example', 'in the example', 'the example schema', 'the site it came from', 'that project',
                  'real marketing-site', "prepr's own migration", "prepr's own website", 'prepr-marketing', 'wildkamp'];
  for (const f of files) {
    const text = readFileSync(ROOT + f, 'utf8').toLowerCase();
    for (const b of banned) assert.ok(!text.includes(b), `${f} mentions "${b}"`);
  }
});
