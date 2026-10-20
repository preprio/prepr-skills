# Personalization and A/B testing

Docs: https://docs.prepr.io/personalization/setting-up-personalization and
https://docs.prepr.io/ab-testing/setting-up-ab-testing

## The visitor id

1. On each request, read the `__prepr_uid` cookie. If it is missing,
   generate a UUID and set it as `__prepr_uid` (one year, `Secure`,
   `SameSite=Lax`). If the visitor is logged in, use their id from your
   identity provider instead.
2. Send it as `Prepr-Customer-Id` on every GraphQL request for that page.

Do this in the framework's middleware or server hook, so every route gets
it. The toolkit does exactly this (see [toolkit.md](toolkit.md)).

## Request headers

| Header | Value |
|---|---|
| `Prepr-Customer-Id` | the visitor id |
| `Prepr-Visitor-IP` | the visitor's IP, for location-based segments; set it on the server |
| `Prepr-Context-utm_source` (and `_medium`, `_campaign`, `_term`, `_content`) | UTM values from the URL |
| `Prepr-Segments` | segment API ids, comma-separated, sorted; for segments you work out yourself |
| `Prepr-ABTesting` | `A` or `B`, to force a variant |

HTTP header names are case-insensitive, so `Prepr-ABTesting` and the
toolkit's `Prepr-ABtesting` are the same header.

With `Prepr-Customer-Id`, Prepr works out the visitor's segments and A/B
group itself. `Prepr-Segments` is for segments you decide yourself (from
your own data). It doesn't build a Prepr profile, so it can't drive A/B
tests on its own.

Without a visitor id, Prepr returns the variant for all other visitors.

## Querying variants

Select `_context` on items in personalized stacks:

```graphql
sections {
  __typename
  ... on Hero { _id heading _context { kind variant_key variant_id } }
}
```

- `variant_key` goes on the rendered element as `data-prepr-variant-key`
  (see [tracking.md](tracking.md)).
- A visitor in several segments gets the first matching variant.
- `variant_id` is the segment id, `ALL_OTHER_USERS`, or `A`/`B`.

## Never cache the page

A page with personalized or A/B variants must not be cached anywhere: not
by static generation or ISR, not in a framework page or data cache, not at
the host's CDN or a proxy. A cached page serves one visitor's variant to
everyone, and an A/B test on it never splits.

- Render it per request on the server, with the visitor headers, and send
  `Cache-Control: private, no-store`.
- Prepr's CDN caches each variant of the GraphQL response; that is safe and
  stays on.
- Do this for pages the team plans to personalize or A/B test too. When
  personalization is added to an existing site, switch those pages to
  per-request rendering first, and check the host's cache settings.
- **Fall back:** no visitor id, or a failed request, means the
  non-personalized content is used, so the page always renders.
- The GraphQL response's `Vary` header names `Prepr-Segments` or
  `Prepr-ABTesting` when the content has variants. Use it to catch a page
  that has variants but is still cached.

## Static sites

Only when a page must be built statically: fetch every variant at build
time and route each visitor to theirs at the edge, so each variant is its
own page. The routed response must not be cached across visitors.

1. Query with `personalize: false` on the stack field
   (`sections(personalize: false) { ... }`). It returns every variant with
   its `_context`. Build each variant.
2. For A/B tests, the edge middleware asks Prepr for the visitor's group.
   It sends `Prepr-Customer-Id` with `Prepr-Bucket-Customer: true`, reads
   `X-Prepr-Customer-Bucket` (`A` or `B`) from the response, and routes to
   the matching build.
3. For segments, the same pattern needs the visitor's segments at the edge;
   per-request rendering of that section is usually simpler.

Check the A/B testing docs for the current bucketing request before you
build it.

## Recommendations

Per model, Prepr offers `Similar_<Plural>(id:)`, `Popular_<Plural>` and
`PeopleAlsoViewed_<Plural>(id:)`. Personalized ones need the visitor
headers like any personalized query. Always render a fallback when the
list comes back short.

## Preview switches

On the preview deploy, Prepr's preview bar lets editors pick a segment and
an A/B variant. It adds `prepr_preview_segment` and `prepr_preview_ab` to
the URL; turn those into `Prepr-Segments` and `Prepr-ABTesting` headers.
The toolkit's middleware does this for you.
