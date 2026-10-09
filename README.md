# Prepr skills

Skills that let your AI agent design, build and review your Prepr content
model, and manage content, through the Prepr MCP server
(`https://mcp.prepr.io`).

| Skill | What it does |
|---|---|
| connect-prepr | Adds the Prepr MCP server to your agent and walks you through authorizing it |
| design-schema | Turns a brief into an agreed content model plan |
| create-schema | Builds models, components, enums and fields in Prepr, after you approve the plan |
| review-schema | Reviews a live schema and suggests fixes (read-only) |
| manage-content | Creates, updates, schedules and uploads content |

## Install

Claude Code (v2.1.292 or later):

```bash
claude plugin install prepr --marketplace preprio/prepr-skills
```

On older versions, add the marketplace first:

```bash
claude plugin marketplace add preprio/prepr-skills
```

```bash
claude plugin install prepr@prepr
```

The plugin registers the Prepr MCP server. Run `/mcp`, select `prepr`, and
sign in.

Updates are not automatic for plugins installed from GitHub. Update with
`claude plugin update prepr@prepr`, or turn on auto-update under `/plugin` →
Marketplaces.

Cursor, Codex, VS Code, GitHub Copilot, OpenCode and other agents:

```bash
npx skills add preprio/prepr-skills
```

Then ask your agent to "connect to Prepr". The connect-prepr skill adds the
server to your project config and explains how to authorize. Clients without
OAuth support use an MCP token from Prepr Support; the skills never ask for or
store the token itself.

## Safety

Every write shows a plan naming the environment and waits for your yes.
Deletes always need a second confirmation. To block schema changes from AI
agents on production, go to Settings → Integrations → MCP Server in Prepr.

## Contributing

Rules shared by several skills live in `shared/`. Edit them there, then run
`node scripts/sync-shared.mjs` to copy them into each skill's `references/`.
CI runs `node scripts/sync-shared.mjs --check`, `node scripts/check.mjs` and
`node --test`. Upstream facts the skills depend on are pinned in
`FRESHNESS.md`.

## Releasing

Versions follow semver and live in `.claude-plugin/plugin.json`. Claude Code
only offers an update when that version changes, so every release bumps it.

1. Add changes under `## Unreleased` in `CHANGELOG.md` as you merge them.
2. Run `node scripts/bump-version.mjs <x.y.z>`. It updates `plugin.json`, the
   marketplace metadata, the `X-Prepr-Client` header in `.mcp.json` and the
   skill snippets, and dates the changelog section.
3. Commit, tag and push: `git tag v<x.y.z> && git push --follow-tags`.

Patch: wording and fixes inside a skill. Minor: a new skill or new
behaviour. Major: a skill removed or renamed, or a change that needs users to
reconfigure.
