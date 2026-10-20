---
name: migrate-content
description: >-
  Use this skill whenever a developer wants to migrate or move content into
  Prepr CMS from another system (WordPress, Contentful, Sanity, Storyblok, a
  legacy or custom CMS, a database, CSV or JSON export), or from an old
  Prepr environment into a new or changed schema, for example when
  rebuilding a website on Prepr. Also use it to plan a content migration,
  map old content types and fields to Prepr models, write or debug a
  migration script, import content in bulk with the Prepr REST (Mutation)
  API, resolve references and assets during a migration, re-run or resume a
  migration, or sync source changes into already migrated content. Copying
  content between Prepr environments with the same schema is covered too.
license: MIT
metadata:
  author: Prepr
---

# Migrate content into Prepr

Help a developer move content from another system, or from an old Prepr
environment, into a Prepr schema that already exists. You help them design
the mapping and write a small migration script, then run it safely: first
in a Test environment, then in Production.

This skill is for migrations of many items written as code. For a few dozen
items typed or pasted in chat, or demo content, use **manage-content**.

## First: is a script needed?

Ask where the content comes from and where it goes.

- **Same schema, same Prepr organization** (copying content from one
  environment to another): use Prepr's built-in **Export to**. No script.
  The user needs the **Allow Developer actions** and **Allow bulk update
  content items and assets** permissions, syncs the schema first, runs a
  test export, fixes what it reports, then exports. Guide:
  https://docs.prepr.io/development/working-with-cicd/syncing-content
- **A different schema, or another system:** a migration script, as below.
- **Content from a system Prepr connects to live** (a product catalog):
  that is not a migration. Say so and stop.

## Before you start

Check each of these, and stop on the first one that is missing:

1. **The target schema exists.** It is modeled and created in the target
   environment. If not, offer **design-schema** and **create-schema** first.
   The mapping depends on it.
2. **A Test environment.** The first runs go to a Test or Development
   environment that is **empty**, never to Production. Ask the user to name
   it.
3. **Access to the target.** Run [the check](references/mcp-connection.md#the-check).
   With MCP, read the target schema with `list_schema` and
   `get_schema_entity`. Without MCP, read the schema files in
   `prepr/schema/` if the project has them.
4. **Access to the source.** Its API or an export file. For an old Prepr
   environment, the docs suggest connecting MCP to both environments for the
   analysis; the script reads it through the REST API.

## Tokens

The script writes through Prepr's REST **Mutation API**
(`https://mutation.prepr.io`), not through MCP. That is the documented way
to migrate in bulk, and it does not depend on the user's MCP login.

- The user creates the token in Prepr under **Settings → Access tokens**,
  with the REST API scopes `content_items` and `content_items_publish`
  (`assets` and `assets_publish` if the script uploads assets).
- **Bound to user** must name a person; without it every write fails with
  `access_token_not_bound_to_user`. Edits then show as theirs.
- A token belongs to one environment. Use a new one for Production.
- The script reads `PREPR_TARGET_TOKEN`, and `PREPR_SOURCE_TOKEN` when the
  source is a Prepr environment, from the environment or a `.env` file.
  Check that `.env` is in `.gitignore` before the user fills it in.
- Never ask for a token's value, never print, log or write it, and never
  put one in `.mcp.json` or any other committed file.

## Sources outside Prepr

Another CMS, a database or an export file needs a few extra decisions. Make
them with the user before the mapping, and record them in the mapping
files.

- **Source credentials.** The source's own token or password (a WordPress
  application password, a Contentful delivery token) follows the same rules
  as Prepr's: in `SOURCE_*` environment variables or the gitignored `.env`,
  never asked for, printed or committed. Ask for a read-only one.
- **A snapshot first.** Extract the source once into local JSON files and
  transform from those. Reruns then give the same result, the source API's
  rate limits apply only once, and edits made in the source during the
  migration don't creep in. Extract again only for the final run.
- **Translations.** Where each translation is its own item in the source
  (WordPress with WPML or Polylang), group them into one Prepr item with
  several locales. Key the id map on the translation group, create the item
  in one locale, then write each other locale with its own update. Map the
  source's locale codes to the target's.
