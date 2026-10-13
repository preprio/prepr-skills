# Keeping the schema in Git

A project keeps its Prepr schema in the repository, as JSON files in
`prepr/schema/`, synced with its Prepr environments through Git sync. That
is the goal for every project: the repository always holds the current
schema, reviewed and versioned like code.

You can change the schema in two ways, and both are fine:

| | Live through MCP | In the files |
|---|---|---|
| Where you edit | The environment, with the MCP schema tools | JSON files in `prepr/schema/`, one per entity |
| The change is live | Immediately | When someone runs **Import** in Prepr |
| Then sync | Ask the user to run **Export**, then pull the export | Commit and merge, then ask the user to run **Import** |
| Good for | Fast iteration, prototypes, small changes | Changes the team wants to review first |

Whichever way you edit, finish with a Git sync in the right direction, so
that the repository and the environment hold the same schema again.

## Before you edit

1. Look for `prepr/schema/*.json` in the repository.
2. **No schema files:** work through MCP, and recommend setting up Git sync
   (sync-schema) when the project is shared or headed for production. Don't
   block the work on it.
3. **Schema files present:** ask the user which environment syncs with the
   repository, and whether the files and the environment are in step. Both
   directions are configured in Prepr, not in the repository.
4. **Don't let one side get ahead of the other.** Before a live change,
   check that no merged file changes are waiting for an Import: an Export
   overwrites the files, and unimported file changes would be lost. Before a
   file change, check that no live changes are waiting for an Export: the
   next Import would overwrite them. If either is waiting, have the user
   sync first.

Say in the first line of your plan how you will edit and which sync follows.

## After a live change (MCP)

The change is in the environment, not yet in Git.
Tell the user to run Export in Prepr (Sync schema) to the branch the project
syncs with, then pull or merge it. Until then the files are behind, and the
next Import from the repository would overwrite your change. Say this in your
report every time; it is the step people forget.

## After a file change

A commit is not a sync. Pushing or merging changes in `prepr/schema/`
changes no environment. Tell the user to run **Import** in Prepr, in which
environment, and check the result with MCP afterwards. Never report a file
change as live before the import.

## What Export and Import do

- **Import** overwrites every model, component, enum and remote source that
  has a matching file, creates entities that have a file but no match, and
  deletes entities that have no file, when no content uses them.
- **Export** writes the environment to the repository and removes files that
  have no matching entity.
- Both need a Developer or Admin role with Schema write permission in the
  environment.

What happens to a live change when an Import runs before its Export is
not documented. Assume the Import overwrites it.

## Drift

When an environment and its files disagree, find out which is right before
changing either. Compare with `list_schema` and `get_schema_entity` against
the files: match a file to its entity by `ref` (the entity's `ref`, not its
`id`, which differs), then list each difference, and ask the user whether to export (the
environment wins) or import (the files win). An import overwrites each entity
with its file, so expect fields missing from a file to be removed, and
removing a field removes its content.
