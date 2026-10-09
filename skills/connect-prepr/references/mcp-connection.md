# Prepr MCP connection

Every Prepr skill runs this check before doing anything that needs Prepr.

The Prepr MCP server is `https://mcp.prepr.io` (Streamable HTTP). Docs:
https://docs.prepr.io/prepr-mcp-server

## The check

Look at your live tool list. Do not trust a remembered or written tool list;
the server ships new tools often.

1. **Connected.** Prepr tools are present (for example `list_schema`).
   Continue, and establish [the environment](#the-environment) before any
   write.
2. **Registered, not authorized.** The `prepr` server is in the client's MCP
   config but its tools are missing, or the client reports that
   authorization is needed. Tell the user the one step that authorizes it in
   their client, then stop and wait:
   - Claude Code: run `/mcp`, select `prepr`, authenticate.
   - Cursor: Settings → MCP → `prepr` → Connect / Login.
   - Codex: `codex mcp login prepr`, or the Authenticate button in the app.
   - OpenCode: `opencode mcp auth prepr`.
   - VS Code: the Start action above the `prepr` entry in the MCP file, or
     **MCP: List Servers** → `prepr` → Start.
   - Claude Desktop / ChatGPT: reconnect the Prepr connector in settings.
3. **Not registered.** Offer the `connect-prepr` skill in one sentence: it adds
   the server to this project and walks through authorization. Only
   `design-schema` continues without MCP. Every other skill stops here.

If a skill these instructions name (such as `connect-prepr` or
`create-schema`) is not installed, say so and point the user to
https://docs.prepr.io/prepr-mcp-server/getting-started instead.

## The environment

Every write must name its target environment, so know it for certain:

- **Project-level OAuth or a token** binds the connection to one environment
  (picked during sign-in, or the one the token was issued for). Switching
  means authorizing again.
- **Organization-level OAuth** can reach several environments. Check whether
  the tools take an environment argument; if they do, pass the environment
  explicitly on every call that writes.
- Take the environment from a tool response or a tool's environment argument.
  If you cannot determine it, ask the user which environment the connection
  points at, and do not write until they confirm it. Never infer it from
  memory, the project, or names mentioned in the conversation.

## Rules

- Never ask for an MCP token. If you come across one (in a config file or a
  command's output), never print, copy or write it; mask it as `Bearer ****`
  in anything you show. Token setups reference the env var `PREPR_MCP_TOKEN`
  only.
- Do not retry a failing connection in a loop. Report what you saw.
- In a non-interactive session, an unauthorized server cannot be connected.
  Say that authorization is needed and stop.
- If a Prepr tool returns a permission error, the user's role or the
  environment's MCP permissions block it. Say which action was refused; do not
  look for a workaround.
