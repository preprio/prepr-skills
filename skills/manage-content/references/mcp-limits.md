# Prepr MCP server limits

Rules the server enforces or documents. Re-check the release notes when a
call behaves differently: https://docs.prepr.io/prepr-mcp-server/release-notes
and https://docs.prepr.io/prepr-mcp-server/safety-limitations

## Permissions

Writes need both the user's role permission and the environment's MCP
permission (Settings → Integrations → MCP Server). The stricter of the two
applies.

## Schema tools (beta since 2026-10-06)

- Read: `list_schema` (paged index) and `get_schema_entity` (one entity).
  They replace `get_schema`.
- There is no dry-run or validate-only option on any schema tool.
- Entity creates make no fields; each field is its own call.
- A field's type cannot change. `types` and enum option lists replace the
  whole list.
- Deletes are two-step (preview → `confirm` + `confirmToken`). Field delete has
  no content check.

## Content tools

- `create_item` writes one locale per call. Add other locales with updates.
  It supports model-level root fields of type Text, Boolean, Integer, Float,
  Enum, Color, Tags, ContentReference, Asset and ElementBox.
- `update_item` takes the same input shape and sends a full update for one
  locale, after merging your changes into the current item.
- `patch_items` supports root fields of type Text, Boolean, Integer, Float,
  Enum, Color, Tags and ContentReference.
- Bulk calls handle up to 25 content item IDs per call.
- `query_items` and `query_assets` take their conditions under `filters`.
- Scheduled unpublishing takes a date-time and a locale.
- In a multi-locale environment, ask which locale when the request does not
  say. When several items match a request, ask which one before writing.
- Deleting content always needs explicit confirmation.

## Assets

- `upload_asset_from_public_url` imports from a public HTTPS URL.
- `create_asset_upload_url` returns a pre-signed URL; the client must upload
  the file itself. Creating the URL does not transfer anything.
- Up to 10 GB per file; images, documents, audio, video.
- Search existing assets with `query_assets` first to avoid duplicate uploads.

## Known errors

Prepr's error messages often don't say what to fix. Known cases:

| Error | Cause | Fix |
|---|---|---|
| `validator.error.max.gte` on a reference field | Required reference with a maximum but no minimum | Set a minimum (1 for a required single reference) |
| `{"success":false}` when scheduling an unpublish | The item was never published, or scheduling is off for the model | Publish first, or turn on scheduling for the model; ask the user which |
| Enum update rejected | An option you left out is still used by content | Keep the option, or migrate the content first |
| `Missing required fields for workflow stage Done: <component>.<field>` | A required field inside a component is empty. The check applies even when the editor hides that field through a condition (a Button's `external_url` when `use_external_link` is false) | Fill the field, or create the item in a stage before Done; ask the user which |
| `Prepr Mutation API request failed: 403` on an asset upload | The token or the environment's MCP permissions do not allow asset uploads | Ask the user to upload the files in Prepr, then find them with `query_assets` by name and link them |
| `review_urls/0/url must match format "uri"` | The tool's input schema rejects Prepr's URL placeholders such as `{slug}` and `{access_token}`. Percent-encoding them is accepted but stored literally, so preview breaks | Ask the user to set the preview URL in the model settings in Prepr |
| `data must NOT have additional properties` | A parameter one tool accepts (such as `intent`) is not in another tool's input schema | Read each tool's schema; do not copy parameters between tools |

Add a row whenever a new error turns up, with how it was fixed.

## Read-after-write lag

A successful write is persisted, but reaches Prepr's CDN cache with a short
delay, so a GraphQL API read right after a write may still return the old
content. The lag belongs to the cached GraphQL delivery path, not to the
write. Do not treat a stale GraphQL read as a failed write, and do not retry
the write because of it; that duplicates work. Verify through the MCP tools,
or re-read after a delay. See https://docs.prepr.io/graphql-api/caching
