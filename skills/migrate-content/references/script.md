# The migration script

Keep it small. Use plain JavaScript in Node 20 or later, with ES modules and
the built-in `fetch`, and add no framework. A migration script runs a few
times and is thrown away; a typed framework and generated abstractions cost
more than they save. A few small modules and a report to work from are
enough.

## Layout

```
migration/
  .env                    PREPR_TARGET_TOKEN, PREPR_SOURCE_TOKEN (gitignored)
  config/model-map.json   source type → target model, title and slug fields
  data/id-map.json        source id → target id, written by the script
  reports/                one JSON report per run
  src/prepr.js            Mutation API calls: retries, errors
  src/source.js           reads the source (its API or export files)
  src/id-map.js           load, look up, save
  src/report.js           collects results, writes the report
  src/mappers/<model>.js  one mapper per model
  src/mappers/sections/   one mapper per stack or dynamic-content section
  src/commands/create.js
  src/commands/fill.js
  cli.js
```

Keep API access, the id map, the report and the mappers in separate
modules. A mapper is a pure function from a source item to the target's
`items` for one locale: no API calls, so it is easy to test.

## Commands

| Command | Does |
|---|---|
| `create` | For each source item not yet in the id map: `POST` an empty item with only its title and slug, stage Review. Save the new id to the id map at once. |
| `fill` | For each item in the id map: read the source item, run its mapper, resolve references through the id map, `PUT` the full item in stage Review. |

Both take:

- `--dry-run`: read, map and report, but write nothing.
- `--model <name>`: one source type only.
- `--slug <slug>` and `--id <id>` (repeatable): only these items.
- `--limit <n>`: stop after n items.

Before processing anything, validate the config: every model in the map
exists in the target, and every target field a mapper writes exists on its
model.

## The id map

- Save it after every create, not at the end. A crash then loses nothing.
- `create` skips source ids that are already in it. A rerun resumes instead
  of creating duplicates.
- It belongs to one target environment. Keep one file per environment
  (`id-map.test.json`, `id-map.production.json`) and back it up. Losing it
  means items get created twice.
- Assets go in it too, under their own prefix (`asset:<source id>`).

## References

- Resolve every reference through the id map.
- A reference with no entry in the id map: leave it out and report it as
  `unresolved reference`. Do not send the source id.
- A reference the target field does not allow: leave it out and report it.
  Sending it fails the whole item.

## The report

Write one JSON file per run with, for each item: model, source id, target
id, outcome, and for failures a category and the message. Categories:
`missing mapping`, `invalid transformation`, `unresolved reference`,
`unsupported element`, `invalid source data`, `expected manual exception`.
Also report every value a mapper dropped or changed on purpose. Print totals
per model at the end.

## Errors

- One failing item does not stop the run. Record it in the report and go
  on, then exit with a non-zero code if anything failed.
- A failing request for the whole run (`401`, `access_token_not_bound_to_user`)
  stops it at once.

## The API client

```js
// src/prepr.js
const BASE = 'https://mutation.prepr.io';

export async function prepr(method, path, body, attempt = 1) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PREPR_TARGET_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if ((res.status === 429 || res.status >= 500) && attempt <= 5) {
    const wait = Number(res.headers.get('X-Prepr-Retry-After')) || 2 ** attempt;
    await new Promise((r) => setTimeout(r, wait * 1000));
    return prepr(method, path, body, attempt + 1);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errors || data.error) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}
```

A `429` waits for `X-Prepr-Retry-After`, a `5xx` backs off, and a `200`
with an error in the body still throws. The token is read from the
environment and never logged. Run requests one after another, or a few at
a time: the default limit is 35 requests per second.
