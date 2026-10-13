---
name: sync-schema
description: >-
  Set up and run Git-backed schema sync between a repository and Prepr CMS
  environments, with schema files in prepr/schema/. Use this skill whenever
  the user wants to sync a Prepr schema via GitHub, GitLab, Bitbucket or
  Azure DevOps, get local schema file changes into a Prepr environment,
  export an environment's schema to the repository, promote schema between
  development, acceptance and production, add schema validation to CI,
  debug a schema import that fails or returns github.validation.failed, or
  asks why schema file edits have not appeared in Prepr. Also use it when
  the user considers direct environment-to-environment sync.
license: MIT
metadata:
  author: Prepr
---

# Sync a Prepr schema with Git

Set up and run Git-backed schema sync between a repository and Prepr
environments. A schema change alters the structure of a live environment and
can delete fields and their content, so the goal is a change that is
reviewed before it lands and can be reverted. That is what Git sync gives
you and the alternatives do not.

Read [schema-route.md](references/schema-route.md) first: it explains when
the files are the source of truth and what Export and Import do.

**The user runs Export and Import in Prepr.** Your part is valid files, an
accurate impact assessment, and telling the user exactly what will happen.
If Prepr MCP tools are connected (run
[the check](references/mcp-connection.md#the-check)), use them read-only to
inspect the live schema of the source and target environment. Without them,
work from the files and ask the user to confirm the target's current state.

## Ground rules

1. **Read the docs before acting:**
   - Syncing a schema: https://docs.prepr.io/development/working-with-cicd/syncing-a-schema
   - Validating a schema: https://docs.prepr.io/development/working-with-cicd/validating-a-schema
   - Exporting and importing: https://docs.prepr.io/development/working-with-cicd/exporting-and-importing-a-schema
   - Environments: https://docs.prepr.io/project-setup/setting-up-environments
2. **Export before editing, even for a one-line change.** Ask the user to
   run Export (or pull the branch Prepr exports to) so you start from the
   current state. Editing a stale copy means hand-merging generated JSON
   later.
3. **Validate before every import.** See [Validate](#validate).
4. **Name the environment and its role** (development, acceptance,
   production) every time you talk about an import.

## A commit is not a sync

Committing and pushing changes under `prepr/schema/` changes no Prepr
environment. The schema only changes when someone runs **Import** in Prepr.
This is the most expensive misunderstanding in this area.

- Never report a schema change as live because it was pushed or merged.
- Hold back front-end code that queries a new model or field until the
  import is confirmed: keep the query fragment out, or keep the type shim.
- Say **who** runs the import, **in which environment** and **when**. Keep
  schema commits separate from feature commits so they can be coordinated.

## Git sync is the recommendation

Recommend Git sync (GitHub, GitLab, Bitbucket or Azure DevOps) for any
environment that others depend on. It is the only method with version
control, reviewable diffs, CI validation before import, and a rollback path.

The alternatives exist; this skill does not run them:

- **Direct sync** between two environments of the same organization: no
  review, no rollback, destructive by design. See below.
- **Manual export and import** of single entities.
- **Live changes through MCP** with create-schema: fine for a Scratch or
  prototype environment, but in an environment that imports from Git the
  next import overwrites them.

## Setting up Git sync

The connection is configured in Prepr, per environment or organization,
following the syncing guide for the user's provider. The token needs write
access to the repository's contents. The Sync schema action needs a Developer
or Admin role with Schema write permission in that environment.

The repository side is yours:

1. **One directory, `prepr/schema/`,** with one JSON file per entity, in the
   format of [schema-files.md](references/schema-files.md). Keep it out of
   any build or bundling path.
2. **CI validation** on every pull request that touches it, with the
   official workflow. Save it as
   `.github/workflows/prepr-schema-validation.yml`:

   ```yaml
   name: Validate Prepr schema

   on:
     workflow_dispatch:
     pull_request:
       paths:
         - 'prepr/schema/*.json'
     push:
       branches:
         - main
       paths:
         - 'prepr/schema/*.json'

   jobs:
     validate-prepr-schema:
       uses: preprio/action-schema-validation/.github/workflows/prepr-schema-validation.yml@v1.0.15
   ```

   Check https://github.com/preprio/action-schema-validation for a newer
   tag before you pin it.
3. **Schema changes in their own commits,** separate from feature code.
4. **The direction agreed up front:** which environment exports to the
   repository and which environments import from it (Export only, Import
   only, or both). Write it in the project's README or agent instructions;
   newcomers get it wrong.

Once connected, the loop is: export, edit the files, validate in CI, review
the diff, merge, run Import in Prepr, verify.

## Editing schema files

Follow [schema-files.md](references/schema-files.md) for keys, field types
and file names, and
[schema-design-principles.md](references/schema-design-principles.md) for
design. A file name that does not match its entity's name stops Prepr from
mapping files to entities. Keep every `ref` stable; cross-references between
files use it.

## What an import changes

Before the user imports, give an impact assessment that names the target
environment and says whether it is production:

- every entity that will be **overwritten** (it has a matching file);
- every entity that will be **created** (a file without a match);
- every entity that will be **deleted** (no file, and no content uses it);
- every field that disappears from an overwritten entity. Removing a field
  removes its content, and there is no undo.

With MCP connected, build this list by comparing `list_schema` and
`get_schema_entity` with the files. Without MCP, ask the user to export the
target to a branch and diff it.

## What direct sync does, if the user chooses it

- It only works between environments in the same organization.
- Models in the target are overwritten when their singular name matches a
  source model, and fields are added or removed to match. Components,
  enumerations and remote sources are overwritten when their type name
  matches.
- Target entities that are missing from the source are deleted when unused.
- It cannot be undone once it has finished.

Name every entity that will be overwritten or deleted before the user runs
it. An unreviewed direct sync to production is the worst case available;
say so plainly.

## Validate

The validator checks that files are well-formed. It does not make a schema
live, it does not judge the design (use review-schema for that), and **it
does not guarantee the import**: Prepr's importer enforces more rules than
the published spec. The known gaps and their errors:
[Validation is not import](references/schema-files.md#validation-is-not-import).

## When an import fails

Import errors are often uninformative, and each guess costs a push and an
import.

- **An empty error list is not a hint.** `github.validation.failed` with
  `data: "[]"` says nothing about the cause. Say so, and ask the user for
  the detailed log from Prepr's log viewer before proposing a fix.
- **Check file names first.** Names that do not match their entity
  identifiers are the one known cause of an empty error list.
- **Read where the log stopped.** The import reports each entity it
  completes. If it reached the last entity alphabetically, every entity
  passed on its own and the failure is a check on the whole schema.

## Direction between environments

Both directions are legitimate and change opposite environments: production
to development for a realistic test structure, development to production to
ship reviewed changes. Ask which one is meant. With Git sync the direction
shows in the diff before anything is applied.

## Shared schema

A shared schema lives at organization level, so a change reaches every
environment that uses it. Promoting an entity needs the organization-level
Schema permission, and an entity with unpromoted dependencies cannot be
promoted until those are handled. Use the docs:
https://docs.prepr.io/project-setup/architecture-scenarios/shared-schema

## Verify

After the user confirms the import ran:

1. Check the target with `get_schema_entity` (or ask the user to look) and
   compare it with the files.
2. Regenerate the project's GraphQL types, if it has code generation, and
   confirm it succeeds against the live schema.
3. Release the front-end code you held back and confirm it builds.

Do not call the task complete on a successful push.

## Related skills

Design the model first with design-schema. Change a live environment
directly with create-schema. Review the files or the live schema with
review-schema. Seed content after the import with manage-content.
