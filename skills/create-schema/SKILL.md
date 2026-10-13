---
name: create-schema
description: >-
  Build or change a Prepr CMS content model, either live in an environment
  through the MCP server or as JSON schema files in prepr/schema/ for Git
  sync. Use this skill whenever the user wants to create or modify a model,
  component, enum, or field, turn an agreed content model plan into a working
  schema, add a content type to an existing Prepr environment or schema
  files, or apply a fix from a schema review. For deciding what the model
  should be from a vague brief, the design-schema skill applies first.
license: MIT
metadata:
  author: Prepr
---

# Build a Prepr schema

Turn an agreed plan, or a concrete request ("add an Event model with a date
and a location"), into models, components, enums and fields in Prepr.

## Step 0: Choose how to edit

A project keeps its schema in Git, in `prepr/schema/`, synced with Prepr.
You can edit it in two ways, and both are fine
([schema-route.md](references/schema-route.md)):

- **Live through MCP:** the Prepr MCP schema tools change the environment
  directly. Steps 1 to 4 below; the user then runs Export so the files
  catch up.
- **In the files:** you edit JSON files in `prepr/schema/`; the user runs
  Import to bring the change into the environment. See
  [The file route](#the-file-route).

Use MCP unless the user asks for a file change or wants it reviewed in a pull
request first. Check [Before you edit](references/schema-route.md#before-you-edit)
when the repository has `prepr/schema/`, and say in the first line of your
plan how you edit and which sync follows.

For live changes, run [the check](references/mcp-connection.md#the-check)
first. If MCP is not connected, offer **connect-prepr**, or edit the files
instead if the project has them.

If the brief is vague ("a marketing site"), run **design-schema** first. If a
plan from design-schema is in this conversation or in
`docs/prepr/schema-plan.md`, build from it and do not reopen its decisions.

## Step 1: Read what exists

Page through `list_schema`. For each entity the change touches, and for one
or two similar existing entities, call `get_schema_entity`. From these, note:

- naming: display names, API id casing, singular or plural;
- reuse: components and enums the new work should use instead of duplicating;
- conventions: SEO fields, slugs, how pages are composed (Stack or fixed
  fields);
- clashes: any name the plan uses that already exists.

Mirror what you find. Report clashes and pick a different name with the
user before planning.

## Step 2: Design the changes

Map every plan item to an entity and its fields. Choose field types with
[field-types.md](references/field-types.md) and check the result against the
anti-patterns in
[schema-design-principles.md](references/schema-design-principles.md).

Read each schema tool's input schema for the exact parameters. Do not rely on
a remembered tool list. Server rules that shape the plan are in
[mcp-limits.md](references/mcp-limits.md): an entity starts with no fields,
each field is one call, types cannot change, lists replace.

Write an AI description for every model (`ai_goal`) and every text field
(`ai_purpose`), following
[ai-context.md](references/ai-context.md): what the content is for, where it
appears, and its limits. Include them in the plan so the user can correct
them. Prepr's AI features and every MCP client read them.

## Step 3: Plan, confirm, apply, verify

Follow [write-safety.md](references/write-safety.md) exactly:

1. [Plan](references/write-safety.md#plan): name the environment, then list
   entities in dependency order (enums and components before the models that
   use them), each with its fields.
2. [Confirm](references/write-safety.md#confirm): wait for an explicit yes.
3. [Apply](references/write-safety.md#apply): create each entity, then its
   fields one call each. Stop at the first error.
4. [Verify](references/write-safety.md#verify): `get_schema_entity` on each
   entity you touched and compare it with the plan.

## Changing an existing schema

- Adding a field: read the entity, plan the one field, same loop.
- Adding enum options or allowed reference types: read the current list,
  merge, write the merged list. A write replaces the list.
- Changing a field's type: not possible in place. Plan a new field, content
  migration through manage-content, then deleting the old field.
- Deleting: see [Deletes](references/write-safety.md#deletes). Always the
  two-step confirm.

## Step 4: Report

List what now exists, in the environment you named, and what the user should
do next:

- **If the repository has `prepr/schema/`:** tell the user to run Export in
  Prepr and pull it, so the files catch up with your live change. Until then
  the next Import would overwrite it.
- **If it has none:** suggest setting up Git sync with **sync-schema** when
  the project is shared or headed for production.
- Then: review it (`review-schema`), or create first content
  (`manage-content`).

## The file route

1. **Start from the current state.** Ask the user to run Export (or pull the
   branch Prepr exports to) before you edit. If MCP is connected, compare the
   files with the live schema and report any drift before you change
   anything.
2. **Read what exists** in `prepr/schema/`, as in Step 1: naming, reuse,
   conventions, clashes.
3. **Design the changes** as in Step 2, then write them in the format of
   [schema-files.md](references/schema-files.md): one file per entity, the
   file named after the entity, a new `ref` (UUID) for each new entity,
   existing `ref` values untouched.
4. **Plan, confirm, write.** Show the plan (files to add, change and delete,
   and which entities and fields an import will remove), wait for an explicit
   yes, then write the files. Deleting a file deletes its entity on the next
   import when no content uses it.
5. **Validate** with the official workflow (see **sync-schema**) and read
   [Validation is not import](references/schema-files.md#validation-is-not-import).
6. **Hand off.** A commit is not a sync. Tell the user which environment must
   run Import, and that **sync-schema** covers the import, its impact
   assessment and verifying the result. Do not report the change as live.
