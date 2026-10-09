---
name: check-freshness
description: >-
  Use this skill when maintaining the prepr-skills repository itself and the
  upstream facts its skills depend on need re-verifying: on a periodic
  maintenance pass, after a Prepr MCP server release-notes entry, when an
  agent client (Claude Code, Cursor, VS Code, Codex, OpenCode, Copilot CLI)
  changes its MCP config format, before a release, or when the user asks
  whether the skills are still up to date. Not for end users of the plugin.
license: MIT
metadata:
  author: Prepr
  category: maintenance
  internal: true
---

# Check skill freshness against upstream

The skills read live tool schemas at runtime, but some facts are written into
them: the server URL, auth routes, server rules for schema and content tools,
and each client's MCP config format. Every such fact is a row in
`FRESHNESS.md` at the repo root. This skill verifies those rows and reports
drift. It never changes a skill without the maintainer's go-ahead.

## Procedure

1. **Read `FRESHNESS.md`.** It is the work list. A fact stated in a skill or in
   `shared/` but missing from the table is itself a finding: propose a row.
2. **Fetch each row's source and compare** with the pinned value:
   - **Prepr MCP server:**
     https://docs.prepr.io/prepr-mcp-server/release-notes (every entry newer
     than the oldest "Last verified" date),
     https://docs.prepr.io/prepr-mcp-server/safety-limitations and
     https://docs.prepr.io/prepr-mcp-server/authorization. Compare with
     `shared/mcp-limits.md`, `shared/write-safety.md` and
     `shared/mcp-connection.md`. Watch for renamed or replaced tools (as
     `get_schema` became `list_schema` and `get_schema_entity`), new write
     limits, a dry-run or environment parameter on schema tools, and changes
     to the delete confirmation (`confirmToken`).
   - **Client config formats:** the vendor doc linked under `Source:` in each
     section of `skills/connect-prepr/references/clients.md`, plus Prepr's
     per-client guides under
     https://docs.prepr.io/prepr-mcp-server/getting-started. Check file
     location, root key, the `type` value, header syntax, env-var syntax, and
     the authorize command.
   - **Links:** every URL in a skill or reference should still load without a
     404 or a redirect to an unrelated page.
3. **Sweep for unknown drift.** Fetch https://docs.prepr.io/llms.txt and skim
   the MCP and content-modeling sections for new capabilities or renamed pages
   that the skills don't cover or that contradict their text.
4. **Report before changing anything.** Per row: unchanged, drifted (old →
   new, and which skills and shared files are affected), or source
   unreachable. Add anything from the sweep. Then wait for the maintainer to
   decide what to change.
5. **When fixing drift:**
   1. Add or update the pinned text in `tests/content.test.mjs` first and watch
      it fail.
   2. Edit `shared/` (then `node scripts/sync-shared.mjs`) or the skill.
   3. Update the matching `FRESHNESS.md` row and its **Last verified** date.
   4. Add a line under `## Unreleased` in `CHANGELOG.md`. Drift fixes are
      usually a patch release.
   5. Run the checks from `AGENTS.md`.

## Rules

- A row counts as verified only if its source was fetched in this run. If the
  source is unreachable, say so and leave the date alone.
- Never update a skill without its `FRESHNESS.md` row, or the row without the
  skill. A half-updated pair is worse than a stale one.
- Facts come from the fetched source, never from memory or from this file.
- Rows whose source says "server implementation" are not in the public docs.
  Confirm them from the live tool schemas or with a scenario run, and say
  which rows you could not confirm.
- Never push, tag or publish; that is the maintainer's call.
