---
name: review-schema
description: >-
  Review a live Prepr CMS schema and report what to improve. Use this skill
  whenever the user wants to review, audit, or improve a Prepr content model,
  asks "is this schema any good", wants a second opinion before content is
  added, or inherits an environment and wants to understand its model. Makes
  no changes; fixes go through create-schema.
license: MIT
metadata:
  author: Prepr
---

# Review a Prepr schema

Review the schema of a live Prepr environment and deliver concrete,
prioritized fixes. A review has two layers: **design** (is it a good schema)
and, where content exists, **actual use** (what editors did with it, which
contradicts the design more often than anyone expects).

This skill is **read-only**. It never changes the schema; fixes go through
**create-schema**, which plans them and waits for a yes.

Run [the check](references/mcp-connection.md#the-check) first. This skill
needs MCP. If it is not connected, offer **connect-prepr** and stop. Name the
environment under review in the first line of your report.

## Step 1: Collect the whole schema

Page through `list_schema` to the last page, then call `get_schema_entity` for
every model and component, and for the enums they use. Reference and stack
findings are meaningless from a partial view.

If the environment has more than 40 entities, say how many there are and ask
whether to review everything or a named area (for example "the page builder"
or "the blog").

## Step 2: Assess the design

Judge against https://docs.prepr.io/content-modeling/best-practices (the
authority) with
[schema-design-principles.md](references/schema-design-principles.md) as a
worked example of the patterns in practice. Deviating from the example is
never a finding by itself; only deviations from documented best practices or
from the principles' reasoning are. Check in particular:

1. **Model/Component/Enum choices.** Standalone lifecycle or cross-page
   reuse → Model; embedded structure → Component; fixed choice list → Enum,
   never free text.
2. **Composition fits the content.** Judge whether each model's shape matches
   what it holds, not whether it matches one house pattern. A flexible stack
   suits pages whose layout editors vary; a fixed field list suits
   strongly-structured content (pricing, profiles, product data); rich text
   with embeddable components suits article bodies. None of these is the
   default. Flag a real mismatch (a stack of one permitted type, a fixed field
   list on a page editors clearly need to compose freely, a section vocabulary
   grown past about 6 near-identical types) and do **not** flag a flat block
   stack for lacking a container level, or a field-list model for not being a
   page builder.
3. **Duplication.** Near-identical components (HeroV2, repeated
   label/headline/text groups) → shared atom or variant enum. Repeated option
   lists → shared enum.
4. **References and taxonomy.** Shared entities duplicated instead of
   referenced; fields that listing pages filter on but that are not
   filterable; reference fields allowing hundreds of items where the front end
   renders one. For taxonomy, a content item per term is the house default;
   flag any Tags field used for something category-shaped (anything that may
   need a term page, a description or image, hierarchy, or a curated
   vocabulary), since converting tags to a Model later means migrating every
   item that used them. A term Model with nothing but a title is **not** a
   finding.
5. **Editor experience.** Missing internal title on models editors must find;
   missing field descriptions; forms without dividers past about 8 fields;
   variant-specific fields not hidden behind conditional display;
   presentation enums without a default; guidance crammed into a field's
   label instead of its description; models with no title field, or more than
   one. Also check translation intent: human-language text should be marked
   for translation, and URLs, names and identifiers should not.
6. **AI context.** Models and fields without an AI description. Prepr's AI
   features and every MCP client read it; one sentence per model is enough.
7. **Naming.** Presentation-based field names (`small_text_left`),
   inconsistent vocabulary across components (headline vs title vs heading
   for the same role), casing that differs from the rest of the environment.
8. **Future pain.** Personalization and A/B testing not enabled on section
   stacks, missing SEO component on routable models, missing slug templates
   on page models, Float used for money.

## Step 3: Assess against actual use

Only when content exists. Before launch there is nothing to measure, so skip
this step and say so. Count and sample content with `query_items` (conditions
under `filters`), read-only.

The schema was designed against expectations. Content records what actually
happened, and the gap is a class of finding no pre-launch review can produce:

- **A type nobody uses.** A section or block type present in no item, or a
  personalization variant never filled in. Either the vocabulary is larger
  than the site needs or editors do not know the type exists; ask which
  before recommending removal.
- **A field nobody fills.** An optional field empty on almost every item is
  unclear, unnecessary, or in the wrong place in the form. An enum value never
  chosen is the same finding one level down.
- **A count that contradicts the design.** A model with three items where the
  plan assumed hundreds is over-modelled. A stack grown to fifty entries wants
  a filtered listing and filterable fields, not a longer stack.
- **Duplication that names a missing model.** The same quote, author, or logo
  typed into many items is a Component where a Model belonged.
- **Fields carrying what the model does not offer.** Editors pasting HTML into
  a text field, or using a headline field for a label, have marked the shape
  they needed and did not get.

Because content exists, almost everything structural here is a migration
rather than a free change. Say what the migration would cost next to each
recommendation, and expect "leave it, and stop offering the unused type to
editors" to be the right answer more often than it is before launch.

## Step 4: Report

Lead with a verdict, then group findings by **what acting on them costs**.
Within a group, order by impact, and put a finding that covers others above
the ones it covers.

```markdown
# Schema review: <environment>

**Verdict.** One sentence on the state of the model, plus the single change
you would make if there were time for only one.

## Fix before content exists
Free today, a content migration later. When content already exists this group
is titled **Needs a content migration** instead, and each finding states what
the migration involves.
- **Must** · <category> — **<Model>.<field>**: <problem>. Fix: <concrete change>.

## Fix any time
Costs the same next quarter as it does today.
- **Should** · <category> — **<Model>**: <problem>. Fix: <concrete change>.

## What's good
- <1-3 things done well, so the next person does not "fix" them>
```

Severity has three levels:

- **Must**: breaks silently in production, or blocks editors
- **Should**: costs editors or developers on every use
- **Consider**: a real improvement whose absence is defensible

Every finding carries a category (Architecture, Composition, Naming, Editor
form, Field types, Posture, from the sections of
[schema-design-principles.md](references/schema-design-principles.md)), the
entity and field it applies to, and a fix concrete enough to apply without a
follow-up question.

Rules that keep the report useful:

- **Which group a finding belongs in depends on whether content exists.**
  Check with a content query. On an empty environment the middle group is
  empty and everything structural is free; say so, because it is the best
  news a review can carry.
- **What belongs in "Fix before content exists"** is the list in
  [Decisions that are expensive to reverse](references/schema-design-principles.md#decisions-that-are-expensive-to-reverse).
- **Bundle mass findings.** "19 fields have no description" is one finding,
  not nineteen.
- **Weigh editor experience as heavily as API cleanliness.** A valid model
  with 40 flat fields is still a bad schema.

## Step 5: Offer fixes

Ask which findings to fix. Hand the chosen ones to **create-schema**, which
plans them, waits for a yes, and applies them. Never change the schema from
this skill.
