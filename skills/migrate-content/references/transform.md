# Transforming content from another system

Most of the work in a migration from another CMS is in the body text: its
format, the images and links inside it, and the URLs it used to live at.
Write one function per job below, and report every value it could not
convert.

## Rich text

Prepr takes rich text as HTML: a string in an HTML text field, or a list of
elements in a dynamic content field (see [payloads.md](payloads.md)). Most
other systems store something else:

| Source | Stored as | Convert with |
|---|---|---|
| WordPress (classic) | HTML with shortcodes | the HTML as is, after the shortcode step below |
| WordPress (Gutenberg) | HTML with block comments (`<!-- wp:... -->`) | the rendered HTML from the REST API, or per block |
| Contentful | a rich text JSON document | its official HTML renderer, or a walk over the nodes |
| Sanity | Portable Text | its official HTML renderer, or a walk over the blocks |
| Storyblok | a richtext JSON document | its official HTML renderer |
| Markdown files | Markdown | a Markdown-to-HTML library |

Then:

- Produce clean HTML: headings, paragraphs, lists, links, emphasis, tables.
  Drop inline styles, classes, empty tags and editor wrappers.
- For a dynamic content field, split the HTML at headings, images and
  embedded blocks into elements: `Text` (with `format` for a heading),
  `Asset`, and components for richer blocks such as a quote or a call to
  action. Agree with the user which source block becomes which element.
- **Shortcodes** (`[gallery]`, `[caption]`, plugin codes): map each kind to
  HTML or an element, or remove it and report it. Never leave one in the
  text.
- A block the target has no place for is reported as `unsupported element`,
  with the item and the block, so the user can fix it by hand.

## Images and files inside the text

`<img src>` tags and links to PDFs in the body still point at the old
system's media URLs, which go offline with it.

1. Collect every media URL from the body text while you transform.
2. Upload each one to Prepr once (`POST /assets` with `url`, `reference_id`
   set to the URL or the source asset id) and store its id in the id map.
3. In a dynamic content field, use an `Asset` element with the new id
   instead of the `<img>`. In an HTML field, replace the URL with the
   asset's URL in Prepr.

Files that need a login at the source can't be imported by URL; download
them first and upload them as files.

## Internal links

Links in the body to other pages on the old site (`<a href="/blog/old-post">`
or the full old domain) must point to the new URLs.

- Build a lookup from old URL to source id while you extract.
- In `fill`, rewrite each internal link through the id map to the target
  item's new slug or URL, the way the front end builds it.
- A link to an item that wasn't migrated is reported, not left pointing at
  the old site.

Because a link can point at any item, rewrite links in `fill`, after
`create` has made every item.

## Old URLs and redirects

Paths change: `/2021/05/my-post` might become `blog/my-post`, and Prepr makes
a duplicate slug unique without telling you.

- Agree the new slug rule per model with the user, and apply it in `create`.
- Compare the slug Prepr returns with the one you sent, and report changes.
- Write a **redirect map** for the front end: one line per migrated item,
  old URL → new URL. Include old URLs that already redirected in the source.
  Prepr does not create redirects; the front end or hosting serves them.

## Embeds

Video and social embeds (YouTube, Vimeo, X, Instagram, an `<iframe>` or an
oEmbed block) map to a Social field, `{"url": "<post url>"}`, or a matching
element in a dynamic content field. Take the original post URL from the
embed, not the iframe URL. Report embeds the target has no place for.
