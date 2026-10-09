# Working on prepr-skills

This repo ships five agent skills for Prepr CMS that work through the Prepr
MCP server (`https://mcp.prepr.io`): connect-prepr, design-schema,
create-schema, review-schema and manage-content. It is installed as a Claude
Code plugin (`.claude-plugin/`) and through `npx skills add
preprio/prepr-skills`. There is no runtime code; the product is the Markdown
in `skills/`.

## Layout

- `.claude-plugin/`: Claude Code plugin and marketplace. `plugin.json` and
  `mcp.json` at the root: the portable package Codex and ChatGPT install,
  listed by `.agents/plugins/marketplace.json`. Name, version, URL and the
  client header must match across both; `scripts/check.mjs` enforces it.
- `skills/<name>/SKILL.md`: one skill. Frontmatter `name` must equal the
  folder name; `description` decides when agents load the skill, so treat it
  as the most important text in the file.
- `skills/<name>/references/`: files the skill links to. Some are
  skill-specific (`clients.md`, `field-types.md`); the rest are **generated
  copies** of `shared/`.
- `shared/`: rules used by several skills. `scripts/shared-map.mjs` says which
  skill gets which file.
- `scripts/check.mjs`: repo lint. `scripts/sync-shared.mjs`: copies `shared/`
  into skills. `scripts/bump-version.mjs`: releases.
- `tests/`: `node:test`. `content.test.mjs` pins text each file must or must
  not contain; `check.test.mjs` and `bump.test.mjs` test the scripts.
- `docs/scenarios.md`: manual scenarios to run against a Scratch environment
  before a release. `FRESHNESS.md`: upstream facts the skills depend on.
- `.claude/skills/`: maintainer-only skills such as `check-freshness` (run it
  after an MCP release-notes entry or before a release). They must set
  `metadata.internal: true`, or `npx skills add` installs them for end users.

## Rules

- **Never edit `skills/*/references/` copies of shared files.** Edit
  `shared/<file>`, then run `node scripts/sync-shared.mjs`. CI fails on drift.
- **Each skill folder must stand alone.** `npx skills` copies one folder at a
  time, so no link may leave it (`../` is an error). Shared material reaches a
  skill only as a synced copy. Every file in `references/` must be linked from
  the skill.
- **MCP only.** The skills change schema and content through the Prepr MCP
  tools. No `prepr/schema/` JSON files, schema validator, Git sync, or
  Mutation API.
- **Never hard-code a tool list.** Name a tool only for a rule attached to it
  (`list_schema`, `get_schema_entity`, `confirmToken`) and tell the agent to
  read the live tool schemas.
- **Every write follows plan → confirm → apply → verify** (`shared/write-safety.md`),
  naming the target environment. Don't add shortcuts that skip the user's yes.
- **Tokens are never asked for, printed or written.** Configs reference
  `PREPR_MCP_TOKEN` only.
- **The server URL is exactly `https://mcp.prepr.io`**, never `/mcp`.
- **Only the five skills ship.** Don't reference skills from the larger
  `preprio/prepr-plugins` repo (plan-project, setup-project, sync-schema,
  query-content, …).
- **Upstream facts come from the docs, not memory.** Before changing a fact
  about the MCP server or a client's config format, check the source linked in
  `FRESHNESS.md` and update its row and date.

## Changing a skill

1. Add or adjust the rule in `tests/content.test.mjs` first and watch it fail.
2. Edit the skill (or `shared/`, then sync).
3. Run the checks below until they pass.
4. Add a line under `## Unreleased` in `CHANGELOG.md`.

Keep skill text short and direct: second person, one instruction per
sentence, no filler. Wrap prose at about 78 characters, but keep a phrase a
test pins on one line.

## Checks

Run all of these before committing; CI runs the same. Keep `CLAUDE.md` in
`.claude/`: at the repo root it fails `plugin validate --strict`.

```bash
node scripts/sync-shared.mjs --check && node scripts/check.mjs && node --test && claude plugin validate --strict .
```

## Before a release

- `node scripts/eval-routing.mjs` sends the prompts in
  `tests/routing.json` to headless Claude Code and checks each one loads the
  expected skill. It calls the model, so it is not part of CI; run it after
  changing any `description`.
- `node scripts/scenario.mjs` runs one turn of a scenario from
  `docs/scenarios.md` in a project where the skills and Prepr are set up, and
  prints the skill, tool calls and reply. Use `SkillsTest` names and finish
  with the cleanup scenario.

## Trying a change locally

Install into a scratch project, not your global setup:

```bash
npx skills add ~/path/to/prepr-skills -a claude-code -y
```

Skills are copied, so re-run it after each change. If the
`preprio/prepr-plugins` plugin is installed globally, disable it while
testing (`claude plugin disable prepr@prepr`); its skills share names with
these.

## Releasing

See "Releasing" in `README.md`: `node scripts/bump-version.mjs <x.y.z>`,
commit, `git tag v<x.y.z>`, push with tags. Run the release-blocking
scenarios in `docs/scenarios.md` first. Never push, tag or publish without
the maintainer's go-ahead.

Commit messages: imperative subject, a body that says why.
