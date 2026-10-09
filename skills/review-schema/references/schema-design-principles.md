# Prepr schema design principles

The decisions that shape a Prepr schema, and the patterns they lead to, illustrated with one worked example: a real marketing-site schema. The example shows *how* the patterns compose — it is not a template to copy, and its model names, section vocabulary, and field choices are one site's answers, not requirements. The authority on modeling is the official documentation (https://docs.prepr.io/content-modeling/best-practices); when this file and the docs disagree, the docs win. Adapt everything below to the project's actual content.

This file has no output of its own — three skills read it and produce different things. design-schema turns it into a model plan and the questions needed to get one agreed; create-schema turns it into models and fields in Prepr; review-schema turns it into findings on a schema that already exists. So each principle is written to be read in both directions: the decision to make, and what it looks like in a finished schema when the decision went the other way. Where a deviation is legitimate, that is said so explicitly — departing from the worked example is not a finding, and treating it as one is how a review turns into noise.

## Before you model

### Who the schema is for: developer-first vs. editor-first

A schema serves two audiences whose interests genuinely differ, and every field allocates a little of one to the other. Neither side wins outright: a schema built only for developers produces content nobody can maintain, and one built only for editors produces content the front end cannot render predictably. "Find a balance" is not advice, so what follows is the useful part — what each slant looks like once you have already fallen into it.

**Developer-first**, when the schema mirrors the front end's needs: a field per CSS property because the components wanted them configurable; a forty-field form with no dividers, no descriptions, and `internal_title` as the only orientation; `required` set where the front end wants non-null rather than where editors have something to say, so drafts get saved with placeholder text; entities named after the component that renders them (`HeroV2`, `SectionLarge`); every stack accepting every type because narrowing it would take a decision. The cost arrives as workarounds: editors paste HTML, duplicate items instead of referencing them, leave fields blank, and end up maintaining the real content somewhere else.

**Editor-first**, when every request became a field: free text where a fixed vocabulary exists, because flexibility was asked for; `ElementBox` or `html_editor` without a narrow `accept`, so any element can land in any slot; three ways to model the same thing because each stakeholder got their preference; everything embedded rather than referenced, so one testimonial lives in six pages; a display knob on every section, added on request rather than by design. The cost lands on the other side: the front end branches on strings nobody validates, one change has to be made in six places, and pages break in ways no one can reproduce.

The line between them is not a per-field compromise, it is a division of ownership: **the editor owns what the content says, the front end owns how it looks.** Every field should be assignable to one of those two. A field that belongs to neither — `wrapper_padding_top` — belongs to the design system instead. A field that seems to belong to both is usually two fields, or an enum where a free-form value was asked for.

### Who to involve, and when

A schema encodes whoever was in the room, and it stays legible afterwards. No SEO involvement shows up as a model with no metadata anywhere. No editor shows up as a form with no dividers, no descriptions, and no conditional fields. No front-end developer shows up as stacks that accept anything and enums with fifteen values. No product owner shows up as a model per page instead of a page-builder.

- **Who:** an editor who will use it daily rather than the person who manages them, the front-end developer who will query it, whoever owns SEO, whoever owns analytics and personalization if either is in scope, and the product owner who decides what is out of scope.
- **When:** while the model is still prose. The interview belongs before anything is built — that is what design-schema is for. A finished schema attracts cosmetic feedback; a plan attracts the structural objection, and that is the one worth having early.
- **Record who was not there.** An absent stakeholder is a decision, not an oversight. "SEO is out of scope for this phase" in the plan reads differently from a schema that silently has no SEO fields, and it tells whoever picks it up later what to revisit.

### Validate the model before you build on it

A model plan reads fine and still fails in use, so test it while changing it is free: build it in a Scratch environment and have an editor build a real page in it, before any front-end work exists.

