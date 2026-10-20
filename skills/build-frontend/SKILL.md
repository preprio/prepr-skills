---
name: build-frontend
description: >-
  Use this skill whenever a developer wants to use Prepr CMS content in a
  website or app, in any stack (Next.js, Nuxt, Astro, SvelteKit, React, Vue,
  Angular, Laravel, PHP, plain Node or anything else that speaks HTTP).
  Covers writing Prepr GraphQL queries from the schema, setting up a
  fetcher or client (fetch, Axios, graphql-request, urql, Apollo, a PHP
  client), access tokens and environment variables, fragments, generated
  TypeScript types and type-safe components, rendering stacks, dynamic
  content and rich text as components, images, slug routing, 404s and
  redirects, locales, caching and revalidation with webhooks, preview, draft
  mode and visual editing with the Prepr toolkit. Also use it to debug
  Prepr GraphQL errors or empty results in front-end code.
license: MIT
metadata:
  author: Prepr
---

# Build a front end on Prepr

Help a developer fetch Prepr content over GraphQL and render it, in the
stack they already use. Prepr is framework-agnostic: there is no required
SDK. Fit into the project's existing patterns; don't introduce a new client,
framework or folder structure unless the user asks for one.

Personalization, A/B testing and tracking build on this; for those, use
**personalize-and-track**.

## Start from the project

1. **Read the project.** Find the framework and its version, the language,
   the package manager, any GraphQL client already installed, an existing
   codegen config, existing queries and fragments, and how env vars are
   loaded. Follow what is there.
2. **Read the schema.** In this order, use what exists:
   - schema files in `prepr/schema/`;
   - MCP: run [the check](references/mcp-connection.md#the-check), then
     `list_schema` and `get_schema_entity`;
   - GraphQL introspection with the project's token (an explorer, or the
     generated schema file if codegen already ran).
   Never guess field names. Prepr's system fields start with an underscore
   (`_id`, `_slug`); a field that isn't in the schema fails the query.
3. **Ask about anything that isn't in the code:** which environment, which
   pages, which locales, how the site is deployed. Don't pick for the user.
4. **Ask which pages will be A/B tested or personalized,** now or later.
   Those pages are not cached and are rendered per request, so this decides
   how you build them. See
   [caching-preview.md](references/caching-preview.md#pages-that-are-personalized-or-ab-tested).
   If you plan to A/B test or personalize a page, don't build it as static.

## Tokens and environment

- The endpoint is `https://graphql.prepr.io/<ACCESS_TOKEN>`, with the
  token in the URL.
- GraphQL tokens are read-only. Each environment has a **GraphQL
  Production** token, which returns published content only, and a
  **GraphQL Preview** token, which returns every workflow stage. Use
  Production for the live site and the Preview token for the preview
  deploy.
- The Production token may be used in the browser: it shows nothing that
  isn't already on the site. Keep the Preview token on the server, because
  it returns unpublished content.
- Read the URL from an env var such as `PREPR_GRAPHQL_URL`, so each deploy
  can use its own token. Don't hard-code it.

## The steps

1. **Queries:** build them from the schema, see
   [queries.md](references/queries.md).
2. **Fetcher:** one small function or client the whole app uses, see
   [fetchers.md](references/fetchers.md).
3. **Types:** fragments per model and generated types where the stack has
   types, see [types.md](references/types.md).
4. **Rendering:** stacks and dynamic content to components by
   `__typename`, slugs, 404s and redirects, images, see
   [rendering.md](references/rendering.md).
5. **Caching and preview:** personalized pages, revalidation by webhook,
   preview, draft mode and visual editing, see
   [caching-preview.md](references/caching-preview.md). The Prepr toolkit
   is in [toolkit.md](references/toolkit.md).

Work one page type at a time: query, fetch, render, then check it in the
browser against the content in Prepr.

## Patterns, not one way

Show the pattern that fits the project, and name the alternatives in a line
when they matter. Some choices are the user's:

- a GraphQL client or plain `fetch`;
- where queries live: follow what the project has; in a new setup, prefer `.graphql` files
  over queries in code (see [types.md](references/types.md#where-queries-live));
- codegen or hand-written types;
- server rendering, static generation or both;
- one catch-all route or a route per model.

Recommend, don't impose.

## Debugging

Work through these in order:

1. **Auth:** a `401` or an HTML error page means a wrong or expired token,
   or a URL without the token.
2. **The query:** read `errors[]` in the response. A Prepr reply can be
   `200` with errors.
3. **Empty results:**
   - Is it the right token? A production token sees only published items.
   - Is it the right locale?
   - Is the item published?
   - The CDN can serve a cached copy for a moment after a change. Check the
     `X-Prepr-Cache` response header.
4. **Types:** after a schema change, regenerate types and fix what breaks.
