# Tracking

Docs: https://docs.prepr.io/data-collection/setting-up-the-tracking-code
and https://docs.prepr.io/data-collection/recording-events

## The pixel

- Copy the tracking code from Prepr: **Settings → Event management → Get
  tracking code**. It loads Prepr's script and calls
  `prepr('init', '<token>')` and `prepr('event', 'pageload')`.
- Put it in the page's `<head>`, on every page and in every environment,
  after consent where the site requires it.
- Or use the toolkit: `PreprTrackingPixel` for React, Next.js, Astro,
  SvelteKit and Nuxt, or `loadTrackingPixel()` anywhere else (see
  [toolkit.md](toolkit.md)).
- The token is public once it is in the page. The toolkit README advises a
  tracking-only token in client code.
- In a single-page app, send a page view on each route change.
- To check it, filter the browser's Network tab for `pixel.gif`: each
  event is one request.
- `destinations: { googleTagManager: true }` in the pixel config also
  pushes Prepr's events to the GTM data layer.

## Bind the page to its content item

```html
<meta property="prepr:id" content="<item _id>" />
```

- `prepr:id` records a View of that item, which segments can use.
- `prepr:locale` sets the page's locale.
- `prepr:customer-id` links a known visitor's id from your identity
  provider. Never put an email address there.

## Impressions and conversions

Put both on every personalized or A/B section:

```html
<section data-prepr-variant-key="{_context.variant_key}">
  ...
  <a href="/demo" data-prepr-variant-event>Book a demo</a>
</section>
```

- `data-prepr-variant-key` on the element that shows the variant records
  an impression when it scrolls into view. Take the value from the item's
  `_context { variant_key }`. Add it only when a key exists, and only on
  the variant actually shown.
- `data-prepr-variant-event` on a link or button records a conversion
  click. Give it a name for other conversions:
  `data-prepr-variant-event="QuoteRequest"`.
- `data-prepr-item-id="<item _id>"` tracks an A/B test on a text field
  (on `h1`–`h6`, `span`, `li` or `div`).

Without impressions an A/B test has no denominator; without conversions it
has no result. Tag both.

## Events

- Built-in events: `View`, `Like`, `Bookmark`, `Subscribe`, `SignUp`, and
  their undo events (`Unlike`, `Unbookmark`, `Unsubscribe`).
  `SignUp` keeps the visitor past the 90-day retention.
- Custom events: `prepr('event', 'DemoRequested')`, or `trackEvent('...')`
  from the toolkit. Use PascalCase, start with a letter, and don't reuse a
  built-in name. Check the naming rules in the docs above.
- Duplicate events within a few seconds are dropped.
- Keep one module that maps the site's conversions to events, and sends
  them to Prepr and any other analytics the site uses, so names stay
  consistent.

## Server-side events

For events that happen on the server (an order, a sign-up confirmed by
email), post them to `https://tracking.prepr.io/events` with the visitor's
id, using a token with the tracking scope. Send `Prepr-Visitor-IP` with the
visitor's IP. Docs:
https://docs.prepr.io/data-collection/tracking-data-using-the-api

## Consent and privacy

Prepr's visitor cookie is `__prepr_uid`. The docs don't prescribe a consent
flow: follow the site's consent tool and policy, and load the pixel and
set the cookie only once the visitor's consent allows it. Known bots are
excluded automatically, and IP addresses can be excluded in Event
management.