- **Use the three hardest existing pages, not the easiest.** Test with the homepage and everyone approves everything. The page that defeated the previous CMS is the one that tells you something.
- **Watch what the editor does, not what they say.** Fields they skip are unclear or unnecessary; fields they ask about are missing a description; content they cannot express without reaching for HTML is a gap in the section vocabulary; anything they build twice is a shared model you have not created yet.
- **Have the front-end developer write one real query against it at the same time.** A shape that is pleasant to edit can still be painful to query — deep nesting, or a listing page whose stack can return fifteen types.
- **The timing is the whole point.** Before components are generated from the schema, every finding is free. Afterwards each one has a cost, and findings that have a cost get argued instead of fixed.

### Decisions that are expensive to reverse

Most of a schema can be changed on a Tuesday. A short list cannot, and that asymmetry is why design-schema probes these before anything is built and why a review separates them from everything else. The window closes when the first content is created, not when the front end ships.

**A content migration once items exist** — every existing item has to be touched:

- a field's `api_id`, or a model's `body_singular` — the latter also breaks every query and generated type built on it
- a field's type: Text → Enum, Boolean → Enum, or Integer → Text for anything with leading zeros
- tags → a taxonomy Model
- `multiple: true` added to a field that was single, which turns the GraphQL type into a list
- `required` added while items exist that do not satisfy it

**A change the front end feels immediately** — nothing to migrate, but the API shape moves:

- removing an enum value, or removing a type from a Stack's accepted list
- changing a slug template: the URLs change, and someone owes the old ones a redirect
- changing nesting depth after components have been generated from the schema

**Cheap whenever** — worth naming so no one spends the meeting on them: descriptions, dividers, field widths, icons, `folder`, adding a field, adding an enum value, adding a type to a Stack, and `filterable` (a schema change and a re-sync, but no content).

Two things behave unlike either group. `personalization` and `a_b_testing` are Stack-level flags that cost nothing at design time and are painful to retrofit, so they are decided from the project's posture rather than from need — see [Personalization and A/B testing](#personalization-and-ab-testing). And every display field and every enum option is a promise in one direction only: adding one is easy, removing one means finding every item that used it.

## Architecture

### The page-builder pattern

A proven architecture for content websites: a small set of routable **page models**, each with a `sections` Stack, composed of a deliberately small section vocabulary. From the example schema:

```
Page (Model, slug: {parent_page.slug}/{internal_title}/)
├── internal_title (Text, title: true)
├── parent_page (ContentReference → Page)     ← hierarchical URLs
├── sections (Stack, a_b_testing + personalization)
│   ├── SideBySide (Component)      text + image section
│   ├── Content (Component)         generic block container ← does most of the work
│   ├── CTA (Model, allow_new)      reusable call-to-action section
│   ├── ContentForm (Model)         content + form section
│   └── Personalization (Model)     per-segment section wrapper
└── seo (Component → SEO)
```

Key insight: keep the **section** level small (5-6 types), and put variety one level down. In the example, a `Content` section acts as a generic container: a `blocks` Stack accepting the whole block library (grids, media, quotes, tables, FAQ, pricing…) plus whatever display settings that project chose to expose, so new block types get added to `Content.blocks` rather than to every page model.

**That two-level nesting is one site's choice, not a rule.** Sections holding blocks pays off when there is a large block library that several section types share, or when display settings (background, width, spacing) belong on a wrapper rather than on each block. It costs editors an extra click per item and adds a level to every query and component. Flat is often better: put the block types directly in the page's `sections` stack when the library is small, when blocks do not need a shared wrapper, or when each section is self-contained. Some models want neither — a fixed field list is right for a strongly-structured page (a pricing page, an author profile), and rich text with embeddable components is right for article bodies. Pick per project; do not add a container level just because the example has one.

Detail pages (in the example: `Post`, `CaseStudy`, `Agency`, `Event`) are separate models: their own fields + slug template + the same `sections` stack for flexible extra content. Blog-like bodies use an `ElementBox` (rich text with embeddable components) instead of a sections stack. Which detail-page models exist follows entirely from the project's content — start from what the site actually publishes, not from this list.

### Model vs. component

