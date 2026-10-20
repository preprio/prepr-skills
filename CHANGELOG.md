# Changelog

## Unreleased

Fixes from an end-to-end review and more live MCP findings.

- Editor experience: create-schema designs the editor's form (names, field
  order, sections, help text placement, Help text fields, widths,
  conditions, component framing and picker images, required and defaults),
  says which of these the MCP tools cannot set, design-schema plans them and
  review-schema flags their absence. Schema files document the exact keys.
- Schema principles no longer lean on one site's schema. A new
  "Composable sections" principle: don't copy label, heading, sub-heading
  and call to action into every section; use a shared heading component or
  one content section with blocks, keep options few, and keep it simple
  for the developer. A test keeps project-specific mentions out of the
  skills. Examples are neutral, and folders, personalization flags and a
  personalization wrapper model are options to agree with the user, not
  rules.
- Review fixes: skills that work on schema files no longer stop without
  MCP; drift matches entities on name the way Import does and flags renames;
  sync-schema points to Prepr's import preview and names both known causes
  of an empty import error; schema files must keep GraphQL type names
  unique; manage-content triggers on personalized and A/B variants.
- Known errors: the required-field error at Done depends on the stage the
  environment validates at and on its setting for hidden conditional
  fields. The asset upload 403 guidance is removed from the known errors
  and from manage-content.
- Batch route: a new shared `batch-route.md` for large jobs (a whole
  schema, more than 25 items, bulk asset import). They run through the
  connected MCP tools as one job: one plan and one yes, phases, a state file
  to resume from, and a stop at the first error. A script is optional, only
  when `PREPR_MCP_TOKEN` is already set, since most users connect with
  OAuth. Linked from create-schema and manage-content; scenario 10 covers
  both.
- Known errors: `intent` is the usual cause of `additional properties`.
- New skills build-frontend and personalize-and-track, for any stack.
  build-frontend reads the schema, builds GraphQL queries and fragments,
  sets up a fetcher (fetch, Axios, graphql-request, urql,
  Apollo, PHP), generates types, renders stacks through a `__typename`
  registry, returns real 404s and handles redirects, and covers caching,
  webhook revalidation, preview and visual editing.
  Pages that are or will be personalized or A/B tested are never cached:
  not statically built, not in ISR or a page cache, not at the CDN.
  personalize-and-track covers the tracking pixel, meta tags, impressions
  and conversions, events, consent, the visitor id and headers,
  per-request and static personalization, A/B bucketing and
  recommendations. A shared toolkit reference describes the stable
  `@preprio/toolkit` 0.4 entry points.
- New skill migrate-content: plans and scripts a migration from another
  CMS or an old Prepr environment into a Prepr schema, following Prepr's
  migration guides. A plain Node script writes through the REST Mutation
  API: assets first, then `create` (empty items and an id map) and `fill`
  (mapped fields, resolved references, Review stage), with dry runs, a
  report, and Test before Production. Same-schema copies go to Export to.
  For other CMSs it covers source credentials, a source snapshot,
  translations, taxonomies, dates and a content freeze, and a transform
  guide for rich text, inline images and links, embeds and a redirect map,
  and an Umbraco reference: export route per version, Delivery API paging
  and cultures, property editor output, links, redirects and what is not
  content.
  manage-content now hands migrations to it.

## 0.3.0 (2026-10-13)

Schema kept in Git and edited live or in files, a new sync-schema skill, and
fixes from live use of the MCP server.

- New skill sync-schema: Git sync setup for `prepr/schema/`, CI validation
  with the official workflow, import impact assessment, and debugging failed
  imports.
- Schema stays Git-synced in `prepr/schema/`, edited either live through
  MCP (then Export) or in the files (then Import). New shared
  `schema-route.md` and `schema-files.md`; create-schema reminds the user to
  Export after a live change; review-schema reviews files or the live
  schema and reports drift.
- manage-content: check the returned slug, edit inside stacks with a JSON
  Pointer, report locales the tools cannot reach, an asset upload fallback,
  and a note that archived items still show on preview tokens.
- connect-prepr: check that the app's GraphQL token reads the same
  environment as MCP.
- Known errors: required component fields at Done, asset upload 403, and
  parameters that differ per tool.
- Deletes: a request to delete is not the confirmation; show the preview and
  wait for a yes, also during cleanup.

## 0.2.0 (2026-10-13)

Personalization and A/B tests in manage-content.

- manage-content: add adaptive-content.md for personalized and A/B test
  stack variants (`_context` groups, segment ids, JSON Pointer writes,
  per-segment verification).

## 0.1.0 (2026-10-09)

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
