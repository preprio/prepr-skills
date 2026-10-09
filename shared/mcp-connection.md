# Prepr MCP connection

Every Prepr skill runs this check before doing anything that needs Prepr.

The Prepr MCP server is `https://mcp.prepr.io` (Streamable HTTP). Docs:
https://docs.prepr.io/prepr-mcp-server

## The check

Look at your live tool list. Do not trust a remembered or written tool list;
the server ships new tools often.

1. **Connected.** Prepr tools are present (for example `list_schema`).
   Continue. If a tool response names the environment, say which environment
   you are working in.
2. **Registered, not authorized.** The `prepr` server is in the client's MCP
   config but its tools are missing, or the client reports that
   authorization is needed. Tell the user the one step that authorizes it in
   their client, then stop and wait:
   - Claude Code: run `/mcp`, select `prepr`, authenticate.
   - Cursor: Settings → MCP → `prepr` → Connect / Login.
   - Codex: `codex mcp login prepr`, or the Authenticate button in the app.
   - OpenCode: `opencode mcp auth prepr`.
   - VS Code: the Start/Auth action above the `prepr` entry in `.vscode/mcp.json`.
   - Claude Desktop / ChatGPT: reconnect the Prepr connector in settings.
3. **Not registered.** Offer the `connect-prepr` skill in one sentence: it adds
   the server to this project and walks through authorization. Only
   `design-schema` continues without MCP. Every other skill stops here.

During OAuth the user picks one Prepr environment. Switching environment
means authorizing again.

## Rules

- Never ask for an MCP token, never read one from a file, never print or write
  one. Token setups reference the env var `PREPR_MCP_TOKEN` only.
- Do not retry a failing connection in a loop. Report what you saw.
- In a non-interactive session, an unauthorized server cannot be connected.
  Say that authorization is needed and stop.
- If a Prepr tool returns a permission error, the user's role or the
  environment's MCP permissions block it. Say which action was refused; do not
  look for a workaround.