- **Taxonomies and people.** For categories, tags and authors, decide with
  the user per taxonomy: Prepr's Tags field, an enum, or a model such as
  Category or Person. A model means its items are created before the items
  that reference them.
- **Dates.** Convert publish dates to a UNIX timestamp, and agree which
  timezone the source's dates are in.
- **Cutover.** The usual plan is a content freeze in the source: editors
  stop, you extract a fresh snapshot, run the migration once more, and switch
  the site over. Without a freeze, sync the changes as in step 6.

Body text, images and links inside it, embeds and old URLs need converting;
see [transform.md](references/transform.md). For an Umbraco site, see
[umbraco.md](references/umbraco.md) for the export route per version and
the shape of its data.

## Step 1: Analyze the source

Ask how to reach the source: its API, a database or an export file. Build
an inventory with the user: content types, item counts per type,
fields with their types and sample values, locales, assets, and the
references between types. Note what is outdated and should not move.

Read the schemas, do not guess them. Where a source field has no obvious
target, or a value doesn't fit, ask about it instead of choosing for the
user.

## Step 2: Map it

Write the mapping as files in the project, so it can be reviewed:

- `config/model-map.json`: one entry per source type with its source id,
  the target model's id (Prepr: **Copy model ID**), and the title and slug
  fields on each side.
- Per model, which source field goes to which target field, and how the
  value changes on the way (HTML clean-up, enum values, date formats, slug
  rules).
- One mapper per stack or dynamic-content section type. The Mutation API
  publishes no types for these, so read each component's fields from the
  target schema and write each mapper by hand.
- Every source field that is dropped, and every lossy mapping, agreed with
  the user and written down. Never skip a field silently.

Show the mapping to the user as the plan for the migration and wait for a
yes ([write-safety.md](references/write-safety.md)).

## Step 3: Write the script

Follow [script.md](references/script.md): plain JavaScript in Node, two
commands that run in order, an id map, and a report. Field values must
match [payloads.md](references/payloads.md) exactly.

1. **Assets first.** Upload them, or match those that already exist in the
   target, and record their new ids in the id map.
2. **`create`** creates every item empty, with only its title and slug,
   and saves the source id → target id pair in the id map after each item.
3. **`fill`** builds each item from its mappers, resolves every reference
   through the id map, and writes the full item in the **Review** stage.

Creating everything before filling anything means a reference never points
at an item that does not exist yet.

## Step 4: Run in the Test environment

1. Run each command with `--dry-run` first. It writes nothing and reports
   what it would do.
2. Start small: one model with `--model`, or a few items with `--limit`.
3. Read the report together with the user and fix the mapping or the
   script. Rerun only what failed with `--id` or `--slug`. A rerun writes
   to items that already have content; follow
   [updates.md](references/updates.md) so nothing is lost.
4. Then run the whole migration.

Each first real run in an environment is a write: name the environment and
wait for a yes. The script never writes to the source.

## Step 5: Verify

- Compare counts per model in the report with the source inventory.
- Read a sample of items back in the target (with MCP, `get_item`) and
  compare them with the source, including references, assets and locales.
- Have the user check the pages in the front end on the Test environment.
- Every failure in the report has a category (missing mapping, invalid
  transformation, unresolved reference, unsupported element, invalid source
  data, expected manual exception) and either a fix or the user's agreement
  to handle it by hand.

## Step 6: Production

- Run against Production with a new token, after the user's explicit yes
  naming it. If Production already holds content, ask how the migration
  should treat it before you run.
- Items stay in Review. Publishing is a separate step the user approves;
  set `publish_on` from the source if original dates matter.
- If editors already work in the target, never rerun `fill` as it is: an
  update replaces the whole item and would overwrite their edits. Sync
  only items that changed in the source, read and merge each one, back it
  up, and report conflicts, as in [updates.md](references/updates.md).
- Deleting migrated items is the user's call. Production blocks bulk
  deletes and deletes of referenced items, so clean up failed runs in the
  Test environment.

Prepr's guides: https://docs.prepr.io/project-setup/migrating-content and
https://docs.prepr.io/ai-assisted-content-migration
