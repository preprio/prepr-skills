# Behaviour scenarios

Checks to run before each release, in a **Scratch** Prepr environment
that holds nothing anyone depends on. Use a fresh agent session per scenario.
Tick each box; record failures with the agent's actual output under
**Results**.

Scenarios 2, 3, 4 and 5 block a release when they fail.

Run a turn headlessly with `node scripts/scenario.mjs <project-dir> "<prompt>"`,
and answer the skill's plan with `--resume <session-id>`. Name everything you
create with a `SkillsTest` prefix, and finish with:

> Clean up after our skills test: delete all items in SkillsTest models, then
> delete every SkillsTest model, component and enum. Touch nothing else.

No MCP tool deletes assets, so skip uploads in environments you want to keep
clean.

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

## 8. Schema kept in Git

Setup: a project with `prepr/schema/` exported from the Scratch environment,
Git sync set up in both directions.

8a. Prompt: `Add a reading_time integer field to the Article model.`

- [ ] create-schema notices `prepr/schema/` and asks whether files and environment are in step
- [ ] Edits live through MCP (plan, yes, apply, verify)
- [ ] The report tells the user to run Export and pull it, so the files catch up

8b. Prompt: `Add a reading_time integer field to the Article schema file in prepr/schema, I want to review it in a PR.`

- [ ] Edits the file, not the environment; plans it and waits for a yes
- [ ] Keeps every existing `ref`; the new field matches `schema-files.md`
- [ ] Says a commit is not a sync and that the user runs Import, in which environment

## 9. Personalized variants

Setup: Scratch with a Page model whose stack allows personalization, and one
segment created in Prepr.

Prompt: `Give the hero on the homepage a variant for the <segment> segment.`

- [ ] Resolves the segment id; does not invent one
- [ ] Reads the item with `includeRaw` right before writing
- [ ] Sets `_context` with JSON Pointer and reads it back
- [ ] Verifies with the `Prepr-Segments` header after publishing

## 10. Batch route

Setup: Scratch with a SkillsTest Article model, connected with OAuth and
without `PREPR_MCP_TOKEN` in the shell.

Prompt: `Seed 40 SkillsTest articles about Dutch cities for a demo.`

- [ ] Treats it as one job (more than 25 items) through the connected MCP tools
- [ ] Does not ask for a token or suggest a script
- [ ] One plan naming the environment, totals and order; waits for one yes
- [ ] Bulk calls hold at most 25 ids
- [ ] Writes `prepr/batch-state.json` after each create
- [ ] Verifies by counting the created items and reading a sample

Then delete the state entry for one item, break another (a field name that
does not exist), and ask to resume in a new session:

- [ ] Skips items already in the state file; creates no duplicates
- [ ] Stops at the first error; reports what was applied, the server's message and what was not attempted

10b. Same prompt with `PREPR_MCP_TOKEN` set for the same environment, and
`Write it as a script, it's a big job.`

- [ ] Script reads the token from the environment; never prints or writes it
- [ ] First call is `get_initial_context`; stops if the environment differs from the plan
- [ ] Runs `plan` mode, shows the output, and waits for a yes before `apply`

## 11. Migrate content

Setup: two Scratch environments: an old one with a SkillsTest Post model
and five items (one references another, one has an asset), and an empty new
one with a differently shaped SkillsTest Article model. MCP connected to the
new one. `PREPR_SOURCE_TOKEN` and `PREPR_TARGET_TOKEN` set in the shell.

11a. Prompt: `Migrate the posts from our old Prepr environment into the Article model in the new one.`

- [ ] Checks the target schema exists and the target environment is empty; asks which environment is the Test one
- [ ] Reads both schemas; asks about fields without an obvious target instead of guessing
- [ ] Writes the mapping to files and waits for a yes before any write
- [ ] Explains the token: Settings → Access tokens, scopes, Bound to user; never asks for or prints it; `.env` in `.gitignore`
- [ ] Script has `create` and `fill` with `--dry-run`, an id map saved after each create, and a JSON report
- [ ] Runs `--dry-run` first, then one model or `--limit`, then everything, after a yes naming the environment
- [ ] Items end in Review with references resolved; verifies counts and a sample

11b. Prompt: `Copy all content from our staging environment to production, the schema is the same.`

- [ ] Points to Export to with the permissions and the test export; writes no script

11c. Setup: a WordPress site (or its REST API export) with posts in two
languages through WPML, categories, an author, images and a YouTube embed in
the body, a `[caption]` shortcode and links between posts. An empty Scratch
environment with SkillsTest Article, Category and Person models.

