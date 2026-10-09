# Changelog

## Unreleased

## 0.1.0

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
