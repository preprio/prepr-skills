# Fetching from Prepr

Every request is a `POST` to `https://graphql.prepr.io/<ACCESS_TOKEN>` with
`Content-Type: application/json` and a body of `{ query, variables }`.
Only queries are supported. If you use `GET`, still send
`Content-Type: application/json`, or Prepr answers `415`.

Whatever the client, the fetcher:

- reads the URL from an env var. In the browser use only the Production
  token; requests with the Preview token, or with visitor headers such as
  `Prepr-Visitor-IP`, belong on the server;
- throws on a non-2xx status **and** on a body with `errors`;
- forwards the visitor headers when the page is personalized (see
  personalize-and-track), for example `getPreprHeaders()` from the toolkit;
- lets the caller decide caching (see [caching-preview.md](caching-preview.md)).

Keep it in one module the whole app uses.

## fetch (any JavaScript runtime)

```js
export async function prepr(query, variables = {}, headers = {}) {
  const res = await fetch(process.env.PREPR_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Prepr ${res.status}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
  return data;
}
```

Often this is all a site needs; a client library mainly adds caching and
typed documents.

## axios

```js
const { data: body } = await axios.post(
  process.env.PREPR_GRAPHQL_URL,
  { query, variables },
  { headers },
);
if (body.errors?.length) throw new Error(body.errors[0].message);
return body.data;
```

## graphql-request

```js
import { GraphQLClient } from 'graphql-request';
const client = new GraphQLClient(process.env.PREPR_GRAPHQL_URL);
const data = await client.request(document, variables, headers);
```

It throws on GraphQL errors itself and accepts typed documents.

## urql

```js
import { Client, fetchExchange } from '@urql/core';
const client = new Client({ url: process.env.PREPR_GRAPHQL_URL, exchanges: [fetchExchange] });
const { data, error } = await client.query(document, variables, { fetchOptions: { headers } }).toPromise();
if (error) throw error;
```

## Apollo Client

```js
const client = new ApolloClient({
  link: new HttpLink({ uri: process.env.PREPR_GRAPHQL_URL }),
  cache: new InMemoryCache(),
});
const { data } = await client.query({
  query: document,
  variables,
  context: { headers },
  fetchPolicy: 'no-cache',
});
```

On the server, create a client per request (or use the framework's Apollo
integration) so one visitor's cache never reaches another. For
personalized queries use `fetchPolicy: 'no-cache'`. A framework fetch
cache can still cache the request underneath, so turn that off too (in
Next.js, `fetchOptions: { cache: 'no-store' }`).

## Framework data loaders

Call the shared fetcher from the framework's server-side loader:

- Nuxt: a server route or `useAsyncData` on the server.
- SvelteKit: `+page.server.js`.
- Astro: the page frontmatter.
- Next.js: a Server Component or route handler.
- Angular: a server-side resolver.

Prepr's framework guides:
https://docs.prepr.io/connecting-a-front-end-framework

## PHP and Laravel

```php
$response = Http::withHeaders($headers)->post(env('PREPR_GRAPHQL_URL'), [
    'query' => $query,
    'variables' => $variables,
]);
$response->throw();
if ($response->json('errors')) { throw new RuntimeException($response->json('errors.0.message')); }
return $response->json('data');
```

Guzzle or any HTTP client works the same way. Prepr also documents PHP and
Laravel SDKs; check that one is maintained before adding it.
