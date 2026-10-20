# Caching, revalidation and preview

## Prepr's CDN

Prepr serves GraphQL through a CDN, invalidated when content or schema
changes. The `X-Prepr-Cache` response header shows `HIT` or `MISS`. Right
after a publish, a request can still return the old version for a moment.

## Pages that are personalized or A/B tested

A cached page shows one visitor's variant to every visitor, and an A/B test
on it never splits. So for every page that has variants, or that the team
plans to personalize or A/B test later:

- Render the whole page per request. No static generation, no ISR, no
  framework page or data cache for its personalized requests.
- Make sure nothing in front caches it either: the host's CDN, a reverse
  proxy or a service worker. Send `Cache-Control: private, no-store` on
  those pages.
- Decide this before you build. A page built as static now won't show the
  variants editors add later; switching it to per-request rendering then
  is a change to the code and the hosting.
- Pages without variants can stay cached. Keep the list of personalized
  pages explicit (by route or model), and agree it with the user.

See personalize-and-track for the visitor headers and the fallback.

How the rest of the site is cached is the project's decision. Follow what
the project does, or ask.

## Revalidate on publish

1. In Prepr, add a webhook for
   `content_item.published`, `content_item.unpublished` and
   `content_item.changed`, pointing at a route in the app.
2. The route checks the request is from Prepr, then invalidates:
   - Verify the `Prepr-Signature` header as the webhook docs describe, or
     send a shared secret in a custom webhook header and compare it in
     constant time. Fail closed when the secret is missing.
   - Invalidate by tag, by path, or everything, as the project caches.
     Whatever you invalidate must include the pages that list or reference
     the item, such as navigation or a section reused on many pages.
3. Answer `2xx` within 12 seconds. Prepr retries failed deliveries, so
   handling the same event twice must be harmless.

The payload has the item `id`, `model.body_singular` and the `slug` per
locale. Docs: https://docs.prepr.io/development/best-practices/webhooks

For a fully static site without revalidation, rebuild on the same
webhook instead.

## Preview

- Run preview on its own deploy or route, with the **Preview token**, and
  never cache its responses.
- In Prepr, set a preview URL per model with `{slug}` or `{id}`, so editors
  open the page from the item.
- Protect the preview deploy, but let Prepr in: editors open it from Prepr,
  and visual editing loads it in an iframe inside Prepr.

Docs: https://docs.prepr.io/project-setup/setting-up-previews-and-visual-editing

### Preview patterns

Which one fits depends on where the preview runs. Ask the user how their
staging or preview environment is hosted and protected.

**Vercel Deployment Protection.** Preview deployments sit behind Vercel's
login. Give Prepr a bypass with a Protection Bypass secret from Vercel, in
the model's preview URL:

```
https://<preview-host>/{slug}?x-vercel-protection-bypass=<secret>&x-vercel-set-bypass-cookie=samesitenone
```

The bypass alone only lets the first request through; CSS and JavaScript
then fail and the page looks broken. `x-vercel-set-bypass-cookie=samesitenone`
sets a cookie that covers every request, also inside Prepr's iframe.

**Your own authentication** on a staging environment hosted elsewhere (a
password page, basic auth, SSO, an IP allowlist):

- Let Prepr reach it: an IP allowlist that includes the editors' network,
  or a secret in the preview URL that sets a session cookie, the same way
  Vercel's bypass does.
- A cookie that must work inside Prepr's iframe needs
  `SameSite=None; Secure`, or the browser won't send it there. Browsers
  that block third-party cookies can still refuse it, so test in the
  browsers editors use.
- Leave the webhook route and the draft route reachable without the login,
  and protect them with their own secret.
- Allow the frame: `frame-ancestors 'self' https://*.prepr.io` (see below).

**Next.js draft mode with a secret.** Draft mode makes Next.js skip its
caches and render per request, so editors see the latest content. A route
turns it on:

1. A route such as `/api/draft` reads `secret` and `redirect` from the query
   string.
2. With no secret configured in that environment, it answers `404`, so
   draft mode can't be turned on in production.
3. It compares the secret with the env var, and checks that `redirect` is a
   relative path on the site (starting with a single `/`) so it can't send
   editors elsewhere.
4. It enables draft mode and redirects. Draft mode stays on for the
   rest of the browser session.

The model's preview URL in Prepr then becomes:

```
https://<preview-host>/api/draft?secret=<draft-secret>&redirect=/{slug}
```

The draft secret is a random value made for this, not the preview token.
Other frameworks do the same with a route that sets a preview cookie and a
loader that reads it. Docs:
https://docs.prepr.io/connecting-a-front-end-framework/nextjs/caching-strategies

## Visual editing

1. On the Preview token, tick **Enable edit mode**. Responses then carry
   stega in text fields.
2. Install the toolbar from the Prepr toolkit, preview only; see
   [toolkit.md](toolkit.md). It cleans the stega from the page and adds
   click-to-edit.
3. Let Prepr frame the site: send
   `Content-Security-Policy: frame-ancestors 'self' https://*.prepr.io` on
   preview, and no `X-Frame-Options: DENY`.
4. Clean stega from values the code compares or parses (URLs, slugs,
   dates, numbers) on the server; see [rendering.md](rendering.md#stega-in-preview).
5. Where the encoded text sits in an element that is hidden or has no
   size, put `data-prepr-edit-target` on a visible ancestor.
