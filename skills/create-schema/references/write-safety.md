# Write safety

Every write to Prepr (schema or content) follows these four steps. The Prepr
MCP server has no dry-run, and a token or OAuth session can reach production.

## Plan

Before any write, show the user:

- the **environment** you will write to, by name. If you do not know it for
  certain (see [the environment](mcp-connection.md#the-environment)), ask, and
  do not write until the user confirms it;
- every change, one line each. For schema: entity, field API id, type,
  required, and notable settings. For content: model, item, locale, fields
  changed, and the workflow stage it ends in;
- anything destructive, marked as such.

## Confirm

Wait for an explicit yes to that plan. A yes covers only the plan you showed.
If anything changes (an extra field, a different type, another environment),
show the new plan and ask again. Silence or "looks fine so far" is not a yes.

## Apply

- Follow the server's order. Schema: create the entity (it starts with no
  fields), then add fields one call each, in plan order.
- Stop at the first error. Do not retry with guessed parameters and do not
  delete what was already created. Report what was applied, what failed with
  the server's message, and what was not attempted.
- Lists are replaced, not appended. Passing `types` on a field or an option
  list on an enum replaces the whole list. Read first, merge your change into
  the current list, then write the merged list.
- A field's type cannot be changed with an update. Changing type means a new
  field plus content migration; plan it as such.

## Verify

After applying, read the result back (schema: `get_schema_entity`; content:
fetch the item) and compare with the plan. Report any difference.

## Deletes

- Deletes are two-step: the server returns a preview naming the environment
  and a `confirmToken`. Show the preview to the user, get an explicit yes, then
  call again with `confirm=true` and that token. Never reuse a token.
- Field delete has no content check on the server. Before deleting a field,
  warn that its values are lost in every item, and count affected items with a
  content query when possible.
- Entity delete is blocked while a model has items or is used elsewhere. Report
  the blocker; do not delete the items to make it pass unless the user asked
  for exactly that.