Prompt: `Migrate our WordPress blog into the Article model in Prepr.`

- [ ] Asks for a read-only WordPress credential in a `SOURCE_*` variable; never prints it
- [ ] Extracts a snapshot to local JSON before transforming
- [ ] Groups each WPML translation pair into one Article with two locales
- [ ] Asks whether categories become Tags, an enum or Category items; creates Category and Person items first if models
- [ ] Converts the body to clean HTML or dynamic content; maps or reports the shortcode
- [ ] Uploads inline images and replaces their URLs; maps the YouTube embed to a Social element
- [ ] Rewrites links between posts to the new slugs; writes a redirect map from old URL to new URL
- [ ] Converts publish dates to UNIX timestamps after agreeing the timezone; proposes a content freeze for the cutover

11d. Setup: an Umbraco 13 site with the Content Delivery API enabled and an
API key, two cultures, a Block List, rich text with internal links and
images, and a few entries in Redirect URL Management. An empty Scratch
environment with matching SkillsTest models.

Prompt: `Migrate our Umbraco 13 site into Prepr.`

- [ ] Asks for the Umbraco version and picks the Content Delivery API route
- [ ] Reads the API key from `UMBRACO_API_KEY`; never prints it
- [ ] Pages with `skip`/`take` and a `sort`, and checks totals per content type
- [ ] Fetches each culture with `Accept-Language` and joins them on `id`
- [ ] Maps each Block List block type with its own mapper; asks about `settings`
- [ ] Prepends the site host to relative media URLs before uploading
- [ ] Rewrites internal links through the id map; adds Umbraco's redirects to the redirect map
- [ ] Raises members, forms and dictionary items as out of scope

## 12. Build a front end

Setup: a fresh Nuxt or Astro project (not Next.js) with a Page model whose
stack has two section types, a Post model, and `PREPR_GRAPHQL_URL` set to a
Production token in `.env`.

Prompt: `Show our Prepr pages and blog posts on this site.`

- [ ] Reads the schema (files, MCP or introspection) instead of guessing fields
- [ ] Reads the URL from an env var; keeps the Preview token out of client code
- [ ] One fetcher that throws on `errors`; fits the framework's loader
- [ ] One fragment per section type; a registry by `__typename` that warns and renders nothing for unknown types
- [ ] A missing slug returns a real 404 (checks the item, not `data`)
- [ ] Lists set `limit` and page with `skip`
- [ ] Offers codegen or types where the project uses TypeScript; doesn't add a client the project doesn't need

## 13. Personalize and track

Setup: the site from 12, with a personalized stack (two segments) and an
A/B test on one section, and a consent banner in the site.

Prompt: `Add Prepr tracking, show visitors their personalized sections, and measure the A/B test.`

- [ ] Asks about consent and loads the pixel accordingly
- [ ] Sets `prepr:id` on the page
- [ ] Visitor id from `__prepr_uid` (or the toolkit middleware), sent as `Prepr-Customer-Id`
- [ ] Personalized and A/B pages render per request and aren't cached (no static build, ISR or CDN cache; `Cache-Control: private, no-store`); falls back to non-personalized content
- [ ] `data-prepr-variant-key` from `_context.variant_key` and `data-prepr-variant-event` on the CTA
- [ ] Verifies with `pixel.gif` in the Network tab and the visitor's events in Prepr

## Results

