# Two routes to a Prepr schema

A Prepr schema can change in two ways. Pick one per environment and keep to
it; mixing them loses work.

| | Live through MCP | Files with Git sync |
|---|---|---|
| Where you edit | The environment, with the MCP schema tools | JSON files in `prepr/schema/`, one per entity |
| When it changes | Immediately, on each tool call | Only when someone runs **Import** in Prepr |
| Review | The plan in chat | A pull request, with CI validation |
| Rollback | None | Revert the commit, import again |
| Best for | Scratch environments, prototypes, small changes, teams without Git sync | Shared and production environments, teams that review schema like code |

## Detect the route

1. Look for `prepr/schema/*.json` in the repository, a
   `prepr-schema-validation.yml` workflow, or project notes that mention
   schema sync.
2. If you find any of these, ask the user which environments sync with the
   repository and in which direction (Export, Import or both). The answer is
   configured in Prepr, not in the repository.
3. If you find none and the user does not mention Git sync, use MCP.

Never decide the route silently. Say which one you use and why in the first
line of the plan.

## The source of truth

In an environment that imports from the repository, **the files are the
source of truth**. Edit the files, not the environment:

- **Import** overwrites every model, component, enum and remote source that
  has a matching file, creates entities that have a file but no match, and
  deletes entities that have no file, when no content uses them.
- **Export** writes the environment to the repository and removes files that
  have no matching entity.

What happens to a schema change made directly in such an environment, through
MCP or the UI, is not documented. Assume the next Import overwrites it. If
the user still wants a direct change there, say this first; afterwards ask
the user to run **Export** so the files catch up, and do not edit the files
until that export is merged.

You can always use MCP read-only in a Git-synced environment: to see the
live schema, to diff it against the files, and to verify an import.

## A commit is not a sync

Pushing or merging changes in `prepr/schema/` changes no environment. The
schema only changes when someone runs **Import** in Prepr, and that needs the
Schema write permission in that environment. Never report a file change as
live. Say who runs the import, in which environment, and check the result
with MCP afterwards.

## Drift

When an environment and its files disagree, find out which is right before
changing either. Compare with `list_schema` and `get_schema_entity` against
the files, list each difference, and ask the user whether to export (the
environment wins) or import (the files win). An import overwrites each entity
with its file, so expect fields missing from a file to be removed, and
removing a field removes its content.
