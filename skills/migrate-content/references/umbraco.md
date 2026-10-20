# Migrating from Umbraco

How to get content out of an Umbraco site for the snapshot (see "Sources
outside Prepr" in the skill). Umbraco changes a lot between
major versions, so start by asking which version the site runs (the
backoffice shows it, as does the `Umbraco.Cms` package version). Then
pick the route:

| Version | Route |
|---|---|
| 12 and later | Content Delivery API (below). Published content only. |
| 14 and later, drafts needed | Management API, with an API user. |
| 7 to 11 | No Delivery API. uSync files, Umbraco Deploy export, a small custom API controller in the site, or the database. |

Check every shape below against a few real responses before you write
mappers. Umbraco's docs don't list the output of every property editor.

## Content Delivery API (12+)

Docs: https://docs.umbraco.com/umbraco-cms/develop-with-umbraco/headless-and-apis/content-delivery-api

**Enable it** (the site's developer does this):

- `Umbraco:CMS:DeliveryApi:Enabled: true` in appsettings, and
  `.AddDeliveryApi()` in `Program.cs` (on 12, in `Startup.cs`).
- Set an `ApiKey`, and leave `PublicAccess` false on a live site.
- Rebuild the `DeliveryApiContentIndex` in Settings → Examine Management.
  Queries read from that index; an old index gives missing items.
- For media, also `DeliveryApi:Media:Enabled: true`.

The script reads the key from `UMBRACO_API_KEY` and sends it as `Api-Key`.
The same rules as for Prepr tokens apply.

**Read everything:**

- `GET /umbraco/delivery/api/v2/content?filter=contentType:<alias>&sort=sortOrder:asc&skip=0&take=100&expand=properties[$all]`
  returns `{ "total": n, "items": [...] }`. Page with `skip` and `take`
  until you reach `total`. Always pass a `sort=`: without it the order can
  change between pages.
- Other filters: `fetch=descendants:<id or path>` for one tree,
  `filter=updateDate>2025-01-01` for a delta run.
- One item: `GET /umbraco/delivery/api/v2/content/item/{id}`, with the GUID key, not the integer
  node id.
- An item has `id`, `name`, `contentType`, `createDate`, `updateDate`,
  `route{path, startItem}`, `cultures{}` and `properties{}`.
- Early 12.x sites may only have `/api/v1`, with a different `expand` syntax.
  If v2 returns 404, try v1.

**What it leaves out:**

- Only published content. Drafts need `Preview: true` together with the
  `Api-Key`; without the key they are left out silently.
- Protected (member-only) content, and anything in
  `DisallowedContentTypeAliases`.
- Very deep nesting can fail with a `JsonException` (`MaxDepth`); the site's
  developer can raise the limit.

Count the items per content type in the backoffice and compare.

## Media

The Media Delivery API is switched on separately (see above).
`GET /umbraco/delivery/api/v2/media?fetch=children:/` lists the root, and
only `fetch=children` is supported, so walk the folders recursively. A file
has `url`, `extension`, `bytes`, `width`, `height`, `focalPoint` and
`crops`.

Media URLs are **relative** (`/media/abc123/hero.png`). Prepend the site's
public host before you upload them to Prepr. Sites on blob storage or a CDN
may return full URLs already. Crops are not files: carry over the original
and note the focal point.

## Property editors

As the Delivery API returns them (current versions; check on your site):

| Editor | Output | In Prepr |
|---|---|---|
| Textstring, Textarea | string | Text |
| Rich Text | `{ "markup": "<p>…</p>", "blocks": [...] }` | HTML text or dynamic content |
| Markdown | the Markdown string | convert to HTML |
| Numeric, Decimal | number | Integer, Float |
| True/False | boolean | Boolean |
| Date Picker | ISO date string | Date & Time |
| Dropdown, Checkbox list | string or string array | enum or Tags |
| Tags | string array | Tags field |
| Media Picker | always an array of media | Asset |
| Content Picker | one content object or `null` | Content reference |
| Multinode Treepicker | array of content (or media) | Content reference |
| Multi URL Picker | array of links with `linkType` | Text (URL), or a reference for `Content` links |
| Block List | `{ "items": [{ "content": {...}, "settings": {...} }] }` | Stack of components |
| Block Grid | `{ "gridColumns": 12, "items": [... areas ...] }` | Stack; the grid layout is the front end's job |

- **Blocks** have a `contentType` alias per item. Write one mapper per
  block type, as for stack sections, and decide with the user what happens
  to `settings` (often styling the new front end handles differently).
- **Blocks in rich text** appear in `markup` as
  `<umb-rte-block data-content-id="<guid>">`; match each to
  `blocks[].content.id` and turn it into a dynamic content element.
- With `RichTextOutputAsJson: true` you get a tree of elements instead of
  HTML. HTML is simpler to convert; leave it off unless the site needs it.

## Links and images inside rich text

- The Delivery API resolves internal links: an `<a>` gets the target's
  route as `href`, plus `data-start-item-path`, and on recent versions
  `data-destination-id`. Rewrite them through the id map, keyed on that id
  or on the route path ([transform.md](transform.md#internal-links)).
- Links to deleted or unpublished items lose their `href`. Report them.
- Images get a resolved `src` (relative, as above).
- In stored data (database, uSync, Management API) links are
  `href="/{localLink:umb://document/<guid>}"` up to 14 and
  `href="/{localLink:<guid>}" type="document"` from 15. Images carry
  `data-udi="umb://media/<guid>"`. Resolve both through the id map.

## Older and legacy formats

You meet these when you read stored data, or a site that wasn't upgraded:

- **Nested Content** (removed in 14): a JSON array of
  `{ "ncContentTypeAlias": "...", <property>: value }`. Map it like a Block
  List.
- **Block List and Grid before 15**: `layout` with `contentUdi`, and
  `contentData` with values per property alias. From 15: `contentData` with
  a `values` array of `{ alias, value, culture, segment }`.
- **Macros in rich text** (removed in 14):
  `<?UMBRACO_MACRO macroAlias="..." ... />`. Map each macro alias to an
  element or remove it, as with WordPress shortcodes.
- **Grid Layout** (removed in 14): rows and cells of editors. Flatten it
  into stack sections with the user.

Routes for 7 to 11:

- **uSync** writes content and media to files in the site's `uSync`
  folder, once switched on for content. Ask for those files. Docs:
  https://docs.jumoo.co.uk/usync/content
- **Umbraco Deploy** exports a zip of content and schema (licensed).
- **A custom API controller** in the site that returns published content
  as JSON is often the quickest, if a developer can deploy to the site.
- **The database** (`umbracoNode`, `umbracoContent`, `umbracoPropertyData`
  from 8; `cmsPropertyData` in 7) works but means rebuilding versions and
  cultures yourself. Use it last.

## Management API (14+)

For drafts or everything the Delivery API hides. The site's admin creates an
**API user** in the backoffice. The script gets a token with client
credentials from `/umbraco/management/api/v1/security/back-office/token`,
which expires in minutes, so renew it. Content comes from
`/umbraco/management/api/v1/tree/document/root` and `/umbraco/management/api/v1/document/{id}`,
in the stored formats above. Docs:
https://docs.umbraco.com/umbraco-cms/develop-with-umbraco/headless-and-apis/management-api

## Languages

- Usually one node with a variant per culture. Fetch each culture with
  `Accept-Language: <culture>` and join on `id`, which is the same for every
  culture. `cultures{}` on an item lists them. Map Umbraco's culture codes
  to the target's locales.
- Some sites keep a separate tree per language instead. Then group the
  trees' items with the user, as with WPML in WordPress.

## Redirects

Umbraco keeps old URLs of moved and renamed pages in `umbracoRedirectUrl`
(dashboard: Redirect URL Management). Export them into the redirect map:

- 14+: `GET /umbraco/management/api/v1/redirect-management`.
- Older: query the table, and check a few rows by hand.

The new map needs both: old Umbraco URLs, and the URLs that already
redirected.

## Not content

Raise these with the user; they don't move into Prepr models by default:

- **Members**: personal data and passwords. Out of scope for a content
  migration.
- **Umbraco Forms**: form definitions and entries. Rebuild the forms in the
  new stack; export entries as CSV if they must be kept.
- **Dictionary items**: front-end labels per language. They usually move to
  the new front end's translations, or to a Prepr model if editors should
  manage them.
