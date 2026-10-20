# Fragments and type safety

## Where queries live

Follow what the project already has. In a new setup, prefer `.graphql` files:
editors highlight and validate them against the schema, codegen reads them
directly, and they work the same in every language.

Queries in code are fine too, and common:

```ts
// with the codegen client preset: typed from the start
import { graphql } from '@/gql';

export const PostQuery = graphql(`
  query Post($slug: String!) {
    Post(slug: $slug) { _id title }
  }
`);
```

- A `gql` template literal (Apollo, graphql-tag) or a plain string works the
  same way; codegen picks it up when its `documents` include the source
  files (`'src/**/*.{ts,tsx}'`).
- In Vue or Svelte files, in PHP, or without a build step, a string
  constant or a heredoc is the usual form.

Don't mix both styles in one project without a reason.

## Fragments

Write one fragment per model or component, named after it, and spread it
wherever that type appears:

```graphql
fragment Hero on Hero {
  _id
  heading
  image { url(width: 1600) width height }
}

query Page($slug: String!) {
  Page(slug: $slug) {
    _id
    title
    sections {
      __typename
      ...Hero
      ...FAQ
    }
  }
}
```

- The component that renders a type owns its fragment, kept next to the
  component or in one fragments folder. Pick one place and keep to it.
- When two fragments select a field with the same name but a different
  type, alias one of them (`authorName: name`) or the generated types
  clash.
- Don't add a fragment for a model that doesn't exist in the environment
  yet; the query fails. Add it once the schema change is live.

## Generated types (TypeScript)

GraphQL Code Generator reads the schema by introspection and writes a type
for every query and fragment. Prepr's Next.js guide uses the client preset:

```bash
npm install -D @graphql-codegen/cli @graphql-codegen/client-preset
```

```ts
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: process.env.PREPR_GRAPHQL_URL,
  documents: ['src/**/*.graphql'], // or 'src/**/*.{ts,tsx}' for queries in code
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
    },
  },
};
export default config;
```

- Codegen may not load `.env` files on its own; load them at the top of
  the config, or run it through the framework's env loader.
- Run it before every build and after every schema change. Prepr's
  `schema.changed` webhook can trigger it in CI.
- `fragmentMasking: false` gives components plain fragment types. Keep
  masking on if the project prefers its stricter data boundaries.
- `typed-document-node` with the `typescript` and `typescript-operations`
  plugins is a common alternative, and fits clients like graphql-request,
  urql and Apollo.

Type a component with its fragment type, and a stack renderer with the
union of section types taken from the generated query type, so a section
type without a component is a type error.

**Strict mode** on the access token makes required fields non-null in the
schema, so the types don't mark every field optional. It suits schemas
whose required fields are enforced at the stage content is published.

## Without TypeScript

- Prefer `.graphql` files and point the editor's GraphQL extension at the
  schema (a `graphql.config` file with an introspection result) for
  autocomplete and validation.
- Validate queries in CI against the schema with codegen or
  `graphql-inspector`.
- In PHP, map responses to small DTO classes per model where the project
  uses them.

Read the GraphQL URL from the environment in these configs too, rather than
hard-coding it, so each environment can use its own token.
