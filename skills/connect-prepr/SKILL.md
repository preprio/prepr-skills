---
name: connect-prepr
description: >-
  Connect an AI agent to the Prepr MCP server. Use this skill whenever the
  user wants to connect, set up, authorize, or fix the Prepr MCP connection,
  Prepr tools are missing or unauthorized, another Prepr skill needs MCP and
  it is not configured, the user asks how to use Prepr from Claude Code,
  Cursor, Codex, VS Code, Copilot, OpenCode, Claude Desktop, or ChatGPT, or
  asks about a Prepr MCP token.
license: MIT
metadata:
  author: Prepr
---

# Connect to the Prepr MCP server

Add the Prepr MCP server (`https://mcp.prepr.io`) to the user's agent, get it
authorized, and prove it works with one read-only call.

First run [the check](references/mcp-connection.md#the-check). If Prepr tools
are already present, say so, name the environment, and stop.

## Step 1: Detect the client

Use the agent you are running in when you know it. Otherwise look for
`.claude/` or `.mcp.json`, `.cursor/`, `.codex/`, `.vscode/`, and
`opencode.json` in the project. If more than one client is in use, ask which
ones to configure. If nothing points to a client, ask.

Then look for an existing `prepr` entry in every place the client reads:

- Claude Code: the project `.mcp.json`, and `claude mcp get prepr` (local and
  user scopes in `~/.claude.json` take precedence over the project file).
- VS Code: `.vscode/mcp.json` and `.mcp.json`.
- Cursor: `.cursor/mcp.json`. Codex: `.codex/config.toml`. OpenCode:
  `opencode.json`.

## Step 2: Choose the auth route

- **OAuth** (default): Claude Code, Claude Desktop, Cursor, Codex, OpenCode,
  VS Code, ChatGPT. The user signs in to Prepr in the browser and picks an
  environment. Their Prepr role permissions apply.
- **Token**: GitHub Copilot CLI, or any client where the user says OAuth is
  not available. Tokens are issued by Prepr Support.

Recommend picking a Scratch environment for a first try. Writes go to
whatever environment is chosen when signing in, and a Scratch environment
makes it safe to see what the skills do.

## Step 3: Write the config

Use the snippet for the client from [clients.md](references/clients.md). A
project-root `.mcp.json` serves Claude Code and VS Code at once for OAuth; see
the note at the top of clients.md. Copilot CLI is token-only and gets its own
entry named `prepr-token`.

- Merge into the existing file. Keep other servers exactly as they are.
- If an existing `prepr` HTTP entry is present (for example with the old
  `/mcp` URL), update it in place in the file where it lives, even if that is
  not the file you would pick for a new entry: URL, headers, and the client's
  required `"type"`. Never leave two `prepr` entries that the same client reads.
- If the existing entry is a stdio or `mcp-remote` entry (a `command` instead
  of a `url`), replace the whole entry, and only after the user agrees.
  Otherwise print the snippet.
- If an existing entry holds a literal token, never print it: mask it as
  `Bearer ****` in anything you show. Replace it with the env-var reference and
  advise the user to rotate the token, since it has been stored in a file.
- If the file cannot be edited safely (JSON with comments, or an entry in a
  shape you do not recognise), do not touch it. Print the snippet and tell the
  user where it goes.
- Write project-level files directly. Never write a user-level file that
  would hold a token; give the user the command from clients.md instead
  (Copilot CLI).
- Claude Desktop and ChatGPT have no file. Give the steps from clients.md.

## Step 4: Token route only

1. The config references `PREPR_MCP_TOKEN` in the client's own syntax. Never
   ask for the token, never write it into any file, never echo it.
2. Tell the user how to get one: email support@prepr.io and name the Prepr
   environment it is for.
3. Tell them to set it in their shell profile (for example
   `export PREPR_MCP_TOKEN=...` in `~/.zshrc`) and restart the client. Not in
   a committed file. VS Code is the exception: it prompts for the token and
   stores it itself.

## Step 5: Authorize and verify

1. Give the one authorize step for the client (from
   [the check](references/mcp-connection.md#the-check)). Mention that OAuth
   asks them to pick an environment, and that changing environment later
   means authorizing again.
2. Ask the user to say when they are done. Some clients need a restart or a
   reload to pick up the new server.
3. Call `get_initial_context` for the environment's name and domain, then
   `list_schema` (first page only, read-only). Report the environment and
   how many models it has. If the tools are still missing, go back to
   [the check](references/mcp-connection.md#the-check) and report which state
   you are in.

## Step 6: Allow read-only tools (Claude Code)

Each Prepr tool asks for permission the first time, which blocks the checks
above in a non-interactive session. Offer to allow the read-only tools in the
project's `.claude/settings.json` under `permissions.allow`:
`mcp__prepr__get_initial_context`, `mcp__prepr__list_schema`,
`mcp__prepr__get_schema_entity`, `mcp__prepr__query_items`,
`mcp__prepr__get_item`, `mcp__prepr__list_locales`. Write this only after the
user agrees, merge with existing entries, and never allow write tools or a
wildcard: every write must keep asking.

## Step 7: Mention the environment AI context

If `get_initial_context` shows the environment AI context is empty, say once
that filling it helps every AI request, and offer to draft it (see
[ai-context.md](references/ai-context.md#environment-ai-context)). If you
can't tell, skip this step.

## Step 8: Recommend a safety setting

Tell the user once: for production, an administrator can switch off schema
writes and deletes for all MCP requests under
Settings → Integrations → MCP Server, while keeping them on in development.

## What's next

Offer the next step that fits: design a content model (`design-schema`),
review the existing schema (`review-schema`), or work with content
(`manage-content`).
