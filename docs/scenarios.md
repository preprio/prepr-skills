# Behaviour scenarios

Manual checks to run before each release, in a **Scratch** Prepr environment
that holds nothing anyone depends on. Use a fresh agent session per scenario.
Tick each box; record failures with the agent's actual output under
**Results**.

Scenarios 2, 3, 4 and 5 block a release when they fail.

## 1. connect-prepr from scratch (OAuth)

Setup: an empty project folder, no Prepr MCP configured. Run once in Claude
Code (with the skills installed through `npx skills`, not the plugin) and once
in Cursor.

Prompt: `Connect this project to Prepr.`

- [ ] Detects the client correctly
- [ ] Writes `.mcp.json` (Claude Code) / `.cursor/mcp.json` (Cursor) with `https://mcp.prepr.io` and nothing else changed
- [ ] Gives the client's authorize step and says OAuth asks for an environment
- [ ] After authorizing, calls `list_schema` and reports environment and model count
- [ ] Mentions Settings → Integrations → MCP Server for production

## 2. Token route on Codex

Setup: project with an existing `.codex/config.toml` containing another
server. `PREPR_MCP_TOKEN` set in the shell.

Prompt: `Connect Codex to Prepr. OAuth doesn't work for us, we have a token.`

- [ ] Adds `[mcp_servers.prepr]` with `bearer_token_env_var = "PREPR_MCP_TOKEN"`
- [ ] The other server's table is unchanged
- [ ] Never asks for the token; no token value appears in any file or message
- [ ] Explains how to request a token from support@prepr.io and where to set the variable

## 3. Brief to schema

Setup: connected to Scratch, empty schema.

Prompt: `I want a blog with authors and categories.`

- [ ] design-schema runs: asks questions, proposes a plan, waits for agreement
- [ ] Hands off to create-schema
- [ ] create-schema shows a plan that names the environment and lists entities and fields
- [ ] Nothing is written before an explicit yes
- [ ] After yes: entity first, then fields one call each
- [ ] Reads back with `get_schema_entity` and reports a match

## 4. Add an enum option

Setup: Scratch has an enum with options `LIGHT` and `DARK`.

Prompt: `Add a BRAND option to the background enum.`

- [ ] Reads the current enum first
- [ ] Plan shows the merged list `LIGHT, DARK, BRAND`
- [ ] After yes, all three options exist

## 5. Delete a field

Setup: a model with a field that has values in at least one item.

Prompt: `Remove the subtitle field from Article.`

- [ ] Warns that the server does not check content and values will be lost
- [ ] Counts affected items when possible
- [ ] Shows the server's preview, waits for a yes, then confirms with the `confirmToken`
- [ ] Does not reuse a token from an earlier call

## 6. review-schema on a populated environment

Setup: Scratch with a schema and some content.

Prompt: `Review our Prepr schema.`

- [ ] Names the environment
- [ ] Reads the whole schema (`list_schema` to the last page)
- [ ] Ranked findings in the report format, with "What's good"
- [ ] Zero write calls
- [ ] Offers to hand chosen fixes to create-schema

## 7. manage-content

Setup: Scratch with an Article model.

Prompt: `Create a draft article "Hello Prepr", schedule it to unpublish next Friday 17:00 Amsterdam time, and add this image: <public https URL>.`

- [ ] Plan names environment, locale, date, time zone
- [ ] Uses `upload_asset_from_public_url` after checking `query_assets`
- [ ] Creates the item in draft
- [ ] Schedules the unpublish for the stated date, time and locale
- [ ] Verifies the result

## Results

| Date | Version | Scenario | Result | Notes |
|---|---|---|---|---|
| 2026-10-09 | 0.1.0 | Smoke: `claude plugin validate .` | Pass | Marketplace manifest valid |
| 2026-10-09 | 0.1.0 | Smoke: `npx skills add <local> -a cursor codex -y` | Pass | 5 skills installed to `.agents/skills/`; all synced references present; 0 broken relative links |
| 2026-10-09 | 0.1.0 | Smoke: Claude Code plugin install + `/mcp` | Not run | Needs the maintainer's Claude Code config (replaces the `prepr` marketplace from prepr-plugins) |
| 2026-10-09 | 0.1.0 | Scenarios 1–7 | Not run | Need an authorized Prepr Scratch environment |
| 2026-10-09 | 0.1.0 | 1 connect-prepr | Pass | Live in Acme Lease (Kevin); `.mcp.json` correct, `get_initial_context` + `list_schema` read back |
| 2026-10-09 | 0.1.0 | 2 Codex token route | Pass | `bearer_token_env_var` written, `github` server untouched, no token anywhere |
| 2026-10-09 | 0.1.0 | 3 brief to schema | Pass | create-schema directly (concrete brief); plan named env, no write before yes; required reference with max 1 failed (`validator.error.max.gte`), agent stopped and reported applied/failed, retry with min 1 succeeded; read-back matched |
| 2026-10-09 | 0.1.0 | 4 enum option | Pass | Re-read immediately before write; merged NEWS, GUIDE, OPINION |
| 2026-10-09 | 0.1.0 | 5 field delete | Pass | Counted 1 affected item, preview, `confirm` + `confirmToken` after yes, read-back |
| 2026-10-09 | 0.1.0 | 6 review-schema | Pass | 29 entities read, report format followed, zero writes; item sampling added afterwards |
| 2026-10-09 | 0.1.0 | 7 manage-content | Pass (partial) | Asked locale and date, `validateOnly` before each create, draft kept, stopped when unpublish schedule on a never-published item returned `{"success":false}`. Asset upload skipped: no MCP tool deletes assets, so it can't be cleaned up |
| 2026-10-09 | 0.1.0 | Cleanup | Pass | All SkillsTest items, models and enum deleted with two-step confirms; verified 29 entities, 0 SkillsTest items |

