# Choosing a Prepr field type

Use the editor names below. The schema tools' parameter schemas give the exact
value to send for each type and its settings; read them, do not guess. Field
type docs: https://docs.prepr.io/content-modeling/field-types

## Picking between the types that overlap

Most wrong calls are made among a few look-alike types.

**Prose and text**

| Need | Type |
|---|---|
| One line, no formatting (headline, label, button text) | Text, single line |
| Several lines, no formatting (summary, meta description) | Text, text area |
| Short formatted text, no embeds (a card body with a link and bold) | Text, HTML editor with a narrow list of allowed marks |
| Long-form body with embedded components and media | Dynamic content |

Dynamic content is the only type that accepts embedded components. Using it on
a card body gives editors headings and video embeds inside a card.

**Structure and relationships**

| Need | Type |
|---|---|
| Exactly one group of fields, always present (SEO block, form settings) | Component |
| Ordered, editor-arrangeable list of mixed blocks | Stack |
| Point at content that exists on its own and is edited once | Content reference |

Stack versus Content reference is about ownership. A component added to a
Stack is embedded **inside** this item: it is not reusable and disappears with
the item. A Content reference (or a model allowed in a Stack) points at a
standalone item that other content can also point at. Ask: "if someone edits
this, should it change in the other places it appears?"

**Choices**

Use Enum (List in the editor) for any fixed vocabulary, never a Text field
that editors are trusted to spell consistently. For taxonomy, prefer a small
Model per term over Tags (see Tags below). Use Boolean only for genuine
two-state flags; a boolean that later needs a third state is a content
migration, so if a third value is plausible, start with an Enum.

**No JSON type.** There is no free-form object field. Model structured data
with a Component.

## Fields that hold no data

Divider, Column and Help text shape the editor's form and return nothing in
the API. Adding them does not change the API response.

## Text

Single line, text area, or HTML editor. Can validate with a regex and strip
HTML.

**Use when** the value is a string an editor types. **Don't use when** the set
of valid values is fixed (Enum) or the body needs embedded components (Dynamic
content). **Gotcha:** an HTML editor without a narrow list of allowed marks
hands editors headings and tables inside a one-line card title. Always set the
allowed marks.

## Slug

Works with the model's slug template. Options: maximum length, remove
trailing slash, edit from slash.

**Use when** the model is routable and needs its own URL segment. **Don't use
when** the item is only ever embedded; an embedded component has no URL.
**Gotcha:** changing a slug template after content exists changes live URLs.

## Asset

Accepts photo, video, audio and/or file; minimum and maximum count; focal
point, caption and alignment options.

**Use when** the item carries media. **Don't use when** the image always pairs
with a caption, credit and link; group those in a Component so they cannot
drift apart. **Gotcha:** a maximum of 1 can still come back as a list in some
queries; check the API response rather than assuming a single value.

## Boolean

A toggle with a label for each state.

**Use when** the flag is binary and will stay binary. **Don't use when** a
third state is plausible later. Two mutually exclusive booleans are an Enum in
disguise.

## Number (Integer, Float)

Minimum, maximum, default. Store money as Integer cents, never Float.

**Use when** the value is arithmetic. **Don't use when** it is an identifier
that looks numeric: phone numbers, postcodes and order codes are Text, because
leading zeros matter and nobody does maths on them.

## Enum (List)

Points at an Enum entity. Always set a default on presentation enums.

**Use when** the vocabulary is fixed and the front end branches on it.
**Don't use when** editors need to invent values; that is a Model (preferred)
or Tags. **Gotcha:** an option's value is the API contract. Change the
display label freely, the value never. Adding options replaces the whole
option list, so read the current list and merge.

## Stack

An ordered list of embedded components and/or referenced models: the
workhorse of page building. Settings: which components and models editors may
add, minimum and maximum length, and whether personalization and A/B testing
are enabled.

**Use when** editors compose a page from reorderable blocks. **Don't use when**
every item has the same fixed parts; a stack there lets editors break the
design. **Gotcha:** personalization and A/B testing are set here at design
time; enabling them later is a schema change. The list of allowed types is
replaced on update, so read it and merge.

