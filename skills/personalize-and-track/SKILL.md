---
name: personalize-and-track
description: >-
  Use this skill whenever a developer wants to add Prepr tracking,
  personalization or A/B testing to a website or app front end, in any
  stack. Covers installing the Prepr tracking pixel or tracking code,
  binding pages to content items, recording events, impressions and
  conversions, tagging elements with data-prepr attributes, server-side
  tracking, consent, the visitor id and Prepr request headers, showing
  each visitor their personalized or A/B variant, static sites with A/B
  tests, recommendations, the preview switches for segments and variants,
  and checking that events and variants arrive in Prepr. Use
  manage-content to create the variants themselves.
license: MIT
metadata:
  author: Prepr
---

# Personalize and track with Prepr

Help a developer wire Prepr's tracking, personalization and A/B testing
into their front end. It builds on a working front end (queries, fetcher,
rendering). If that isn't there yet, start with **build-frontend**.

Editors create segments, adaptive content and A/B variants in Prepr. To
add variants to an item, use **manage-content**. Segments are created in
the Prepr app.

## How the pieces fit

1. **Tracking** identifies the visitor and records what they do:
   page views, impressions, conversions and custom events. It feeds
   segments and A/B results. See [tracking.md](references/tracking.md).
2. **Personalization and A/B testing** send the visitor's id (and segments
   or A/B group) with each GraphQL request, so Prepr returns their variant.
   See [personalization.md](references/personalization.md).
3. **The Prepr toolkit** does the plumbing for common frameworks: visitor
   cookie, headers, pixel, preview switches. Everything also works without
   it. See [toolkit.md](references/toolkit.md).

An A/B test needs both halves: the variant shown (impression) and the
action taken (conversion). A test that records only clicks never resolves.

## Start

1. Read the project: framework, how it fetches from Prepr, whether pages
   are rendered per request or built statically, any existing analytics or
   tag manager, and any consent banner.
2. Ask what the user wants: tracking only, personalization, A/B tests, or
   all of them. Ask which conversions matter (a form sent, a demo request,
   a sign-up).
3. Check the stack fields in the schema (MCP: run
   [the check](references/mcp-connection.md#the-check), then
   `get_schema_entity`, or the files in `prepr/schema/`). Personalization
   and A/B testing must be switched on for the stack fields that will
   carry variants.

## Rules

- **Consent first.** Load the pixel and send visitor ids only once the
  visitor allows it, where the site's consent policy requires that. Fit
  into the existing consent tool; ask the user what their policy is.
- **Never cache a personalized response in the app,** and fall back to the
  non-personalized content when the personalized request fails or there is
  no visitor id.
- **Use a stable id** for known visitors (the id from your identity
  provider). Never an email address or other personal data.
- **Tokens:** the pixel's token ends up in the browser. The toolkit README
  advises a tracking-only token there.

## Check it works

- **Events:** in the browser's Network tab, filter for `pixel.gif` and
  check that a request goes out for each event.
- **In Prepr:** open the visitor in the Segments section and check the
  events table, and the A/B test's results once impressions and
  conversions come in.
- **Variants:** use the preview switches for segment and A/B variant on the
  preview deploy, and compare with a private window on the live site.
