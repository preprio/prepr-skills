# Prepr schema files

Use this format on the Git sync route (see [schema-route.md](schema-route.md)). A Prepr schema in Git is a directory with one JSON file per model, component, enum or remote source, stored at `prepr/schema/`. Each file describes one schema entity. The format is validated by https://github.com/preprio/action-schema-validation.

**Do not set `schema_version` to the spec filename.** It is optional; omit it and Prepr applies its own. See `schema_version` below.

**File names are the entity's own name, lowercased, with separators removed.** Nothing else: no type prefix or suffix, no folder-based grouping in the name, no separators.

| Entity | File |
|---|---|
| `Page` (Model) | `page.json` |
| `HeroBlock` (Component) | `heroblock.json` |
| `CaseStudy` (Model) | `casestudy.json` |
| `BackgroundColor` (Enum) | `backgroundcolor.json` |

Do **not** write `model-page.json`, `component-heroblock.json`, `heroblock.component.json`, or `hero-block.json`. The entity's `label` already records what kind of thing it is, and its `body_singular` or `api_id` already records its name — encoding either into the filename duplicates it and drifts when the entity is renamed.

## Table of contents

1. [Common keys](#common-keys)
2. [Models](#models)
3. [Components](#components)
4. [Enums](#enums)
5. [Field object — common properties](#field-object--common-properties)
6. [Choosing a field type](#choosing-a-field-type)
7. [Field types](#field-types)
8. [Validation is not import](#validation-is-not-import)
9. [Anti-patterns](#anti-patterns)
10. [Conditional display](#conditional-display)
11. [Editor layout](#editor-layout)
12. [AI hints](#ai-hints)
13. [Naming rules](#naming-rules)

## Common keys

Every file has:

| Key | Meaning |
|---|---|
| `label` | `"Model"`, `"Component"`, `"Enum"`, or `"Asset"` |
| `ref` | UUID identifying this entity. All cross-references between files use `ref`, not names. Generate a fresh UUID (v4) for new entities and never change it afterwards. |
| `schema_version` | Spec version string |
| `body` | Human-readable display name shown to editors |
| `description` | One-line explanation shown to editors — write one for every model and component |
| `folder` | Grouping in the schema section, not the content navigation — see [Grouping models and components](schema-design-principles.md#grouping-models-and-components-the-folder-key) (e.g. `"Pages"`, `"Sections"`, `"Grids"`, `"Cards"`, `"Blocks"`, `"Shared"`, `"Nav"`, `"Taxonomy"`, `"Site"`) |

## Models

A **model** is a content type whose items live in the content list (pages, posts, testimonials, taxonomy terms). GraphQL type name comes from `body_singular`.

```json
{
  "label": "Model",
  "ref": "<uuid>",
  "body": "Case Study",
  "body_singular": "CaseStudy",
  "body_plural": "CaseStudies",
  "description": "Customer case study with its own detail page.",
  "folder": "Pages",
  "fields": [ ... ],
  "slug": "case-study/{headline}",
  "slug_postfix": true,
  "single_instance": false,
  "previewing": true,
  "versioning": true,
  "workflow": true,
  "scheduling": true,
  "commenting": true,
  "content_check": true,
  "engagement_insights": true,
  "seo_score": true,
  "visible": true,
  "lock_content_item": false,
  "review_urls": [
    { "body": "Dev", "live_preview": "1", "url": "https://example.vercel.app/{slug}" }
  ]
}
```

Model settings:

| Key | Meaning |
|---|---|
| `body_singular` / `body_plural` | PascalCase GraphQL names — singular and plural queries (`CaseStudy(...)`, `CaseStudies(...)`) |
| `slug` | Slug template. `null` for non-routable models. Supports field placeholders and parent traversal: `"blog/{title}"`, `"{parent_page.slug}/{internal_title}/"` |
| `slug_postfix` | Append a uniqueness postfix on collision |
| `single_instance` | Singleton (navigation, footer, site settings): only one content item can exist |
| `previewing` | Enable preview of draft versions |
| `versioning` | Keep version history |
| `workflow` | Publish workflow (draft → review → publish) |
| `scheduling` | Allow scheduled publishing |
| `review_urls` | Live-preview URLs per environment; `{slug}` placeholder; `live_preview: "1"` enables the edit-mode preview bar |
| `seo_score` / `content_check` / `engagement_insights` / `commenting` | Editor tooling toggles |
| `visible` | Show in the content navigation |

## Components

A **component** only exists embedded inside a model's field (via `Stack`, `Component`, or `ElementBox`). GraphQL type name comes from `api_id` (PascalCase).

```json
{
  "label": "Component",
  "ref": "<uuid>",
  "api_id": "BentoCard",
  "body": "Bento Card",
  "description": "Card inside a bento grid; can span multiple columns.",
  "folder": "Cards",
  "icon": "far fa-table-cells-large",
  "fields": [ ... ]
}
```

`icon` is a Font Awesome class shown in the editor's component picker. Components have no slug/workflow/versioning settings — they inherit the lifecycle of the content item that embeds them.

## Enums

An **enum** is a reusable option list. GraphQL enum name comes from `body_singular`.

```json
{
  "label": "Enum",
  "ref": "<uuid>",
  "body": "Background Color",
  "body_singular": "BackgroundColor",
  "enum": [
    { "display": "White", "value": "WHITE" },
    { "display": "Light", "value": "LIGHT" }
  ],
  "enum_as_string": false,
  "folder": null
}
```

`display` is what editors see; `value` is what the API returns — always SCREAMING_SNAKE_CASE. Enums are defined once and referenced from any number of fields, so a value change propagates everywhere.

## Field object — common properties

Fields live in a model's or component's `fields` array, in editor display order.

| Key | Meaning |
|---|---|
| `api_id` | snake_case field name in the API (`internal_title`, `cards_per_row`) |
| `body` | Display name for editors |
| `type` | Field type (see below) |
| `description` + `description_appearance` | Editor help; `"help_text"` (below the field) or `"tooltip"` |
| `required` | Validation |
| `default_value` | Pre-filled value (booleans, enums, numbers, text) |
| `field_state` | `"read_write"` normally |
| `title` | `true` marks this field as the content item's display title in the CMS |
| `seo_title` | `true` feeds this field into the SEO score check |
| `unique` | Enforce unique values across items |
| `filterable` | Expose in GraphQL `where` filters |
| `a_b_testing` | Allow A/B test variants on this field |
| `personalization` | Allow per-segment variants (Stack fields) |
| `openai_options` | `{ "translate": "1" }` marks the field for AI translation — set on human-language text, omit on URLs, names, and identifiers |
| `appearance_*` | Editor layout, see [Editor layout](#editor-layout) |
| `appearance_conditions` | Conditional display, see [Conditional display](#conditional-display) |

## Choosing a field type

There are **37 field types**, enumerated in `FieldType` in the official spec
(`spec/2026-03-05.json5` in
[preprio/action-schema-validation](https://github.com/preprio/action-schema-validation)).
That file is what the validator enforces — when this reference and the spec
disagree, the spec wins.

### Editor names are not JSON names

Prepr's [field types documentation](https://docs.prepr.io/create-schema/field-types)
names fields the way editors see them in the CMS UI. The `type` value in schema
JSON is frequently different. Writing the editor-facing name into a schema file
fails validation.

| Editor UI name | JSON `type` |
|---|---|
| Text | `Text` (`appearance` picks single line / textarea / HTML editor) |
| Number | `Integer` **or** `Float` — two distinct types, not one |
| List | `Enum` |
| Dynamic content | `ElementBox` |
| Location | `Coordinates` |
| Date and time | `DateTime`, `DateTimeRange`, or `BusinessHours` — three distinct types |
| Assets | `Asset` |
| Content reference | `ContentReference` |
| Remote content | `ContentIntegration` |
| Social | one of 11 platform-specific types (`YouTubePost`, `InstagramPost`, …) |
| Form | one of 5 platform-specific embed types (`HubSpotEmbed`, `TypeformEmbed`, …) |
| Help text | `HelpText` |

There is **no `JSON` field type** and no free-form object type. Structured data
is modelled with a `Component`, not a JSON blob.

### Picking between the types that overlap

Most wrong calls are made among a small number of look-alike types.

**Prose and text**

| Need | Type |
|---|---|
| One line, no formatting (headline, label, button text) | `Text` + `appearance: "single_line"` |
| Several lines, no formatting (summary, meta description) | `Text` + `appearance: "textarea"` |
| Short formatted text, no embeds (a card body with a link and bold) | `Text` + `appearance: "html_editor"` + narrow `accept` |
| Long-form body with embedded components and media | `ElementBox` |

`ElementBox` is the only one that accepts embedded components. Reaching for it
on a card body gives editors headings and video embeds inside a card.

**Structure and relationships**

| Need | Type |
|---|---|
| Exactly one group of fields, always present (SEO block, form settings) | `Component` |
| Ordered, editor-arrangeable list of mixed blocks | `Stack` |
| Point at content that exists on its own and is edited once | `ContentReference` |
| Content mastered in another system | `ContentIntegration` |

The `Stack` vs `ContentReference` call is about ownership: a `Stack` entry with
a `Component` label embeds content **inside** this item — it is not reusable and
disappears with the item. A `ContentReference` (or a `Stack` entry with a `Model`
label) points at a standalone item that other content can also point at. Ask "if
someone edits this, should it change in the other three places it appears?"

**Choices**

Use `Enum` for any fixed vocabulary — never a `Text` field that editors are
trusted to spell consistently. For **taxonomy**, the house default is a small
**Model** per term, not `Tags` — see [Tags](#tags). Use `Boolean`
only for genuine two-state flags; a boolean that later needs a third state is a
content migration, so if a third value is plausible, start with an `Enum`.

### Fields that hold no data

`Divider`, `Column`, and `HelpText` are editor-form furniture — they shape the
authoring UI and return nothing in GraphQL. They take no `api_id`; the spec
explicitly forbids one on `HelpText`, and `Divider`, `Column`, and `Slug` do not
require it. Adding these does not change the API response shape.

## Field types

### Text

```json
{ "api_id": "headline", "type": "Text", "appearance": "single_line" }
```

- `appearance`: `"single_line"`, `"textarea"`, or `"html_editor"`
- `html_editor` takes `accept`: allowed marks/elements, e.g. `["bold", "italic", "link", "unordered-list", "ordered-list", "underline", "H2", "H3", "table", "alignment"]`
- `regex` for validation (URLs, emails, paths)
- `no_html` to strip markup

**Use when** the value is a string an editor types. **Don't use when** the set
of valid values is fixed — that is an `Enum` — or when the body needs embedded
components, which is `ElementBox`.
**Gotcha:** `html_editor` without a narrow `accept` list hands editors headings
and tables inside what you designed as a one-line card title. Always set
`accept` explicitly.

### Slug

Field of type `Slug` on the model works together with the model-level `slug` template. Options: `max` (length), `remove_trailing_slash`, `edit_from_slash`.

**Use when** the model is routable and needs its own URL segment.
**Don't use when** the item is only ever embedded — an embedded component has no
URL. **Gotcha:** changing a slug template after content exists changes live URLs;
plan redirects at design time.

### Asset

```json
{ "api_id": "image", "type": "Asset", "accept": ["photo"], "max": 1, "min": 0 }
```

- `accept`: any of `"photo"`, `"video"`, `"audio"`, `"file"`
- `max`/`min`: number of assets (max 1 = single asset)
- `allow_focal_point`, `allow_caption`, `allow_align`: editor options per asset

**Use when** the item carries media. **Don't use when** the image always pairs
with a caption, credit, and link — group those in a `Component` so they cannot
drift apart. **Gotcha:** `max: 1` still returns a list shape in some queries;
check generated types rather than assuming a scalar.

### Boolean

```json
{ "api_id": "is_internal_link", "type": "Boolean", "default_value": true, "true": "Internal", "false": "External" }
```

`true`/`false` keys are the labels shown on the toggle.

**Use when** the flag is genuinely binary and will stay binary.
**Don't use when** a third state is plausible later — `Enum` from the start
avoids a content migration. Two booleans that are mutually exclusive are always
an `Enum` wearing a disguise.

### Integer / Float

`min`, `max`, `default_value`. Store money as Integer cents, never Float.

**Use when** the value is arithmetic. **Don't use when** it is an identifier
that merely looks numeric — phone numbers, postcodes, and order codes are `Text`,
since leading zeros are significant and no one does maths on them.

### Enum

```json
{
  "api_id": "background", "type": "Enum", "default_value": "LIGHT",
  "enum": { "body_singular": "BackgroundColor", "label": "Enum", "ref": "<uuid-of-enum-file>" }
}
```

References an enum defined in its own file. Always set a `default_value` on presentation enums.

**Use when** the vocabulary is fixed and the front end branches on it.
**Don't use when** editors need to invent values — that is a Model (preferred)
or `Tags`.
**Gotcha:** enum `value`s are the API contract. Renaming one breaks every query
and mapper using it; change `display` freely, `value` never.

### Stack

An ordered list of embedded components and/or referenced models — the workhorse of page building.

```json
{
  "api_id": "sections", "type": "Stack",
  "min": 0, "max": 1000,
  "a_b_testing": true, "personalization": true,
  "types": [
    { "label": "Component", "api_id": "SideBySide", "allow_new": false, "allow_group": false, "position": 1, "ref": "<uuid>" },
    { "label": "Model", "body_singular": "CTA", "allow_new": true, "allow_group": false, "position": 2, "ref": "<uuid>" }
  ]
}
```

- `types` lists what editors may add. Components are identified by `api_id`, models by `body_singular` — both must carry the target's `ref`.
- Component entries are embedded inline (content lives inside this item). Model entries are references to standalone content items; `allow_new: true` lets editors create one on the spot.
- `min`/`max` constrain length (`min: 2, max: 2` forces exactly two).

**Use when** editors compose a page from reorderable blocks.
**Don't use when** every item has the same fixed parts — a stack there just lets
editors break the design. **Gotcha:** `personalization` and `a_b_testing` are set
here at design time; enabling them later is a schema change.

### Component

Embeds exactly one component, rendered inline in the editor form:

```json
{
  "api_id": "seo", "type": "Component", "framed": false,
  "component": { "api_id": "SEO", "label": "Component", "ref": "<uuid>" }
}
```

Use for structured field groups that always occur once (SEO settings, form options). `framed: true` draws a border in the editor.

**Use when** the group is always present exactly once.
**Don't use when** it repeats (`Stack`) or is shared and separately edited
(`ContentReference`). **Gotcha:** component content is embedded — it cannot be
reused or queried on its own.

### ContentReference

Reference to other content items (no embedding):

```json
{
  "api_id": "author", "type": "ContentReference", "appearance": "modal",
  "max": 1, "min": 0,
  "types": [
    { "label": "Model", "body_singular": "Person", "allow_new": true, "position": 1, "ref": "<uuid>" }
  ]
}
```

`appearance: "modal"` opens a picker dialog. `max: 1` for single reference.

**Use when** the target has its own identity and lifecycle.
**Don't use when** the content only exists inside this item — embed a component.
**Gotcha:** mark fields the listing page filters on as `filterable`, and set
`max: 1` deliberately: going from one to many changes the GraphQL shape.

### Tags

Prepr's built-in lightweight labels. Tags are environment-level, not schema entities — they live outside `prepr/schema/` and are managed in the CMS UI or via the Mutation API's `/tags` and `/tag_groups` endpoints.

```json
{
  "api_id": "tags", "type": "Tags", "appearance": "auto_suggest",
  "min": 0, "max": 5
}
```

- `appearance`: `"select"` (checkboxes/radio from a tag group), `"auto_suggest"`, or `null` for free entry
- `min` / `max`: how many tags an item may carry

A tag carries only `id`, `body`, `slug`, and timestamps — no extra fields, no per-term page, no references.

**House default: model taxonomy as content items, not tags.** A small Model per
term (`Topic`, `Industry`) is the preferred approach for anything that behaves
like a category. A modelled term can carry a description, an image, a slug and
its own landing page, a parent term for hierarchy, and SEO fields; it is
referenced with `ContentReference`, curated through the normal publishing
workflow, and queried and filtered like any other content.

**Use `Tags` only when** the terms are genuinely just labels — no term page, no
description or image, no hierarchy, no curation — such as loose keywords on
articles.
**Don't use `Tags` when** the term needs any field of its own, its own URL, or a
controlled vocabulary someone owns.
**Gotcha:** converting tags into a model later means migrating every item that
used them. When unsure, model it — the cost of a Model that stays simple is one
extra file; the cost of a tag that needed to be a Model is a content migration.

Mixed is fine: modelled `Industry` for terms with landing pages, free tags for
loose keywords. See
[schema-design-principles.md](schema-design-principles.md#references-and-taxonomy).

### ElementBox

Rich-text document field: free-form text elements mixed with embeddable components. Used for article/blog bodies.

```json
{
  "api_id": "content", "type": "ElementBox",
  "accept": ["H2", "H3", "Paragraph", "TextArea", "bold", "italic", "link", "unordered-list", "ordered-list", "Photo", "Video", "Code", "Html", "YouTubePost", "table"],
  "types": [
    { "api_id": "ButtonGrid", "label": "Component", "ref": "<uuid>" }
  ]
}
```

- `accept`: allowed text elements and marks (headings, media elements, social embeds like `YouTubePost`, `InstagramPost`, …)
- `types`: components editors can drop between paragraphs

**Use when** the content is prose whose shape the author decides as they write.
**Don't use when** the front end needs predictable regions to lay out — those are
fixed fields or a `Stack`. **Gotcha:** every element in `accept` must be handled
by the renderer; anything unhandled renders as nothing. Keep `accept` to what is
actually implemented. `Quote`, `CardItem`, and `NavigationItem` are deprecated.

### Divider

Not a data field — a visual section header in the editor form:

```json
{ "type": "Divider", "appearance": "open", "body": "SEO", "description": null }
```

### Coordinates

Geo point (lat/lng), picked on a Google Map. No configuration keys.

**Use when** an item has one physical location the front end plots or links to
(store, venue, office). **Don't use when** you need a postal address as text —
that is `Text` fields, or a `Component` grouping them. **Gotcha:** a single
point only; a route or region needs several fields or a component.

### DateTime

```json
{ "api_id": "published_on", "type": "DateTime", "appearance": "datetime", "format": "Y-m-d H:i:s" }
```

- `appearance` (**required**): `"date"` or `"datetime"`
- `format` (**required**): `"Y-m-d"` or `"Y-m-d H:i:s"` — match it to `appearance`
- `multiple`: allow several dates

**Use when** an item has its own editorial date — event start, publication date
you control separately from Prepr's system timestamps.
**Don't use when** you want created/updated times; those already exist on every
item in the API.
**Gotcha:** `multiple: true` changes the GraphQL type to a **list**, breaking
any front-end code and generated types that expect a scalar. Decide before
content exists.

### DateTimeRange

Same `appearance`, `format`, and `multiple` options as `DateTime`, storing a
start and end together.

**Use when** start and end belong to one concept (an event running Fri–Sun, a
campaign window). **Don't use when** the two dates are independently meaningful
and separately filtered — two `DateTime` fields query more easily.

### BusinessHours

Opening hours per weekday. No configuration keys.

**Use when** modelling a location's opening times. **Don't use when** hours are
irregular or seasonal — the structure is a weekly cycle, so exceptions need
their own field.

### Color

Hex colour from a picker. No configuration keys.

**Use when** editors genuinely choose an arbitrary colour (a campaign accent, a
per-item brand colour). **Don't use when** the choice is really "which of our
brand colours" — that is an `Enum` mapping to design tokens.
**Gotcha:** a free `Color` field lets editors pick anything, including values
that fail contrast requirements and values absent from the design system. Prefer
`Enum` for themed presentation and keep `Color` for true one-offs.

### ContentIntegration

References content mastered in an external system, via a Remote Source defined
in its own schema file.

**Use when** another system owns the data — a product catalogue, an events feed,
a job board. **Don't use when** the data would be better copied in and edited by
your team; an integration binds you to the remote system's uptime and shape.
**Gotcha:** requires a `RemoteSource` entity to exist first.

### Form embeds

Five platform-specific types, one per provider:

`TypeformEmbed`, `HubSpotEmbed`, `ActiveCampaignEmbed`, `PipedriveEmbed`,
`JotformEmbed`

Each embeds a form from that provider. The type is the platform, so switching
providers is a schema change plus a content migration.

**Use when** the form is built and its submissions handled in the external tool.
**Don't use when** you want the submission in your own backend, or the form is
two fields — a `Component` plus your own handler avoids a third-party script and
its consent implications.
**Gotcha:** platform-locked by type. If provider choice may change, an `Enum`
plus a `Text` embed id keeps the option open.

### Social embeds

Eleven platform-specific types, all configuration-free — the editor pastes a URL
and Prepr generates the preview:

`TwitterPost`, `InstagramPost`, `ThreadsPost`, `BlueskyPost`, `FacebookPost`,
`YouTubePost`, `TikTokPost`, `SoundCloudPost`, `VimeoPost`, `SpotifyPlaylist`,
`ApplePodcast`

**Use when** a model always carries one embed of a known platform (a video field
on a case study). **Don't use when** editors should pick the platform per item —
put the embed types in an `ElementBox` `accept` list, or offer several component
types in a `Stack`.
**Gotcha:** one type per platform means a "featured video" field typed
`YouTubePost` cannot hold a Vimeo URL.

### Resource

A downloadable or linkable resource item.

**Use when** the block is a file or link presented as a resource.
**Don't use when** a plain `Asset` with a caption covers it.

### Quote

Pull quote. **Deprecated** as an `ElementBox` element — the spec marks it so
alongside `CardItem` and `NavigationItem`. Model quotes as a `Component` with
attribution fields instead; a component gives you the author, role, and photo
that a bare quote cannot hold.

### Column

Editor-layout only — splits the form into columns.

```json
{ "type": "Column", "appearance": 3 }
```

- `appearance` (**required**): integer `1`–`6`

Holds no data and returns nothing in GraphQL. **Gotcha:** this is authoring
layout, not page layout. Front-end column count belongs in an `Enum` field the
renderer reads.

### HelpText

Editor guidance block. Holds no data.

```json
{ "type": "HelpText", "body": "Images must be 16:9", "appearance": "warning" }
```

- `appearance` (**required**): `"default"`, `"info"`, or `"warning"`
- Must **not** have an `api_id` — the spec explicitly forbids it

**Use when** a field's rules cannot be enforced by validation and editors keep
getting it wrong. **Don't use when** a field `description` would do — those sit
closer to the field.

## Validation is not import

**Passing `preprio/action-schema-validation` does not mean the schema will
import.** The published JSON Schema is a *syntax* check. Prepr's importer
enforces a strictly larger set of rules, and a schema can pass validation
43/43 and still fail import repeatedly, for different reasons each time.

Everything in this section is a real import failure, not a hypothetical.

### Keys the importer requires that the spec marks optional

The spec declares these optional with documented defaults. **The importer
rejects their absence.** Never rely on a default.

| Key | Importer error | Required on |
|---|---|---|
| `required` | `validator.error.required.required_unless` | every non-structural field |
| `no_html` | `validator.error.no_html.required` | every `Text` field |
| `min` | `validator.error.min.required` | `Asset`, `ContentReference`, `ContentIntegration`, `Stack`, `ElementBox` |
| `max` | `validator.error.max.required` | same set |
| `max >= min` | `validator.error.max.gte` | same set |

The last row has a trap: with `min` absent, `max >= min` is unsatisfiable, so
**omitting `min` surfaces as a confusing `max` error**. Set both.

Not enough:

```json
{ "type": "Text", "body": "Title", "api_id": "title", "appearance": "single_line" }
```

Correct:

```json
{ "type": "Text", "body": "Title", "api_id": "title", "appearance": "single_line",
  "required": true, "no_html": true }
```

`no_html` is `true` for plain text and `false` only for
`appearance: "html_editor"`.

**Structural fields are exempt** — `Divider`, `Column`, and `HelpText` hold no
data and take none of these.

### `Field` is not sealed, so key typos fail silently

Five definitions in the spec set `"additionalProperties": false`: `Model`,
`Component`, `Asset`, `Enum`, `RemoteSource`. Four do **not**: **`Field`**,
`TypeReference`, `AppearanceConditions`, `OpenAIOptions`.

A misspelled key inside a field therefore **passes validation and is silently
dropped on import**. No error, no warning.

Real failure: an `ElementBox`'s embeddable components were written under
`"components"`. The correct key is **`types`** — `components` appears exactly
once in the whole spec file, inside a `description` string. Validation passed.
The field would have imported with zero embeddable components: a blank
rich-text editor with nothing to explain why.

**Rule:** for any field key not copied verbatim from the spec, grep the spec
for it *as a key* before trusting it. This is the failure class that costs the
most, because nothing reports it.

### `schema_version`

The spec's pattern is `^\d{4}-\d{2}-\d{2}$` — **any well-formed date passes
validation**, including versions that do not exist.

Real failure: every file carried `schema_version: "2026-03-05"`, taken from the
validator's *spec filename*. Prepr's released API versions top out at
`2025-10-07`. Import failed on a whole-schema check with an empty error list.

The key is optional. **Omit it** and let Prepr apply its own, or use a real
version from the [upgrade guide](https://docs.prepr.io/graphql-api/upgrade-guide).
Never reuse the spec filename — it is a spec revision, not an API version. The
spec's own example says `2025-04-09`, which is the tell.

### `remote_source_url` is resolved live

`validator.error.remote_source_url.active_url` — Prepr performs a real
reachability check at import time. A placeholder host cannot pass, and it
**blocks the entire import**, not just the one file.

A remote source cannot be imported before its endpoint is deployed. Either
order the work (deploy the feed → set the URL → import), or gate the remote
source and its referencing field out of the schema until the endpoint exists.

### File names are part of the contract

Git-backed sync maps files to entities **by filename**. A descriptive name
(`model-car.json`, `component-hero-block.json`) is rejected on import, and the
failure mode is `github.validation.failed` with `data: "[]"` — an empty error
list, because Prepr could not map files to entities at all.

See [Naming rules](#naming-rules).

### Components cannot contain themselves

A Component is embedded structure, not a pointer, so a Component whose `Stack`
lists its own `ref` is infinite containment. A comment saying "one level only"
enforces nothing — bound the depth in the types:

```
NavLink                                  leaf, contains nothing
NavItem  → Stack(children) → [NavLink]   one level, by construction
```

**Model↔Model cycles are normal and fine.** `Car → CarGridBlock → Car` is a
`ContentReference` — a pointer between independent items, which is ordinary
content modelling. Only *Component-to-Component containment* is pathological. A
cycle check that flags both produces false positives on a healthy schema.

## Anti-patterns

Recurring mistakes, each one cheap to avoid at design time and expensive after
content exists.

**Editor-facing names in `type`.** `"List"`, `"Number"`, `"Dynamic content"`,
`"Location"` are UI labels, not JSON values. See
[Editor names are not JSON names](#editor-names-are-not-json-names).

**Free text where an Enum belongs.** A `Text` field holding `"left"`/`"right"`
gets `"Left"` and `" right"` within a month, and the front end branches on a
string nobody validates. Fixed vocabulary → `Enum`.

**Float for money.** Store cents as `Integer`. Floats accumulate rounding error.

**Numeric-looking identifiers as `Integer`.** Phone numbers, postcodes, and SKUs
lose leading zeros. Use `Text`.

**Booleans that want to be enums.** Two mutually exclusive booleans, or a flag
that gains a third state, means migrating content. Start with `Enum` when a third
value is plausible.

**`html_editor` or `ElementBox` without a narrow `accept`.** Editors get every
element the type allows, inside a slot designed for one line of text.

**Embedding what should be referenced.** Content embedded in a component cannot
be reused or queried standalone. If the same author, testimonial, or CTA appears
on three pages and should be edited once, it is a Model plus a reference.

**Referencing what should be embedded.** The reverse also costs: a wrapper model
that exists only inside one page adds a picker dialog and a second edit screen
for no reuse.

**Deciding `personalization` / `a_b_testing` late.** Both are schema-level flags
on `Stack` fields. Retrofitting means changing the schema after content exists.

**`multiple: true` on a date, added later.** It switches the GraphQL type to a
list and breaks the front end and generated types.

**Presentation colours as `Color`.** Editors pick values outside the design
system, including ones that fail contrast. Themed choices are an `Enum` mapping
to tokens.

**Free-form data as a JSON blob.** No such field type exists. Model the structure
with a `Component`.

**Tags where a Model belongs.** The house default for taxonomy is a content
item per term. A `Tags` field for something that behaves like a category —
anything that may need a landing page, a description, an image, hierarchy, or a
curated vocabulary — is a content migration waiting to happen. Reserve `Tags`
for loose keywords.

**Missing `filterable`.** A listing page that filters on a field needs it set.
Cheap to add later, but it is a schema change and a re-sync — decide when you
know the listing exists.

**Unhandled `accept` values.** Anything in an `ElementBox` `accept` list the
renderer does not implement renders as nothing, silently.

## Conditional display

Show a field only when another field has a certain value:

```json
"appearance_conditions": [
  { "field": "is_internal_link", "type": "Boolean", "eq": true }
]
```

```json
"appearance_conditions": [
  { "field": "form_type", "type": "Enum", "in": ["RESOURCE_DOWNLOAD"] }
]
```

Multiple conditions are AND-ed. Use this whenever a field only makes sense for one variant — it keeps the editor form small.

## Editor layout

- `appearance_width`: `100`, `50`, or `33` (percent of the row)
- `appearance_start_new_row`: force the field onto a new row
- `Divider` fields split the form into named sections (typical order: General/Content → Display → Taxonomy → SEO)

## AI hints

Models and fields carry optional AI-guidance keys consumed by Prepr's AI features and agents: `ai_goal`, `ai_context`, `ai_usage_rules`, `ai_examples` (model level); `ai_purpose`, `ai_expected_content`, `ai_use_when`, `ai_avoid_when`, `ai_examples` (field level). `null` when unused. Fill them for content types where AI generates or checks content.

## Naming rules

| Thing | Convention | Example |
|---|---|---|
| Model GraphQL name (`body_singular`) | PascalCase | `CaseStudy` |
| Component `api_id` | PascalCase | `BentoCard` |
| Enum name (`body_singular`) | PascalCase | `BackgroundColor` |
| Enum values | SCREAMING_SNAKE_CASE | `ONE_HALF` |
| Field `api_id` | snake_case | `cards_per_row` |
| Display names (`body`) | Human-readable | `"Cards per row"` |
| File name | the entity's own name, lowercased, no separators and no type prefix or suffix | `HeroBlock` → `heroblock.json` |