## Component

Embeds exactly one component, shown inline in the editor's form, optionally
framed.

**Use when** the group is always present exactly once. **Don't use when** it
repeats (Stack) or is shared and edited separately (Content reference).
**Gotcha:** component content is embedded; it cannot be reused or queried on
its own.

## Content reference

Points at other content items, picked in a dialog.

**Use when** the target has its own identity and lifecycle. **Don't use when**
the content only exists inside this item; embed a Component. **Gotcha:** mark
fields that a listing page filters on as filterable, and set the maximum
deliberately: going from one to many changes the API shape. A required
reference also needs a minimum of 1; Prepr rejects a required reference with a
maximum but no minimum (`validator.error.max.gte`).

## Tags

Prepr's built-in labels. Tags live at environment level, not in the schema. A
tag has only an id, a name, a slug and timestamps. Tag groups restrict entry.

**Prefer modelling taxonomy as content items.** A small Model per term
(`Topic`, `Industry`) can carry a description, an image, a slug and landing
page, a parent for hierarchy, and SEO fields, and it is curated through the
normal workflow.

**Use Tags only when** the terms are just labels: no term page, no fields, no
hierarchy, no curation. **Don't use Tags when** the term needs any field of its
own, its own URL, or an owned vocabulary. **Gotcha:** turning tags into a model
later means migrating every item that used them. When unsure, model it.

## Dynamic content

Rich text that mixes text elements with embeddable components. Settings: the
allowed text elements and marks, and the components editors can insert.

**Use when** the content is prose whose shape the author decides while
writing. **Don't use when** the front end needs predictable regions to lay
out; use fixed fields or a Stack. **Gotcha:** every allowed element must be
handled by the front end; anything unhandled renders as nothing. Quote, Card
item and Navigation item are deprecated elements.

## Location (Coordinates)

One geo point picked on a map.

**Use when** an item has one physical location to plot or link to. **Don't use
when** you need a postal address as text; use Text fields or a Component.

## Date and time (DateTime, DateTimeRange, BusinessHours)

- **DateTime**: a date or a date and time, optionally several.
- **DateTimeRange**: a start and end together.
- **BusinessHours**: opening hours per weekday.

**Use DateTime when** the item has its own editorial date (event start). Not for
created or updated times; every item already has those. **Use a range when**
start and end are one concept; use two DateTime fields when each is filtered on
its own. **Gotcha:** allowing several dates turns the API value into a list;
decide before content exists. Business hours are a weekly cycle; seasonal
exceptions need their own field.

## Color

A hex colour from a picker.

**Use when** editors truly choose an arbitrary colour. **Don't use when** the
choice is "which of our brand colours"; that is an Enum mapping to design
tokens. A free colour lets editors pick values that fail contrast checks.

## Form embeds

One type per provider: Typeform, HubSpot, ActiveCampaign, Pipedrive, Jotform.

**Use when** the form and its submissions live in that tool. **Don't use when**
submissions belong in your own backend, or the form is two fields. **Gotcha:**
the type is the provider, so switching provider is a schema change plus a
content migration.

## Social embeds

One type per platform (X/Twitter, Instagram, Threads, Bluesky, Facebook,
YouTube, TikTok, SoundCloud, Vimeo, Spotify, Apple Podcasts). The editor pastes
a URL.

**Use when** a model always carries one embed of a known platform. **Don't use
when** editors should pick the platform per item; allow the embeds in Dynamic
content, or offer several components in a Stack. **Gotcha:** a "featured
video" typed YouTube cannot hold a Vimeo URL.

## Resource

A downloadable or linkable resource. **Don't use when** an Asset with a caption
covers it.

## Quote

Deprecated as a Dynamic content element. Model quotes as a Component with
author, role and photo fields.

## Column

Splits the editor's form into 1 to 6 columns. Authoring layout only; front-end
column count belongs in an Enum the front end reads.

## Help text

A guidance block in the form (default, info or warning). **Use when** a rule
cannot be enforced by validation and editors keep getting it wrong. **Don't use
when** a field description would do.

## Remote content

Content mastered in another system, through a remote source. Setting up remote
sources is outside these skills.