- **Model**: has identity — queried directly, referenced from multiple places, or has a URL. Pages and detail pages, but also reusable content atoms: `Testimonial`, `Person`, `Logo`, `FAQItem`, `PricingPlan`, taxonomy terms. Also site singletons: `Navigation`, `Footer`, `Banner` (`single_instance: true`).
- **Component**: structure without identity — exists only inside a content item: `Button`, `TextGroup`, `Hero`-style sections, cards, grids.
- Test: "would an editor search for this, or reuse it on another page?" Yes → Model. "Is it just the shape of a part of a page?" → Component.
- Stacks can mix both: `CardGrid.cards` accepts `Card`, `Post`, `Agency`, `CaseStudy` models — the frontend renders each referenced item as a card. Reference models in stacks with `allow_new: true` so editors can create them inline.
- Both mistakes are visible in a finished schema. The same quote, author, or logo typed into several items is a Component where a Model belonged. A Model that only ever appears inside one page, reached through a picker dialog and never queried on its own, is the reverse.

### Flat vs. nested: how deep to compose

Nesting is not free structure. Every level costs an editor a dialog to open, every query a level of selection, the generated types a layer, and the front end a component whose only job is to pass its children through. [The page-builder pattern](#the-page-builder-pattern) covers one specific instance of this question — whether sections hold blocks; this is the general one.

- **Count the levels between the page and the field someone actually has to change.** That number matters more than the schema's total depth. In the worked example, fixing a typo in one feature's headline means Page → Content → FeatureGrid → FeatureItem: four dialogs down. Depth like that is sometimes worth what it buys, but it should be a decision someone made rather than something that accumulated one component at a time.
- **A level has to carry something.** Display settings shared by everything below it, reuse of the level below by more than one parent, or a genuine repeat — one grid, many cards. Those pay for themselves. A level that holds exactly one child, or whose fields would sit perfectly well on its parent, is a dialog in exchange for nothing.
- **The flattening test: remove the level, move its fields up, and see what breaks.** If nothing does, it was not carrying anything.
- **A reference is not a nesting level.** A Model in a Stack with `allow_new: true` lets an editor create it inline and then edit it as its own item — one screen rather than one more layer down. So when a branch is getting deep and the thing at the bottom has any reuse or lifecycle of its own, promoting it from Component to Model flattens the editing experience without giving up the composition.
- **Bound depth in the types, not in a comment.** A Component whose own Stack lists its own `ref` is infinite containment, and a note saying "one level only" enforces nothing: `NavItem → Stack(children) → [NavLink]` is one level by construction.
- **Model-to-Model cycles are not depth and are not a problem.** `Post → RelatedPostsBlock → Post` is a pointer between independent items — ordinary content modelling. Only Component-inside-Component containment is pathological, and a depth rule that flags both reports false positives on a healthy schema.

### Singletons

Site-wide structures are `single_instance: true` models: `Navigation` (NavItem → dropdown columns → menu groups → links/cards), `Footer` (NavColumn stack), `Banner`, site-wide stats. Query them once in the layout. The flag is the whole point: without `single_instance: true` nothing stops an editor creating a second `Navigation`, and the front end then quietly queries whichever one comes back first.

## Composition patterns

### The grid/card pattern

The default for a repeating layout is two components: a **grid** (layout) containing a Stack of **cards** (content). A repeat with no layout options of its own needs no grid wrapper — just a Stack of cards on the parent.

```
FeatureGrid { features: Stack<FeatureItem>, cards_per_row: Enum<CardsPerRow>, variant, alignment }
BentoGrid   { bento_cards: Stack<BentoCard> }        ← card carries its own card_width
PricingCardGrid { cards: Stack<PricingCard>, toggle_discount_label }
```

Layout options (columns, variant, alignment) live on the grid; per-item options (width, emphasis, image position) live on the card. Don't flatten cards into the grid, and don't create `TwoColumnFeatureGrid`/`ThreeColumnFeatureGrid` — one grid + a `CardsPerRow` enum.

### Shared atoms

Define once, reuse everywhere:

- **`Button`**: value + `ButtonType` enum + a `LinkType` enum gating a `ContentReference` vs. a URL Text via `appearance_conditions` (see [conditional fields](#conditional-fields)). In the example schema, every CTA is this one component.
- **`TextGroup`**: label + headline + `HeadlineStyle` enum + rich content + CTAs Stack + alignment. The standard "text part" of any section — `SideBySide`, `CTA`, `ContentCard` all embed it via a `Component` field.
- **`SEO`**: meta title/description/image + noindex/nofollow + sitemap priority. A `Component` field on every routable model, behind an "SEO" divider.

When two components need the same 3+ fields, extract a shared component instead of copying fields.

### References and taxonomy

- Relationships have one owning side, on the "many" side pointing to the shared entity: `Post.author → Person`, `CaseStudy.industry → Industry`. Shared entities (people, logos, testimonials, FAQ items) are always models — never duplicate a quote into every page that shows it.
- **Model taxonomy yourself — that is the recommendation.** Taxonomy terms are small models (`Topic`, `Industry`, `FrameworkCategory`): `title` + `Slug` + `priority` (Integer sort order) + optional `SEO` for category pages. Mark reference fields `filterable: true` so list pages can filter by them. A modelled term can grow fields (description, image, parent term for hierarchy), get its own landing page and slug, be referenced from anywhere, and be curated with the same publishing workflow as other content. This is the freedom tags cannot give you.
- **Prepr's built-in tags** (the `Tags` field) are the lightweight alternative and they do exist — see https://docs.prepr.io/mutation-api/tags. A tag is a label with `id`, `body`, `slug`, and timestamps, assignable to content items, assets, and visitors, and usable for filtering and as a recommendation signal. Tags live at environment level, not in the schema; **tag groups** bundle related tags (an `Article category` group), and the field's `appearance` restricts entry to a group (`"select"`, `"auto_suggest"`) or leaves it free.
- Choose tags when the terms are genuinely just labels: no term page, no term description or image, no hierarchy, and editors can be trusted with (or restricted from) free entry. Choose a model the moment a term needs fields, a URL, hierarchy, or curation — retrofitting tags into a model means migrating every item that used them. Mixed is fine: modelled `Industry` for the terms that have landing pages, free tags for loose keywords.
- A `Redirect` model (`source` path Text + `destination` reference + `permanent` Boolean) puts URL management in the CMS. It earns its place when marketing owns redirects or a migration produces many; when developers own URLs and they rarely change, framework-config or middleware redirects are simpler — no model needed. Ask who manages redirects before adding it.

## Naming and organisation

Casing per entity kind is a mechanic: mirror what the environment already uses. What a thing is *called* is a design decision, and it is close to permanent: renaming a field's `api_id` after content exists is a migration, and renaming a model's `body_singular` breaks every query and generated type built on it. Name as if you cannot rename.

### Naming models and components

- **Name the content, not how it appears.** This is what headless means at the naming level, and it is the rule the rest of this section is made of. A model is `Article`, not `ArticlePage`: whether the thing has a URL is what `slug` records, and the same item may render as a page, a card in a feed, a search result, an email, or a screen in an app. A name that picks one of those commits the content to a channel, which is the thing headless exists to avoid. Collections take it hardest — `FeaturedArticles` or `ArticleCollection` says what it holds and why, while `ArticleSwimlane`, `ArticleCarousel`, and `ArticleSlider` name a rendering the design will change without asking, and then the name is a lie no one can afford to fix. The rule bites on `ArticlePage`, `ProductPage`, `TeamCarousel`; it does not bite on `Page` in a page-builder, where a page genuinely *is* the content.
- **Use the word the editorial team uses.** A model's name is what someone says when they ask where the new one goes: `Testimonial`, not `QuoteBlock`; `CaseStudy`, not `DetailPage`. The GraphQL name serves developers, but the display name (`body`) is read dozens of times a day by people who never opened the schema. When the team and the front end have different words for the same thing, the team's word wins.
- **Never encode count, layout, or version.** `TwoColumnGrid`, `HeroV2`, `SectionLarge` each smuggle a design decision into an identifier, and each needs a *new* entity the day the design changes. The count belongs in an enum (see [the grid/card pattern](#the-gridcard-pattern)), the version belongs in git.
- **Leave the entity type out of the name.** `TestimonialComponent`, `ArticleModel`, `ColorEnum` — `label` already records which kind of thing it is, exactly as it does for the filename, so the suffix only duplicates something that can drift.
- **Singular for the thing itself.** A model is `Article`, never `Articles`; `body_plural` exists for the collection query and is the only place the plural belongs.
- **Name the thing, not the template it sits in.** `Person` outlives the page it was first needed for; `AboutPageTeamMember` does not. If the name only makes sense next to one page, it is either a component (embedded, no name needed elsewhere) or it is named too narrowly.

### Naming fields

- **One concept, one name, schema-wide.** Standard parts share a vocabulary every component reuses: `label` (small text above), `headline` (main heading), `text` (supporting body), `image`, `cta`. Editors learn it once. `headline` in one component and `heading` in another costs editors and front-end developers forever, and the schema gives no hint which is right — extend the vocabulary rather than inventing a synonym.
- **Booleans state a fact about the item, not an instruction to the front end.** `is_featured` survives a redesign; `show_badge` freezes a rendering decision into content and goes stale the moment the badge moves or disappears — that one is a display setting, and display settings are enums with defaults. The exception is a boolean that records an editorial decision rather than a rendering one: `show_in_footer` on a nav item or `hide_from_listing` on a post *is* the fact, and naming it around that would be a euphemism. The test: if the front end could change how it renders this and the value stays true, it is a fact — keep it.
- **Plural for stacks and multiples, singular for one reference.** `sections`, `cards`, `features`; `author`, `parent_page`. It reads as noise until you see it in generated types, where `card.features` and `card.feature_list` sit next to each other.
- **No abbreviation the editor would not use.** `cta` is fine because marketing says CTA; `img`, `desc`, `bg`, and `txt` are developer shorthand in an editor-facing label.

### Display names and API names

Every entity and field carries two names for two different readers, and they are written in different registers. Keeping them apart is mechanical once stated, and mixing them up is one of the most visible defects in a schema.

- **The display name is prose.** `body` is read by everyone: spaces, ordinary sentence case — "Cards per row", "Show in footer navigation". Not Title Case, which makes a form look like a menu and drifts within a week as some fields get it and some do not; and never an identifier, because an underscore in a label means someone pasted the `api_id` into it.
- **The API name is an identifier**, and it follows the spec's casing rules per entity kind — PascalCase for models, components and enums, snake_case for fields, SCREAMING_SNAKE for enum values. A display name that reaches the API, or an identifier that reaches the form, is a straightforward finding.
- **The two names may be in different languages, and usually should be.** The label follows the editors — a Dutch team gets "Kop" and "Uitgelicht" — while the `api_id` stays English whatever the editorial language, because it appears in queries, generated types, and front-end code, is read by developers who need not share that language, and outlives the team that chose it. The shared field vocabulary is part of that layer, so it stays English even where every label is Dutch. Decide it once per project and write it down: left to itself a schema ends up half in each language, which is worse than either. This is not localization — `body` is a single string, so a schema has one set of labels; locales translate content values, never schema names.
- **They do not have to be transliterations of each other.** The display name may be longer and clearer than the identifier allows: `show_in_footer` labelled "Show in footer navigation", `seo` labelled "Search engine settings". Match the meaning, not the characters.

### Grouping models and components: the folder key

`folder` groups entities in Prepr's schema section — the workspace of the people who maintain the model, developers and the product owner. It is not the editor's content navigation (that is `visible`, per model) and not the picker an editor sees when adding a section (that is `icon`, plus which types the Stack accepts). There are no subfolders: the list is flat and gets scanned whole. Nothing about `folder` reaches the API or the published site, so unlike a name it stays cheap to change — a bad grouping costs navigability, not a migration.

- **By default a component lives with the model that embeds it.** The model's folder holds the model plus everything only it uses. There is no judgement call, and the folder then carries real information: anything inside `CaseStudy` can be changed without looking anywhere else.
- **A shared folder appears when reuse actually happens, not before.** The moment a second model embeds the same component, move it out of the first model's folder. A folder that says `Page` while `Post` also depends on it is worse than no folder at all. Letting shared folders emerge this way keeps them honest and means a site with a single page model never grows an empty one.
- **Name a shared folder for what accepts it.** `_Sections` for what a page model's `sections` stack takes, `_Blocks` for what a section's `blocks` stack takes — each grid together with its cards, since they are a pair — and `_Shared` for what is only ever embedded and never offered by a stack: `Button`, `TextGroup`, `SEO`. Which one a component belongs in is a schema fact rather than an opinion: look at which field references it.
- **A component embedded by another component follows its owner.** Blocks are reached through the `Content` section, not through a page model, so they live wherever `Content` lives. Nearest owning entity wins.
- **Models with no components of their own do not each need a folder.** Group them — `Taxonomy` for `Topic` and `Industry`, `Site` for site-wide singletons. A folder holding one file is noise.
- **Do not group by abstraction level** — atoms, molecules, organisms. The boundary is arguable in exactly the cases you go looking for something (is a button with an icon an atom or a molecule?), so it drifts the moment more than one person files things, and Prepr already draws the line that carries structural weight: Model vs. Component *is* the "has its own identity" distinction. It is defensible in one situation — a front end whose component library is organised atomically, and a product owner fluent in that vocabulary, where mirroring the front end makes the schema-to-component mapping obvious. That trades the product owner's mental model for the developer's, so decide it deliberately rather than inheriting it from the front end.
- **Enums belong to no folder.** `folder: null` is fine, or one group of their own — they are referenced from everywhere and owned by no model.

## The editor's form

### Display settings: opt-in, not default

The front end owns presentation. **By default a section has no display fields at all** — spacing, background, and width come from the design system, and every knob an editor gets is a way to break the design and a promise the front end must keep forever. Add display fields per section, deliberately, when there is a stated need for per-instance variation ("this section sits on a dark background on some pages") or the site being rebuilt visibly varies it. Which sections get which knobs is a design-schema interview question — or read it off the existing site — never a house style applied to every section.

Where a display choice **is** exposed, it is a shared enum, never free text or booleans-per-style: `BackgroundColor`, `Spacing`, `MediaWidth` (`ONE_THIRD`/`ONE_HALF`/`TWO_THIRDS`/`FULL`), `CardsPerRow`, `ButtonType`, alignment and variant enums. Rules:

- Frontend maps enum values to CSS; editors never enter pixel values or hex colors.
- Always set `default_value` so sections look right with zero configuration.
- Reuse the same enum across fields (`Spacing` serves both padding and gap fields).
- Keep option lists short (2-4 values) — every option is a promise the frontend must keep.
- A common refinement: sensible global defaults + an `override_defaults` Boolean that conditionally reveals the display fields, keeping the form clean for the 90% case.

Two breaches are spottable without knowing the project: the same display fields on every section regardless of whether any of them varies, and an enum value the front end never implemented — which renders as nothing, silently, the first time an editor picks it.

### Form design conventions

Schemas are UIs for editors; design the form, not just the data:

- **A display title on every model and section-like component.** `title: true` marks the field the CMS lists items by, and editors need one to find anything. Name it after who reads it: `title` (or `headline`) where that text also renders on the site — detail pages, taxonomy terms; `internal_title`, described "Not shown on the website.", where the name exists only for editors — page models whose heading comes from a section, section components, wrappers, singletons. Slug templates reference whichever one it is (`"blog/{title}"` vs. `"{parent_page.slug}/{internal_title}/"`), so pick deliberately rather than reaching for one name everywhere.
- **Dividers** split a long form into named sections so editors scan it instead of reading it top to bottom.
- **Description on every field**, `help_text` appearance. Reuse standard texts for standard fields ("Main heading of this item.", "Supporting body text.").
- **Field widths**: related short fields side by side at 50/50 or 33/33/33.

What a breach looks like: fifteen fields and no divider, `description: null` across a whole model, or a variant enum whose irrelevant fields stay on screen for every variant.

### Conditional fields

The tool schemas give the syntax; the design question is which variation earns a switch. Conditional fields are the main way to keep an editor's form short without taking capability away: the form shows what applies to the thing being made and nothing else. The payoff grows with the schema — a component serving four cases with every field visible is four times more confusing than it needs to be, three-quarters of the time.

- **Drive the switch from an enum with a default, not a Boolean.** A `Button` that can point at an internal page or an external URL gets `link_type`, defaulting to `INTERNAL`, and each value reveals exactly its own fields: a `ContentReference` for internal; a URL text plus "open in new window" for external. A Boolean holds up until the third case arrives, and for links it always arrives — `mailto:`, `tel:`, an anchor on the same page, an asset download. Adding a value to an enum is free; splitting a Boolean into three states after content exists is a migration.
- **Default to the common case.** With `default_value` set on the discriminator, the form is already correct for most items and the editor changes nothing. A switch that defaults to the rarer branch makes every editor undo it.
- **Hide the field, do not neutralise it.** A field that does not apply should be absent from the form, not present and ignored. The alternative that shows up in practice is two near-identical components — `InternalButton` and `ExternalButton` — which doubles the section vocabulary and splits the front end's rendering over one field's difference.
- **Keep a field's visibility answerable from one other field.** Multiple conditions are AND-ed, which is enough to say "this belongs to that variant". A field whose visibility depends on three others is a component doing two jobs, and it should be two components.
- **Every condition is a promise the query has to tolerate.** A conditional field is not meaningfully `required`, so generated types make both branches nullable and the discriminator is the only thing that says which half is populated. Read it in one place — a mapper that turns the variant into a single shape — rather than branching on nulls in each component.

Two breaches are visible on sight: a component with a long field list where half the fields apply to one variant only, and a description that carries the condition instead of the schema — "leave empty if the link is external" is a missing `appearance_conditions`, written as help text.

## Field-level choices

### Slugs and URLs

- Slug templates on the model: `"blog/{title}"`, `"event/{title}"`, `"{parent_page.slug}/{internal_title}/"` for hierarchical pages via a self-referencing `parent_page`.
- `slug_postfix: true` prevents collisions.
- Set `review_urls` with `{slug}` placeholders on page models so editors get live preview.
- Two failures show up later: a slug template pointing at a field editors leave empty, which produces URLs nobody intended, and a routable model with no `review_urls`, which leaves editors publishing blind.

### Numbers and money

Prices in Integer **cents** (`price_monthly`, `price_annually`). Display-formatted prices ("Custom", "€49") as Text when marketing needs freeform. Never Float for money.

## Project posture

### Localization and translation

AI translation is a project decision, not a default — it sends field content through OpenAI, which privacy- or compliance-sensitive projects may not accept. Ask (a design-schema posture question, alongside locales). Where it is wanted: mark human-language fields with `openai_options: { "translate": "1" }`, leave it off URLs, names, email addresses, and identifiers, and decide per field at design time. Where it is not, editors translate manually or via an external workflow — see localize-content.

### Personalization and A/B testing

- Follow the project's personalization posture (ask if it is unknown). In scope or "maybe later" → enable `personalization: true` and `a_b_testing: true` broadly (every `sections` and `blocks` stack) — cheap at design time, painful to retrofit. A deliberate "no" → leave the flags off; they add variant controls to the editor UI that a team not running tests will only find confusing.
- Add a `Personalization` model: `internal_title` + its own `sections` stack, accepted inside every page's sections stack. Editors wrap any group of sections in per-segment variants without schema changes.
- The frontend must send the visitor/customer identifier for adapted responses — see the `query-content` skill.
- Half-enabled is the state to look for: the flags on some stacks and not others, so editors can vary one section and not the next with nothing in the UI explaining why.
