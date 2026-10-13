# Adaptive content: personalization and A/B tests

Personalized variants and A/B test variants live inside a Stack field. Only
stacks with `personalization` or `a_b_testing` enabled in the schema accept
them; check the field with `get_schema_entity` first.

## How variants are stored

A variant is not a separate object. Every variant is an ordinary entry in the
stack's `items` list, and entries that belong together share a `_context`
object:

- `group`: the same short id on every entry of one variant set. Any unique
  string works for a new set; reuse the existing id when you edit a set.
- `segments`: a list with one segment id on each personalized entry. The
  entry without `segments` is the **default variant**, shown to visitors who
  match no segment. Keep exactly one default per group.

A personalized hero with two segments looks like this in the raw item:

```json
{ "id": "<component-id>", "_context": { "group": "479kwpy6yfs" },
  "items": { "heading": "For everyone" } },
{ "id": "<component-id>", "_context": { "group": "479kwpy6yfs", "segments": ["sgm_kb2sriv18ao"] },
  "items": { "heading": "For hotels" } },
{ "id": "<component-id>", "_context": { "group": "479kwpy6yfs", "segments": ["sgm_3xdxdjzvtie"] },
  "items": { "heading": "For retailers" } }
```

The normalized output of `get_item` hides `_context`. Always read with
`includeRaw` to see which entries form a group.

## Segment ids

Segments are created by the user in Prepr; there is no tool to create them.
Ask for the segment names, then resolve the ids with a GraphQL query on the
environment, `{ _Segments { _id name api_id } }`, or ask the user for them.
Never invent a segment id.

## Writing variants

1. Read the item with `includeRaw` and note the current `content` order and
   every existing `_context`.
2. Write the stack entries in their final order: the default variant first,
   then one entry per segment, directly after each other.
3. The simplified stack format in `update_item` **drops `_context`**. Set it
   afterwards with one JSON Pointer per entry, for example
   `"/content/items/1/_context": { "group": "479kwpy6yfs", "segments": ["sgm_kb2sriv18ao"] }`.
   Send all pointers for one item in a single update.
4. Read the item again with `includeRaw` and check every `_context`. Without
   it, the variants show on the page one after another.

A stack write replaces the whole list. Writing it removes variants, A/B tests
and edits an editor made since your read. Read immediately before the write,
and tell the user not to edit that item until you have verified it.

## Verifying what visitors see

Publish, then query the page through GraphQL once per segment with the
`Prepr-Segments` header set to the segment's `api_id`, plus once without it
for the default. Allow for the short delay before a GraphQL read shows the
write.

## A/B tests

A/B variants use the same mechanism on stacks with `a_b_testing` enabled.
Two entries share a `group`, `segments` holds the variant letter instead of
a segment id, and `ab_test` is `true`:

```json
{ "id": "<component-id>", "_context": { "group": "f0kuutu8sag", "segments": ["A"], "ab_test": true },
  "items": { "heading": "Variant A" } },
{ "id": "<component-id>", "_context": { "group": "f0kuutu8sag", "segments": ["B"], "ab_test": true },
  "items": { "heading": "Variant B" } }
```

- An A/B group has exactly two entries, `["A"]` and `["B"]`, and no default
  variant. Variant A is the control.
- Write and verify it like a personalized group: entries first, then
  `_context` per entry with JSON Pointer, then read back with `includeRaw`.
- Results and the traffic split live in Prepr, not in the item. Point the
  user there to start, follow or end the test.
- Ending a test means keeping one variant: remove the other entry and drop
  `_context` from the winner. That is a stack write; plan and confirm it.
