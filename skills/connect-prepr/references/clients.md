# Prepr MCP config per client

Server URL for every client: `https://mcp.prepr.io`. File entries also send
`X-Prepr-Client: prepr-skills/0.1.0` so Prepr can tell skill traffic apart.

Formats verified against each vendor's docs on 2026-10-09. If a client
rejects a snippet, check its `Source:` link; vendors change formats.

**One file, two clients.** A project-root `.mcp.json` with `mcpServers` is
read by Claude Code and VS Code (portable format). Write the OAuth entry there
once rather than twice. Only Claude Code expands `${PREPR_MCP_TOKEN}` in that
file, so a token header goes in `.mcp.json` only when Claude Code is the only
client reading it. GitHub Copilot CLI also reads this file but is token-only;
see its section.

## Claude Code

Project file: `.mcp.json`, merged into `mcpServers`. `"type": "http"` is
required; an entry with a `url` and no `type` is read as a stdio server and
skipped. The command-line alternative is
`claude mcp add --transport http prepr https://mcp.prepr.io`.

With the Prepr Claude Code plugin installed, the server is already
registered and only needs authorizing.

OAuth:

```json
{
  "mcpServers": {
    "prepr": {
      "type": "http",
      "url": "https://mcp.prepr.io",
      "headers": { "X-Prepr-Client": "prepr-skills/0.1.0" }
    }
  }
}
```

Token (Claude Code expands `${VAR}` in `url` and `headers`):

```json
{
  "mcpServers": {
    "prepr": {
      "type": "http",
      "url": "https://mcp.prepr.io",
      "headers": {
        "X-Prepr-Client": "prepr-skills/0.1.0",
        "Authorization": "Bearer ${PREPR_MCP_TOKEN}"
      }
    }
  }
}
```

Authorize: run `/mcp`, select `prepr`, authenticate in the browser.

Source: https://code.claude.com/docs/en/mcp

## Cursor

Project file: `.cursor/mcp.json`, merged into `mcpServers`. Remote entries
take `url` and `headers`, with no `type` key. Env vars use `${env:NAME}`.

OAuth:

```json
{
  "mcpServers": {
    "prepr": {
      "url": "https://mcp.prepr.io",
      "headers": { "X-Prepr-Client": "prepr-skills/0.1.0" }
    }
  }
}
```

Token:

```json
{
  "mcpServers": {
    "prepr": {
      "url": "https://mcp.prepr.io",
      "headers": {
        "X-Prepr-Client": "prepr-skills/0.1.0",
        "Authorization": "Bearer ${env:PREPR_MCP_TOKEN}"
      }
    }
  }
}
```

Authorize: Cursor Settings → MCP → `prepr` → Connect, then sign in. Cursor
reads the variable from the environment it was started in, so restart Cursor
after setting `PREPR_MCP_TOKEN`.

Source: https://cursor.com/docs/mcp

## VS Code

OAuth: use the portable project file `.mcp.json` (same entry as Claude Code
above, `mcpServers`, `"type": "http"`). VS Code now prefers it over the
deprecated `.vscode/mcp.json`.

Token: use `.vscode/mcp.json` with an input variable. VS Code prompts for the
value once and keeps it in its secret storage, so nothing is written to a
file. The portable format does not support input variables.

```json
{
  "inputs": [
    { "type": "promptString", "id": "prepr-mcp-token", "description": "Prepr MCP token", "password": true }
  ],
  "servers": {
    "prepr": {
      "type": "http",
      "url": "https://mcp.prepr.io",
      "headers": {
        "X-Prepr-Client": "prepr-skills/0.1.0",
        "Authorization": "Bearer ${input:prepr-mcp-token}"
      }
    }
  }
}
```

Authorize: open the MCP file and use the Start action above the `prepr` entry,
or run **MCP: List Servers** → `prepr` → Start. VS Code asks for sign-in (OAuth)
or for the token (input variable).

Source: https://code.visualstudio.com/docs/agents/reference/mcp-configuration

## Codex

Project file: `.codex/config.toml` (Codex loads it in trusted projects only),
or `~/.codex/config.toml`. The ChatGPT desktop app, the Codex CLI and the IDE
extension share this config.

OAuth:

```toml
[mcp_servers.prepr]
url = "https://mcp.prepr.io"
http_headers = { "X-Prepr-Client" = "prepr-skills/0.1.0" }
```

Token: `bearer_token_env_var` names the variable; Codex reads it at connect
time and sends it as `Authorization: Bearer`.

```toml
[mcp_servers.prepr]
url = "https://mcp.prepr.io"
bearer_token_env_var = "PREPR_MCP_TOKEN"
http_headers = { "X-Prepr-Client" = "prepr-skills/0.1.0" }
```

Authorize (OAuth): `codex mcp login prepr`, or Settings → MCP servers →
`prepr` → Authenticate in the app. If the project is not trusted, Codex ignores
`.codex/config.toml`; trust the project or use the user-level file.

Source: https://developers.openai.com/codex/mcp

## OpenCode

Project file: `opencode.json` at the project root, merged into `mcp`. Env vars
use `{env:NAME}`; an unset variable becomes an empty string.

OAuth:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "prepr": {
      "type": "remote",
      "url": "https://mcp.prepr.io",
      "enabled": true,
      "headers": { "X-Prepr-Client": "prepr-skills/0.1.0" }
    }
  }
}
```

Token:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "prepr": {
      "type": "remote",
      "url": "https://mcp.prepr.io",
      "enabled": true,
      "oauth": false,
      "headers": {
        "X-Prepr-Client": "prepr-skills/0.1.0",
        "Authorization": "Bearer {env:PREPR_MCP_TOKEN}"
      }
    }
  }
}
```

Authorize (OAuth): OpenCode prompts on first use, or run
`opencode mcp auth prepr`.

Sources: https://opencode.ai/docs/mcp-servers/ and
https://opencode.ai/docs/config/ (env substitution)

## GitHub Copilot CLI

Token only (Prepr's Copilot CLI guide). Copilot CLI does not document env-var
expansion in header values, so the header has to hold the real token. The
skill does not write that file. Give the user this command to run in their
own terminal; their shell expands the variable and Copilot stores the result
in `~/.copilot/mcp-config.json`, outside the repository:

```bash
copilot mcp add --transport http --header "Authorization: Bearer $PREPR_MCP_TOKEN" --header "X-Prepr-Client: prepr-skills/0.1.0" prepr-token https://mcp.prepr.io
```

The entry is named `prepr-token`, not `prepr`. Copilot CLI also reads the
project `.mcp.json`, and a project definition named `prepr` would take
precedence over a user-level `prepr`. If the project has an OAuth `prepr`
entry for Claude Code or VS Code, Copilot CLI will list it as failing to
authenticate; tell the user that is expected and that `prepr-token` is the one
it uses.

Check: let the user run `copilot mcp list` themselves; its output may include
header values.

Source: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers

## Claude Desktop

No file. In Claude Desktop, open Customize → Connectors, search for
**Prepr CMS**, click **+**, then **Continue connecting** in the browser. Sign in
and pick the Prepr environment.

Source: https://docs.prepr.io/prepr-mcp-server/getting-started/claude-desktop

## ChatGPT

No file. Custom MCP apps depend on the ChatGPT plan and workspace role; a
workspace admin may have to enable them.

1. Settings → Apps → Advanced settings → enable developer mode.
2. Create a custom app named `Prepr` with the remote MCP server URL
   `https://mcp.prepr.io`.
3. Complete OAuth and pick the Prepr environment.

Source: https://docs.prepr.io/prepr-mcp-server/getting-started/chatgpt
