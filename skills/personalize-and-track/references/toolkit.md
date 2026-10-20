# The Prepr toolkit

`@preprio/toolkit` connects a front end to Prepr's preview, visual editing,
personalization and tracking. It replaces `@preprio/prepr-nextjs`. This
page describes the stable 0.4 line; the package README is the reference for
exact signatures and options, so read it for the version the project
installs:
https://github.com/preprio/prepr-toolkit/blob/main/packages/toolkit/README.md

Everything it does can also be done by hand. Use it when the framework has
an entry point and the project doesn't already solve the same problem.

## Three rules

1. **It reads no environment variables.** Every value is an argument.
2. **`preview` is one boolean you pass to the middleware.** Derive it from
   whatever already tells your environments apart (an env var for the
   preview deploy, the host's environment name, the dev server). Never pass
   a hard-coded true: that turns preview on in production.
3. **Gate the toolbar yourself.** Render it only where `preview` is true.

## Entry points

| Framework | Server | Headers for your fetch | Pixel |
|---|---|---|---|
| Next.js | `createPreprMiddleware(request, { preview })` in middleware | `await getPreprHeaders()` | `PreprTrackingPixel` |
| Astro | `onPreprRequest(context, next, { preview })` in middleware | `getPreprHeaders(Astro.request.headers)` | `PreprTrackingPixel` component |
| SvelteKit | `export const handle = preprHandle({ preview })` in `hooks.server` | `getPreprHeadersFromLocals(event.locals)` | `PreprTrackingPixel` component |
| Nuxt | `handlePreprRequest(event, { preview })` in server middleware | `getPreprHeadersFromEvent(event)` | `PreprTrackingPixel` component |
| React (no framework) | none | none | `PreprTrackingPixel`, `PreprPreview` |
| Anything else | `processPreprRequest(request, { preview })` with a WHATWG `Request` | `getPreprHeadersFromHeaders(requestHeaders)` | `loadTrackingPixel(id)` |

The middleware sets the `__prepr_uid` visitor cookie, adds the visitor and
UTM headers, and turns the preview bar's segment and A/B choices into
headers. Spread the headers into the GraphQL request of every personalized
page, and don't cache that request.

Other helpers, server-side: `getPreprUUID` (the visitor id, or `null` when
the middleware didn't run for the route), `getActiveSegment`,
`getActiveVariant`, and `getToolbarProps` for the toolbar.

## Pieces

- **Toolbar:** `PreprToolbar` (Next.js), `PreprPreview` (React), or
  `createPreprPreview()` anywhere. Preview only. It shows segment and A/B
  switches and enables click-to-edit when the Preview token has edit mode
  on. It removes stega from the page itself.
- **Tracking pixel:** `PreprTrackingPixel` or `loadTrackingPixel(id)`. All
  environments. Its `id` is a token; the README advises a tracking-only
  one in client code. `extractAccessToken(url)` gets the token from a
  GraphQL URL.
- **Events:** `trackEvent(name, data?)` and `setTrackingParam(key, value)`.
- **Stega:** `stegaClean(value)` for values your code compares or parses.
- **Feature flags:** `features: { segments, abTesting, editMode }` turns
  parts off. Pass the same object to the middleware and the toolbar.

## Troubleshooting

- `getPreprUUID()` returns `null`: the middleware didn't run for that route.
  Check its matcher.
- The toolbar shows but segments don't change the content: the
  personalized request isn't sending the headers, or a cache is serving it.
- Click-to-edit misses an element: the encoded text sits in a hidden or
  zero-size element; add `data-prepr-edit-target` to a visible ancestor.

Newer toolkit releases add APIs beyond what this page describes. Use them
only once they are in a stable release the project installs.
