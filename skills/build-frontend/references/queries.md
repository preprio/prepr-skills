# Prepr GraphQL queries

Docs: https://docs.prepr.io/graphql-api. Append `.md` to a docs URL for
Markdown; some code examples only appear in the HTML page.

## Names

Each model has two queries, named after the model's singular and plural
names:

```graphql
query Post($slug: String!) {
  Post(slug: $slug) { _id title _slug }
}

query Posts($limit: Int, $skip: Int) {
  Posts(limit: $limit, skip: $skip, sort: publish_on_DESC) {
    items { _id title _slug }
    total
  }
}
```

- A single-item query takes `id` or `slug`, plus `locale`. A model set to
  a single item takes no arguments (`AppSettings { ... }`).
- A list query returns `items { ... }` and `total`. Forgetting `items { }`
  is a common error.
- `ContentItems` queries several models at once; filter with
  `where: { _typename_any: [...] }` and use `... on Model` per type.

## System fields

`_id`, `__typename`, `_slug`, `_locale`, `_locales`, `_localizations`,
`_created_on`, `_changed_on`, `_publish_on`, `_last_published_on`,
`_read_time`, and `_context` on personalized and A/B items. The full list:
https://docs.prepr.io/graphql-api/schema-system-fields

`_slug` holds the whole path the model's slug template produced (for
example `blog/my-post`). Use it as the URL path; don't rebuild it.

## Lists

- `limit` defaults to 10. Always set it, and page with `skip` until you
  reach `total` when you need everything (slugs for static pages, sitemaps,
  redirects). `total` is costly on large sets; leave it out when you don't
  need it.
- `sort`: `publish_on_DESC` (the default), `created_on_`, `changed_on_`,
  or a field (`title_ASC`).
- `where` filters on the server; don't fetch everything and filter in
  code. Common filters:
  - `_slug_any: [...]`, `_id_any: [...]`;
  - `_search` for full text;
  - `title_contains`, `price_gte` and other field operators;
  - `_tags_any`;
  - `_or: [...]` to combine;
  - for a reference: `author: { name: "..." }`, or `_id_any` on a stack or
    union reference.

  Details: https://docs.prepr.io/graphql-api/fetching-filtering-collections

## Stacks, references and components

A stack or a reference to several models returns a union. Select
`__typename` and one inline fragment per type:

```graphql
sections {
  __typename
  ... on Hero { _id heading image { url(width: 1600) width height } }
  ... on FAQ { _id questions { question answer } }
}
```

A reference to one model needs no inline fragment. A reference set to a
single item returns an object instead of a list. A component field returns
its fields directly.

Links to other items: select `_slug` on each model the link can point to
(`... on Page { _slug } ... on Post { _slug }`).

## Dynamic content

A dynamic content field returns a list of elements; each has a
`__typename`:

```graphql
content {
  __typename
  ... on Text { body format }
  ... on Assets { items { url(width: 1200) width height caption } }
  ... on YouTubePost { url }
}
```

Plus one `... on` per component editors can embed.

## Assets

- `url(width: 800)` resizes, `url(preset: "desktop")` uses a preset, and
  aliases fetch several sizes: `mobile: url(width: 600)`.
- Always select `width` and `height` too, to reserve space and avoid layout
  shift.
- Images are served as WebP or AVIF automatically.
- Videos return an HLS `url`; `url(res: "high")` returns an MP4.

Image hostnames for the framework's image config are on the token's page in
Prepr.

## Locales

Pass `locale: "nl-NL"` on a query (it applies to linked items too), or send
the `Prepr-Locale` header for the whole request. `_localizations` returns
the item in its other locales, for a language switcher and hreflang tags.

## Keep queries small

Prepr limits query size. Use fragments rather than repeating fields,
select only what the page renders, and split very large pages into several
queries.
