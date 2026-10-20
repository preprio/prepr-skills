# Mutation API payloads

Writes go to `https://mutation.prepr.io` with `Authorization: Bearer
<token>` and `Content-Type: application/json`. Reads of the source or the
target go to `https://cdn.prepr.io`. Source:
https://docs.prepr.io/mutation-api/content-items-create-update-and-destroy

## Create and update

`POST /content_items` creates an item and returns its id:

```json
{
  "model": { "id": "<target model id>" },
  "locales": ["en-US"],
  "workflow_stage": { "en-US": "Review" },
  "slug": { "en-US": "blog/my-post" },
  "items": {
    "en-US": { "title": { "body": "My post" } }
  }
}
```

`PUT /content_items/{id}` updates it. Leave out `model`.

- An update replaces the item for each locale it names, so send the
  entire body: every field and the `slug`. A field you leave out is
  emptied. For items that already have content, read and merge first; see
  [updates.md](updates.md).
- Locales you leave out stay as they are.
- `workflow_stage` can be changed alone, without `items`.

Everything per locale is keyed by the locale code: `items`, `slug`,
`workflow_stage`, `publish_on` and `expire_on`. `publish_on` is a UNIX
timestamp: `{"en-US": "1695286367"}`. `workflow_stage: Done` publishes the
item, at once or on its `publish_on`, so keep migrated items in Review.

If a slug already exists, the API makes it unique without an error. Compare
the slug in the response with the one you sent and report differences.

## Field values

The key is the field's API id.

| Field | Value |
|---|---|
| Text, text area, HTML | `{"body": "..."}`; HTML as an HTML string |
| List (enum) | `{"body": "left"}`, the enum value, not its label |
| Integer, Float | `{"value": 122}`, `{"value": 122.22}` |
| Boolean | `{"value": true}` |
| Color | `{"body": "#ff0000"}` |
| Asset | `{"items": [{"id": "<asset id>"}]}` |
| Content reference | `{"items": [{"id": "<target item id>"}]}` |
| Component | `{"id": "<component id>", "items": { <fields> }}` |
| Stack | `{"items": [ <component>, {"id": "<target item id>"} ]}` |
| Dynamic content | `{"items": [ <element>, ... ]}`, see below |
| Date | `{"format": "Y-m-d", "value": "2023-01-01"}` |
| Date with time | `{"format": "Y-m-d H:i:s", "value": "2020-10-19 12:00:00"}` |
| Date range | `{"format": "Y-m-d", "from": "...", "until": "..."}` |
| Multiple dates | `{"items": [ <date or range>, ... ]}` |
| Location | `{"latitude": "21.3137", "longitude": "-157.806"}` |
| Social | `{"url": "<post url>"}` |
| Tags | `{"items": [{"body": "Recipes"}]}` |

The right wrapper matters. A number sent as `{"body": ...}` or an enum sent
as a bare string is rejected or dropped without an error, depending on the
field. Check a few written items after the first run.

### Components and stacks

- A component, inline or in a stack, takes the target environment's
  component id, not its `ref` from the schema files. A `ref` fails with
  `id.exists`. Read the ids with `get_schema_entity` or copy them in Prepr.
- A stack entry is either a component (`id` plus `items`) or a reference to
  an existing item (`id` only).
- A stack only accepts the models and components its field allows. One
  entry that isn't allowed fails the whole item. Check each entry against
  the field's allowed types, and leave out and report what doesn't fit.

### Dynamic content

Each element has a `label`:

```json
{"items": [
  {"label": "Text", "format": "H2", "body": "Heading"},
  {"label": "Text", "body": "<p>Paragraph</p>"},
  {"label": "Asset", "items": [{"id": "<asset id>"}]},
  {"label": "Coordinates", "latitude": "52.37", "longitude": "4.89"}
]}
```

Lists and tables go in a `Text` element as HTML. A component element is
`{"id": "<component id>", "items": { <fields> }}`.

## Assets

Source: https://docs.prepr.io/mutation-api/assets-upload-update-and-destroy

- `POST /assets` with JSON `{"url": "<public file url>"}` imports a file of
  up to 25MB. Larger files go up as multipart or in 25MB chunks; see the
  docs.
- Set `reference_id` to the source asset's id. A rerun can then find the
  asset (`reference_id` filter on `GET https://cdn.prepr.io/assets`) instead
  of uploading it again.
- Content items have no such field. The id map is how a rerun finds them.

## Errors and limits

Source: https://docs.prepr.io/mutation-api/statuses-errors

- Default rate limits: 35 requests per second, 800 per minute, 10,000 per
  hour. Over a limit the API answers `429`; wait the seconds in
  `X-Prepr-Retry-After`.
- On a `5xx`, wait a few seconds and retry.
- A `200` response can still contain an error. Check the body.
- Reads through `cdn.prepr.io` are cached and can lag behind a write. Do not
  verify an item the moment after writing it.
