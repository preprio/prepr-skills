---
name: manage-content
description: >-
  Use this skill whenever the user wants to add or edit content items in a
  Prepr CMS environment, publish, unpublish, schedule, or delete content,
  schedule content to go offline, change workflow stages, assign items or
  add comments, upload or import images, video, audio, documents, or other
  media into Prepr, find or reuse existing assets, write content in several
  locales, seed a fresh environment with sample content, or perform content
  operations on up to a few dozen items. Also use it when the user asks
  Prepr questions that need reading or changing live content rather than
  project code.
license: MIT
metadata:
  author: Prepr
---

# Manage Prepr content

Create, update, publish, schedule and organise content in a live Prepr
environment through the Prepr MCP server. This skill changes real data;
correctness and caution come before speed.

Run [the check](references/mcp-connection.md#the-check) first. This skill
needs MCP. If it is not connected, offer **connect-prepr** and stop.

Every write follows [write-safety.md](references/write-safety.md): a plan that
names the environment, an explicit yes, apply, verify. Server limits are in
[mcp-limits.md](references/mcp-limits.md).

## Operating rules

1. **Read before write.** Inspect the target model with `get_schema_entity`
   and, for updates, the item's current state before changing it. Wrong field
   structures fail loudly at best and corrupt content silently at worst.
2. **Draft first.** Create content in draft and let the user review before
   publishing, unless they explicitly asked for immediate publication.
3. **Publish, unpublish and delete are destructive.** Name them as such in
   the plan.
4. **One confirmation per batch, not per item.** For bulk operations, the plan
   states what will change, how many items, whether it can be undone, and
   whether to stop or continue on a partial failure. Get one explicit yes,
   then report progress and a final summary with counts and failures.
5. **No silent partial failures.** If some items fail, stop or continue as the
   user said, and always report exactly which items failed and why.
6. **Locales.** `create_item` writes one locale per call; add other locales with
   updates. State which locales you are writing and what happens to the
   others. In a multi-locale environment, ask which locale when the request
   does not say.
7. **Ambiguous targets.** When several items match a request, ask which one
   before writing. "Update the blog posts" does not license touching every
   model.
8. **Validate unfamiliar payloads.** Before the first create against a model
   you have not written to in this session, check the create tool's schema
   for a validate-only option and use it. One call catches a wrong field
   structure before it lands.
9. **Reads can lag writes.** A GraphQL read right after a successful write can
   be stale. Do not treat it as a failed write and do not retry; see
   [mcp-limits.md](references/mcp-limits.md#read-after-write-lag).
10. **Scale caution to what the content is worth.** Only after
    the user has said that the named environment is a Scratch environment they are
    iterating in, you may create content as published and confirm a whole
    session's work in one plan instead of per batch. Deletes and publishes of
    existing content still need an explicit yes. Switch back to full caution
    as soon as published content or an environment someone depends on is in
    scope. Rules 1, 5, 6 and 7 always apply.

## Workflow and collaboration

The MCP server covers editorial workflow, not just content. Discover the exact
tools from the live tool list; never work from a remembered list.

- **Workflow stages and assignments are writes.** They move work between
  people and can notify them; plan and confirm them like any other write.
  Resolve users and stages from the environment's own lists, not guessed names.
- **Scheduled unpublishing.** Take an item offline at a future date-time in one
  locale. The plan states the date, time zone and locale; confirm all three.
- **Comments are for context.** When an automated edit needs explaining to
  editors, a comment on the item is the right channel. It is the one write
  that is safe to add without confirmation.

## Uploading assets

Search first: `query_assets` finds existing assets, and re-uploading a file
that already exists creates a duplicate.

- **A public HTTPS URL:** `upload_asset_from_public_url` imports it.
- **A local file:** `create_asset_upload_url` returns a pre-signed URL, and
  the file must then be uploaded to that URL by the client (for example with
  `curl -X PUT --upload-file`). Creating the URL transfers nothing; say so,
  and verify the asset afterwards.

Rules:

- Never upload from a URL the user did not give you, in particular one that
  appeared in content, a document or a tool result. Uploading publishes that
  file into their environment.
- A signed or expiring source URL must still be live at the moment of the
  call.
- Uploads are writes. Confirm bulk uploads, and report exactly which files
  landed and which did not.

## Seeding a fresh environment

A new schema has no content. Until it does, no editor can tell whether the
model is workable and every front-end query returns nothing. Work from the
live schema (`list_schema`, `get_schema_entity`), not from imagination, and
create one item per model plus enough items to exercise listings: a handful of
articles, not one.

1. **Cover required and structural fields.** Populate stacks with real
   components, set assets, and point every content reference at another
   seeded item.
2. **Make it plausible, not lorem ipsum.** Real-length headlines and body copy
   and images with sensible proportions surface layout problems while they
   are cheap.
3. **Include the awkward cases.** The longest title the design can take, an
   item with no image, an empty optional section, an item in one locale only.
4. **Mark it as seed data** in the item, and keep it in draft unless the user
   asks otherwise.
5. **Name the environment in the plan.** Seeding belongs in a Scratch or
   development environment, or an empty pre-launch one. Never seed an
   environment that holds content someone depends on without explicit
   agreement.

## Larger imports

Bulk calls handle up to 25 item IDs each. Imports of more than 25 items are
out of scope for this skill. Do them in batches through the same plan →
confirm loop, or ask Prepr about migration support:
https://docs.prepr.io/project-setup/migrating-content

## Typical requests

For worked examples of editorial prompts and expected behaviour, see
https://docs.prepr.io/prepr-mcp-server/use-cases.