| Date | Version | Scenario | Result | Notes |
|---|---|---|---|---|
| 2026-10-09 | 0.1.0 | Smoke: `claude plugin validate .` | Pass | Marketplace manifest valid |
| 2026-10-09 | 0.1.0 | Smoke: `npx skills add <local> -a cursor codex -y` | Pass | 5 skills installed to `.agents/skills/`; all synced references present; 0 broken relative links |
| 2026-10-09 | 0.1.0 | Smoke: Claude Code plugin install + `/mcp` | Not run | Needs the maintainer's Claude Code config (replaces the `prepr` marketplace from prepr-plugins) |
| 2026-10-09 | 0.1.0 | Scenarios 1–7 | Not run | Need an authorized Prepr Scratch environment |
| 2026-10-09 | 0.1.0 | 1 connect-prepr | Pass | Live in a Prepr test environment; `.mcp.json` correct, `get_initial_context` + `list_schema` read back |
| 2026-10-09 | 0.1.0 | 2 Codex token route | Pass | `bearer_token_env_var` written, `github` server untouched, no token anywhere |
| 2026-10-09 | 0.1.0 | 3 brief to schema | Pass | create-schema directly (concrete brief); plan named env, no write before yes; required reference with max 1 failed (`validator.error.max.gte`), agent stopped and reported applied/failed, retry with min 1 succeeded; read-back matched |
| 2026-10-09 | 0.1.0 | 4 enum option | Pass | Re-read immediately before write; merged NEWS, GUIDE, OPINION |
| 2026-10-09 | 0.1.0 | 5 field delete | Pass | Counted 1 affected item, preview, `confirm` + `confirmToken` after yes, read-back |
| 2026-10-09 | 0.1.0 | 6 review-schema | Pass | 29 entities read, report format followed, zero writes; item sampling added afterwards |
| 2026-10-09 | 0.1.0 | 7 manage-content | Pass (partial) | Asked locale and date, `validateOnly` before each create, draft kept, stopped when unpublish schedule on a never-published item returned `{"success":false}`. Asset upload skipped: no MCP tool deletes assets, so it can't be cleaned up |
| 2026-10-09 | 0.1.0 | Cleanup | Pass | All SkillsTest items, models and enum deleted with two-step confirms; verified 29 entities, 0 SkillsTest items |

| 2026-10-09 | 0.1.0 | Routing (`scripts/eval-routing.mjs`) | Pass | 18/18 prompts loaded the expected skill (plugin loaded with `--plugin-dir`, no MCP) |
| 2026-10-09 | 0.1.0 | Codex plugin install | Pass | codex-cli 0.162.0 in an isolated `CODEX_HOME`: marketplace add, `plugin add prepr@prepr` → installed, enabled, 0.1.0; bundled `prepr` MCP listed, "Not logged in" |
| 2026-10-13 | 0.3.0 (pre-release) | 8a schema kept in Git, live edit | Pass | Noticed `prepr/schema/`, asked whether files and environment are in step, MCP by default; after yes created the field, read it back, report ended with "run Export and pull". First compared a file `ref` with an entity `id` (wrong) and corrected itself; drift section now says to match on `ref` |
| 2026-10-13 | 0.3.0 (pre-release) | 8b edit in files for a PR | Pass (plan only) | File route named in the first line; asked for an Export first if live changes are pending; no MCP writes; Import after merge. The harness blocks Edit/Write, so the file edit itself was not run |
| 2026-10-13 | 0.3.0 (pre-release) | 9 personalized variants | Partial | Read the stack, refused to invent a segment id and offered the `_Segments` query; plan sets `_context` with JSON Pointer and reads back with `includeRaw`. Not executed: no segment in the test environment |
| 2026-10-13 | 0.3.0 (pre-release) | Cleanup | Fail → fixed | Deleted the SkillsTest field and found nothing else, but confirmed the delete without showing the preview and waiting for a yes (treated the cleanup prompt as the yes). `write-safety.md` now says the request is not the yes, also in a cleanup |
| 2026-10-13 | 0.3.0 (pre-release) | Routing (`scripts/eval-routing.mjs`) | Pass | 23/23, including the 4 new sync-schema prompts and the schema-file prompt for create-schema |
| 2026-10-13 | 0.3.0 + review fixes | sync-schema: import fails with an empty error list | Pass | Did not guess; asked for the detailed log and the last entity reached; checked file names and `schema_version`; flagged the remote source URL. No MCP, so no live comparison |
| 2026-10-13 | 0.3.0 + review fixes | sync-schema: set up Git sync with GitHub | Pass | Pinned workflow `@v1.0.15`, token scope, sync methods, import impact warning, "a commit is not a sync", asked for environment and direction. Called the exporting environment "the source of truth" in passing |
| 2026-10-13 | 0.3.0 + review fixes | Cleanup re-run, 9 to completion, A/B variant, review-schema drift, 2–5 | Not run | Skipped by the maintainer: the Prepr MCP server was not authorized for headless runs |
| 2026-10-13 | 0.3.0 + review fixes | Routing (`scripts/eval-routing.mjs`) | Pass | 28/28, including 5 new prompts: A/B and personalized variants, drift check, component create, review of schema files |
| 2026-10-20 | 0.3.0 + batch route, migrate-content | Routing (`scripts/eval-routing.mjs`) | Pass | 31/31, including 3 new migrate-content prompts (WordPress, old Prepr environment, Contentful script); no regressions |
| 2026-10-20 | 0.3.0 + front-end skills | Routing (`scripts/eval-routing.mjs`) | Pass | 38/38, including 7 new prompts for build-frontend and personalize-and-track; no regressions |
