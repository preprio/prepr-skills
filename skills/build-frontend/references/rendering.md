# Rendering Prepr content

## Stacks: a registry by `__typename`

Map each section type to a component in one place, and render the stack by
looking each item up:

```js
const sections = {
  Hero: HeroSection,
  FAQ: FaqSection,
};

for (const item of page.sections) {
  const Component = sections[item.__typename];
  if (!Component) {
    console.warn(`No component for ${item.__typename}`);
    continue; // render null, never throw
  }
  render(Component, { data: item, key: item._id });
}
```

- An unknown type logs a warning and renders nothing. Editors add new
  sections before the code catches up, and a page shouldn't crash for
  that.
- Use `_id` as the key.
- With generated types, type the registry over the union of section types,
  so a type without a component fails the build.
- The same works in every framework: a component map in Vue or Svelte
  (`<component :is>`, `<svelte:component this>`), a `match` in PHP or
  Blade, a dictionary in Astro.
- Pass the position (index) when it matters: one section on a page owns
  the `<h1>`, and the first sections load their images eagerly.

## Dynamic content and rich text

Render dynamic content the same way: a switch on `__typename` per element
(`Text`, `Assets`, social embeds, embedded components).

- `Text` elements hold HTML in `body` with a `format` (`H2`, `Paragraph`
  and so on). Render the HTML through the framework's raw HTML output and
  sanitize it if the project's policy asks for it.
- An HTML text field is a single string of rich text; render it the same
  way.
- Prepr returns internal links in rich text as URLs built from slugs.

## Routes, 404s and redirects

Look items up by slug, and send a real 404 when there is none:

```js
const data = await prepr(PAGE_QUERY, { slug });
if (!data.Page) return notFound(); // your framework's 404
```

Check the item (`data.Page`), not `data`: `data` exists even when no item
matched, so a check on `data` never fires. The 404 differs per framework:

| Framework | 404 |
|---|---|
| Next.js | `notFound()` |
| Nuxt | `throw createError({ statusCode: 404 })` |
| SvelteKit | `error(404)` |
| Astro | return a 404 response, or rewrite to the 404 page |
| Laravel | `abort(404)` |

- **One catch-all route** that resolves any slug works well when several
  models have their own URLs. Look the slug up with
  `ContentItems(where: { _slug_any: [$slug] }, limit: 1)` and render by
  `__typename`. **A route per model** (`/blog/[slug]`) is simpler when URL
  prefixes are fixed. Follow the project.
- **Redirects** are best kept as a Redirect model in Prepr (source path,
  a destination reference, a permanent flag), so editors manage them.
  Before returning a 404, look the path up in that model. If the framework
  supports build-time redirects, load them all at build time too, paging
  with `limit` and `skip` (a query without `limit` returns only 10).
- For static generation, collect all slugs per model, paging until `total`.

## Images

- Request the size you render with `url(width:)`, and render `width` and
  `height` so the layout doesn't shift.
- With an image optimizer (`next/image`, `@nuxt/image`, Astro `<Image>`),
  add Prepr's image host to its allowed domains and let it resize.
- Load the first, above-the-fold image eagerly and everything else lazily.

## Stega in preview

With edit mode on, the preview token appends invisible characters (stega)
to text fields for click-to-edit. They break anything that compares or
parses a string: URLs, slugs, dates, numbers, `if (label)` checks. Clean
those values before using them (the toolkit's `stegaClean`). The
production token carries no stega. See [caching-preview.md](caching-preview.md).

## Empty values

Editors leave fields empty. A component with an empty required field (an
empty button label, a missing image) should render nothing or a fallback,
not broken markup.
