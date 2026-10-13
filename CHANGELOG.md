# Changelog

## Unreleased

## 0.2.0 (2026-10-13)

Git-synced schema files next to live MCP changes, and personalization and
A/B tests in manage-content.

- manage-content: add adaptive-content.md for personalized and A/B test
  stack variants (`_context` groups, segment ids, JSON Pointer writes,
  per-segment verification).
- New skill sync-schema: Git sync setup for `prepr/schema/`, CI validation
  with the official workflow, import impact assessment, and debugging failed
  imports.
- create-schema and review-schema support two routes: live through MCP, or
  schema files in `prepr/schema/` (new shared `schema-route.md` and
  `schema-files.md`). review-schema reports drift between environment and
  files.
- manage-content: check the returned slug, edit inside stacks with a JSON
  Pointer, report locales the tools cannot reach, an asset upload fallback,
  and a note that archived items still show on preview tokens.
- connect-prepr: check that the app's GraphQL token reads the same
  environment as MCP.
- Known errors: required component fields at Done, asset upload 403,
  `review_urls` placeholders, and parameters that differ per tool.

## 0.1.0 (2026-10-09)

First release.

- Skills: connect-prepr, design-schema, create-schema, review-schema and
  manage-content, working through the Prepr MCP server.
- Installs as a Claude Code plugin, a Codex and ChatGPT plugin, and through
  `npx skills` for Cursor, VS Code, GitHub Copilot, OpenCode and others.
- Every write is planned, confirmed, applied and read back; deletes use the
  server's two-step confirmation.
- connect-prepr sets up OAuth or token access per client, recommends a Scratch
  environment, and offers to allow the read-only Prepr tools.
- AI context guide for model `ai_goal` and field `ai_purpose`; design-schema
  drafts the environment AI context, review-schema flags weak descriptions.
- Release tooling: repo checks, routing eval, headless scenario runner and a
  version-bump script.
