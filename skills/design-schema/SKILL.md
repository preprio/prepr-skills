---
name: design-schema
description: >-
  Interactively design a Prepr CMS content model before anything is built.
  Use this skill whenever the user wants to figure out what their content
  model should be, says they want to design, plan, scope, or think through a
  schema, asks "how should I model X in Prepr", is starting a new Prepr
  project without a clear model in mind, is unsure whether something should
  be a model, component, or enum, or hands over a vague brief ("a marketing
  site", "a webshop", "our blog") that is not yet specific enough to build.
  For adding a field or one small model to an existing schema, the
  create-schema skill applies directly.
license: MIT
metadata:
  author: Prepr
  category: cms
  homepage: https://docs.prepr.io/content-modeling/fundamentals
---

# Design a Prepr content model

Interview the user, then write a content model plan they have agreed to. This
skill makes **no changes in Prepr**; building is create-schema's job. Its
output is an agreed plan plus a confirmed decision list.

The failure this skill exists to prevent: building forty models from a
one-line brief, then discovering the model does not match how the site is
actually edited. Questions are cheap now and expensive after content exists.

**Scope check before starting.** If the model is already agreed and written
down, skip to **create-schema**.

**This skill is for designing a model, not for changing one.** Adding a field
to an existing model, or one small model to a schema that already exists, does
not need an interview, a stakeholder round, or a plan document — go straight to
**create-schema**, which has a path for extending a live schema. Run this skill
for an existing project only when the change is structural: a new content type
with its own relationships, a page-builder vocabulary, a taxonomy, or a
reshaping that will migrate existing content.

**Read the live schema first.** Run
[the check](references/mcp-connection.md#the-check). If Prepr tools are
present, page through `list_schema` before asking anything: reuse existing
models and components, and avoid name clashes. This skill also works
without MCP; then ask the user what already exists.

## The route to an agreed model

The steps below are one conversation, but the model they produce passes through
phases with different people in them:

1. **Frame** — the design source, editors, locales, and personalization
   posture are known. Step 1.
2. **Inventory** — what the site actually publishes, worked out from what
   exists rather than from the industry. Steps 2–3.
3. **Stakeholder round** — the people whose absence is visible in a finished
   schema see the model before it is agreed, and are asked about its shape
   rather than its field names. Who they are, and what each one's absence
   looks like afterwards: [schema-design-principles.md](references/schema-design-principles.md#who-to-involve-and-when).
4. **Plan** — the plan is the thing everyone reviews and agrees. It stays in
   chat; save it to `docs/prepr/schema-plan.md` only if the user asks (useful
   when others need to review it). Step 5.
5. **Validate** — the agreed plan is built in a Scratch environment and an
   editor builds a real page in it, before any front-end work. Step 6.
6. **Build** — create-schema, then review-schema. Step 8 hands off.

The gate that matters is between 5 and 6. Once content exists or the front end
is built on the schema, findings stop being free — see
[schema-design-principles.md](references/schema-design-principles.md#decisions-that-are-expensive-to-reverse).

## Ground rules for the conversation

1. **Ask, do not assume.** Never invent a model list from the project's
   industry. "A marketing site" tells you almost nothing about what they
   publish.
2. **One topic at a time.** Ask 1–3 related questions per turn, wait for the
   answer, then move on. Do not send a 20-question survey.
3. **Offer concrete options over open prompts.** "Do articles have one author,
   several, or none?" beats "tell me about authors." Where a default is
   clearly right, state it and ask only for a correction.
4. **Show, then check.** Reflect each answer back as a concrete modeling
   consequence ("so `Article.authors` is a reference to `Person`, max 3") so
   the user can catch a misread immediately.
5. **Cite reality, not patterns.** Ground every model in something the user
   said they publish or edit. If you cannot point to a stated need for a
   model, drop it.
6. **Stop when it is enough.** The goal is a plan good enough to build and
   easy to extend — not a complete model of every future page. Fields are
   easy to add later.

## Step 1: Understand the project

Before modeling anything, establish:

- **What is being built.** A marketing site, a documentation site, an
  app's content backend, a webshop, an intranet? What already exists — is
  this a rebuild of a live site (get the URL and look at it), a migration
  from another CMS (which one), or greenfield?
- **Who edits it.** A single technical owner, a marketing team, dozens of
  contributors across departments? Editor skill level and volume change how
  much structure versus freedom the model should have.
- **What the front end is.** Framework, and whether it exists yet.
- **What the design source is.** A design system, Figma file, component
  library, or the existing site — get the link. The section vocabulary and
  the display-freedom decisions in Steps 3 and 4 are read from it; without
  one, those answers must come from the user question by question.
- **Languages and locales**, if any. Multilingual is far cheaper to plan for
  now than to retrofit.
- **Personalization, A/B testing, or recommendations** — planned, maybe
  later, or not at all. This decides which stacks need `personalization` and
  `a_b_testing` enabled at design time, and it drives front-end caching
  decisions later.

If the user is rebuilding an existing site, offer to inventory it: list the
page types and repeated section patterns you can see, and use that as the
starting point for Step 2 rather than asking them to describe it from memory.

## Step 2: Inventory the content

Work outward from what the site actually publishes.

1. **Routable things** — what has its own URL? Pages, articles, products,
   events, profiles, case studies. For each: roughly how many, who writes
   them, and what the URL looks like (this becomes the slug template, and
   any `/parent/child/` structure means a self-reference).
2. **Repeated entities** — things that appear in several places and should
   exist once: authors, testimonials, logos, locations, FAQ items, pricing
   plans, taxonomy terms. Ask directly: "if this appears on three pages and
   someone edits it, should all three change?" Yes → its own Model.
3. **Site-wide singletons** — navigation, footer, global banner, site
   settings.
4. **External data** — anything mastered in another system (a product
   catalog, an events API). That should not be copied into a Prepr model;
   note it under "Deliberately not modeled" and say that connecting it as a
   remote source is outside these skills.

For each candidate, capture the fields the front end will actually render.
Resist fields nobody named.

## Step 3: Decide the composition shape per model

This is the decision users most often get handed to them as a house style
rather than a choice. **There is no default shape.** For each routable model,
pick deliberately:

- **A flexible stack of components** — for pages whose layout editors need to
  vary and reorder. Ask: "does marketing need to build new page layouts
  without a developer?"
- **A fixed field list** — for strongly-structured content where every item
  has the same parts: pricing plans, team profiles, product specs, event
  details. A page builder here just gives editors a way to break the design.
- **Rich text with embeddable components** — for article and documentation
  bodies, where the content is prose with occasional embeds.
- **A mix** — very common: fixed fields for the structured part plus one
  stack for flexible extra content below it.

If a stack is right, decide the **nesting** just as deliberately:

- **Flat** — the block types sit directly in the page's stack. Right when the
  block library is small or each block is self-contained. Fewer clicks for
  editors, one less level in every query and mapper.
- **Nested** — sections that each hold a stack of blocks. Right when display
  settings (background, width, spacing, column count) belong on a shared
  wrapper, or when a large block library is reused across several section
  types.

Nesting everything inside a generic content section is one pattern among
several, not a requirement — do not adopt it unless one of those two reasons
applies. State which you picked and why in the plan.

When the plan names field types, use the editor names (Text, Rich text,
Content reference, Stack, Component, Enum, …). create-schema maps them to tool
parameters and has the per-type "use when / don't use when" guide.

Then confirm each **Model vs Component vs Enum** call, per
https://docs.prepr.io/content-modeling/fundamentals: identity and reuse or
its own URL → Model; structure that only exists inside an item → Component;
a fixed choice list → Enum, never free text.

## Step 4: Probe the decisions that are painful to reverse

Ask about these explicitly, because retrofitting them means migrating
content:

- **Multilingual** — which fields are translated, which (URLs, codes, names)
  are not. Also whether Prepr's AI translation is acceptable: it sends field
  content through OpenAI, which privacy-sensitive projects may decline —
  ask, do not default it on.
- **Personalization and A/B testing** — which stacks need it enabled.
- **Taxonomy** — default to **modelling terms yourself** as small Models
  (`Topic`, `Industry`): most freedom, since a term can then carry fields,
  a landing page and slug, hierarchy, and its own curation workflow. Prepr's
  built-in **tags** (`Tags` field, plus tag groups to restrict entry — see
  https://docs.prepr.io/mutation-api/tags) are the lightweight option for
  terms that really are just labels. Ask what each term has to do: "does a
  topic need its own page, a description, or an image?" and "who is allowed
  to invent a new term?" Any yes on the first, or a curated vocabulary on
  the second, means a Model. Say which you chose and why — swapping tags for
  a model later means migrating every item that used them.
- **Editor display freedom** — default to the least: the design system owns
  spacing, backgrounds, and layout, and a section ships with **no display
  fields**. Ask which sections genuinely need per-instance variation, or
  read it off the design source from Step 1 (where the design shows the same
  section on light and dark backgrounds, that variation is real), and expose
  only those — as shared enums with defaults, per schema-design-principles.
  Every exposed knob is a permanent front-end promise, so this is decided per
  section, never as a blanket style.
- **Relationships and cardinality** — one or many, and which side owns the
  reference. Also which fields need `filterable` because a listing page will
  filter on them.
- **URL structure** — flat or hierarchical, and whether URLs will change
  (which means a redirect model — Prepr has no built-in redirect feature).
- **Publishing workflow** — scheduled publishing, drafts, review states,
  who approves.
- **Growth** — what content types are likely next quarter. Not to build them,
  but to check the shape does not block them.

## Step 5: Write the plan and get agreement

Write the plan in chat using this structure. Save it to
`docs/prepr/schema-plan.md` only if the user asks.

```markdown
# Content model plan: <project>

## Context
Front end, editors, locales, personalization posture, migration source.

## Models
### <Name> (Model | Component | Enum)
- **Why it exists**: <the stated need>
- **Shape**: <fixed fields | stack (flat/nested) | rich text | mix> — <why>
- **Fields**: name — type — notes (required, filterable, translated, default)
- **URL**: <slug template, if routable>
- **Relationships**: <references in and out, cardinality>

## Composition decisions
Which models use which shape, and the reason for each — especially any
nesting choice.

## Deliberately not modeled
Things discussed and excluded, with the reason. Prevents re-litigating.

## Open questions
Anything still unresolved, and what unblocks it.
```

Then present a short summary in chat — the model list, the composition
decision per model, and any open question — and ask for explicit
confirmation or corrections. Iterate on the plan until the user agrees.
Do not build anything in Prepr inside this skill.

Agreement means the stakeholder round, not only the person in the chat. Ask
who has seen the plan, and name who is missing rather than treating silence
as approval — an absent stakeholder is a decision worth recording in the
plan, not a gap to discover later.

## Step 6: Validate the model before building on it

A plan that reads well can still fail in use, and the only way to find out is
to have someone build with it. Offer this explicitly — teams skip it because
the plan looks finished:

- Build it in a Scratch environment with create-schema and have an editor
  try one real page in it. No front-end work yet.
- Use the three hardest existing pages, not the easiest.
- Have the front-end developer write one real query against it at the same time.

What to watch for while they work, and why the timing is the whole point:
[schema-design-principles.md](references/schema-design-principles.md#validate-the-model-before-you-build-on-it).

Feed what it turns up back into the plan and re-agree it before handing off. If
the user declines the round — no environment yet, no editor available — say
what they are trading: a finding that is free today costs a content migration
once items exist.

## Step 7: Environment AI context

Steps 1 to 4 tell you most of what the environment's AI context needs:
organisation, audience, purpose, tone, languages and content types. Draft it
in the shape from
[ai-context.md](references/ai-context.md#environment-ai-context), show it with
the plan, and ask the user to paste it under Settings → General → AI context.

## Step 8: Hand off

Once the plan is agreed, say that the next step is **create-schema**, which
shows the exact changes and builds them after a yes. Do not start building
without telling the user.

## Related skills

Build the plan with create-schema. Audit an existing schema with
review-schema. Patterns and anti-patterns:
[schema-design-principles.md](references/schema-design-principles.md).
