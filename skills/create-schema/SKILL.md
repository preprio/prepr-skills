---
name: create-schema
description: >-
  Build or change a Prepr CMS content model directly in Prepr through the MCP
  server. Use this skill whenever the user wants to create or modify a model,
  component, enum, or field, turn an agreed content model plan into a working
  schema, add a content type to an existing Prepr environment, or apply a fix
  from a schema review. For deciding what the model should be from a vague
  brief, the design-schema skill applies first.
license: MIT
metadata:
  author: Prepr
---

# Build a Prepr schema

Turn an agreed plan, or a concrete request ("add an Event model with a date
and a location"), into models, components, enums and fields in Prepr, using
the Prepr MCP schema tools.

Run [the check](references/mcp-connection.md#the-check) first. This skill
needs MCP. If it is not connected, offer **connect-prepr** and stop.

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
do next. Usually that is: review it (`review-schema`), or create first
content (`manage-content`).
