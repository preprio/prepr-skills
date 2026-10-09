# Freshness

Facts the skills depend on, where they come from, and when they were last
checked. Re-verify every row when
https://docs.prepr.io/prepr-mcp-server/release-notes gets a new entry, and
the client rows when a client changes its MCP config format.

| Fact | Pinned value | Source | Last verified |
|---|---|---|---|
| MCP server URL | `https://mcp.prepr.io` | https://docs.prepr.io/prepr-mcp-server/authorization | 2026-10-09 |
| Transport | Streamable HTTP only; legacy SSE and `/messages` removed | release-notes (2026-10-06) | 2026-10-09 |
| OAuth | Default; user picks an environment during the flow; role permissions apply | https://docs.prepr.io/prepr-mcp-server/authorization | 2026-10-09 |
| Organization-level OAuth | Works across environments for shared schemas | release-notes (2026-10-08) | 2026-10-09 |
| Token route | Request from support@prepr.io naming the environment; `Authorization: Bearer <token>` | https://docs.prepr.io/prepr-mcp-server/authorization | 2026-10-09 |
| Per-environment MCP permissions | Settings → Integrations → MCP Server; stricter of role and MCP permission applies | authorization, safety-limitations | 2026-10-09 |
| Schema read tools | `list_schema`, `get_schema_entity` (replace `get_schema`) | release-notes (2026-10-06) | 2026-10-09 |
| Schema tools status | Beta; no dry-run or validate-only | release-notes (2026-10-06); live tool schemas | 2026-10-09 |
| Environment lookup | `get_initial_context` returns environment name, domain and id; no top-level environment parameter on write tools | live tool schemas | 2026-10-09 |
| `create_item` validation | `validateOnly` boolean validates without creating | live tool schemas | 2026-10-09 |
| Entity create | Creates no fields; one call per field | prepr-mcp develop | 2026-10-09 |
| Field type change | Not possible with an update | prepr-mcp develop | 2026-10-09 |
| List replacement | `types` and enum option lists replace the whole list; Prepr rejects removing enum options in use | live tool schemas | 2026-10-09 |
| Deletes | Two-step preview (names environment) → `confirm` + `confirmToken`; field delete has no content check | release-notes (2026-10-06); live tool schemas | 2026-10-09 |
| `create_item` | One locale per call; root field types Text, Boolean, Integer, Float, Enum, Color, Tags, ContentReference, Asset, ElementBox | https://docs.prepr.io/prepr-mcp-server/safety-limitations | 2026-10-09 |
| `update_item` / `patch_items` | Full PUT per locale after merge / patch supports a subset of root types | safety-limitations | 2026-10-09 |
| Bulk calls | Up to 25 item IDs per call | safety-limitations | 2026-10-09 |
| Query filters | `query_items` / `query_assets` conditions under `filters` | release-notes (2026-10-06) | 2026-10-09 |
| Asset tools | `upload_asset_from_public_url`, `create_asset_upload_url` (replace `upload_asset`); 10 GB | release-notes (2026-10-06, 2026-07-21) | 2026-10-09 |
| Scheduled unpublishing | Date-time plus locale | release-notes (2026-10-06) | 2026-10-09 |
| Claude Code config | `.mcp.json` `mcpServers`, `"type": "http"` required, `${VAR}` in headers | https://code.claude.com/docs/en/mcp | 2026-10-09 |
| Cursor config | `.cursor/mcp.json` `mcpServers`, `url` + `headers`, `${env:VAR}` | https://cursor.com/docs/mcp | 2026-10-09 |
| VS Code config | Portable `.mcp.json` preferred; `.vscode/mcp.json` deprecated but supports `inputs` + `${input:id}` | https://code.visualstudio.com/docs/agents/reference/mcp-configuration | 2026-10-09 |
| Codex config | `.codex/config.toml` (trusted projects), `[mcp_servers.prepr]`, `bearer_token_env_var`, `codex mcp login` | https://developers.openai.com/codex/mcp | 2026-10-09 |
| OpenCode config | `opencode.json` `mcp`, `"type": "remote"`, `{env:VAR}`, `opencode mcp auth` | https://opencode.ai/docs/mcp-servers/ | 2026-10-09 |
| Copilot CLI config | Token only; project `.mcp.json` or `~/.copilot/mcp-config.json`; no documented env expansion in headers; `copilot mcp add --header` | https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers | 2026-10-09 |
| Claude Desktop | Customize → Connectors → "Prepr CMS" | https://docs.prepr.io/prepr-mcp-server/getting-started/claude-desktop | 2026-10-09 |
| ChatGPT | Developer mode → custom app → `https://mcp.prepr.io` | https://docs.prepr.io/prepr-mcp-server/getting-started/chatgpt | 2026-10-09 |
