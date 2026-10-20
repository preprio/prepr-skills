# Updating items that already have content

`fill` runs more than once: after a mapping fix, for a source delta, or
when a rerun picks up where a failure stopped. Every rerun writes to items
that already hold content, and some of that content didn't come from the
script.

## Why a rerun can lose data

`PUT /content_items/{id}` replaces the item for each locale it names. Send
the entire body: every field you leave out is emptied, including fields
editors filled in Prepr after the migration, and fields an earlier phase
set. Locales you leave out stay as they are. Source:
https://docs.prepr.io/mutation-api/content-items-create-update-and-destroy

So a rerun that sends only what the mapper produces is safe only while
nobody else has touched the item.

## Decide who owns each field

Agree it with the user and write it in the mapping, per model:

- **Script-owned:** the mapper produces it from the source. A rerun may
  overwrite it.
- **Editor-owned:** filled or improved in Prepr after the migration (SEO
  fields, new sections, curated references). A rerun never changes it.
- **Set once:** the migration fills it the first time and leaves it alone
  afterwards (a slug editors may change).

## Read, merge, write

For every item a rerun touches:

1. Read the item fresh, just before writing (`GET` it through the REST API
   with `fields=items`). Reads through the CDN can lag a moment after a
   write; don't rely on a read straight after one.
2. Merge: start from the current fields, replace only the script-owned
   ones with the mapper's output, and keep everything else as read.
3. Write the merged item as the entire body for that locale.

The shape Prepr returns on a read is not always the shape a write accepts
(stacks, components and dynamic content differ). Write one small converter
per field type from read to write shape, and test the round trip: read an
item, convert it, write it back unchanged in the Test environment, and read
it again. The two reads must match. Do this before any rerun on real
content.

Update one locale per request where you can, so a failure leaves the other
locales untouched.

## Catch editor changes

- **Remember what you wrote.** After each successful write, store the
  item's `changed_on` from the response and the payload you sent, the
  last written version, next to the id map.
- **Before a rerun writes,** compare the item's current `changed_on` with
  the stored one. If it moved, someone edited the item since the
  migration.
- **Then don't overwrite blindly.** Compare the current item with the last
  written version, field by field:
  - a field still equal to what the script wrote can take the new value;
  - a field an editor changed is a conflict: keep the editor's value and
    report it, unless the user says otherwise.
- **Check `changed_on` once more** right before the write, so an edit made
  during the run isn't lost.

## Before every write

- **Back up** the current item to a file (`backups/<id>.<timestamp>.json`)
  before writing. To restore, write the backup back in the same way.
- **Dry run first.** For a rerun, the dry run shows a diff per item: which
  fields change, which conflict, which are left alone. Show it to the user
  and wait for a yes before applying.
- **Keep `workflow_stage` out of a rerun** unless the plan changes it.
  It is not required on an update, and leaving it out keeps the stage
  editors set.
- **Published items:** check in the Test environment whether your update
  reaches the live site at once, before you rerun on published content.
- If the model keeps versions, Prepr's version history is a last way to
  restore an item.

## PATCH for single fields

`PATCH /content_items/{id}` changes only the fields you send. It suits a
fix to one field across many items (a corrected enum value, a re-linked
asset). Know its limits:

- It supports only some field types: Slug, Text, Enum, Color, Boolean,
  Integer, Float, Coordinates, Content reference, Asset, a single Date &
  Time, Social and a few more. Not Stack, dynamic content or components;
  those always need a full `PUT`.
- A field is replaced whole: send the complete value of each field you
  patch.
- It skips required-field validation and doesn't update `changed_on`, so
  your conflict check can't see it afterwards.
- It writes to the latest version. If that version is published, the change
  goes live immediately.
