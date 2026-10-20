# Batch route: large jobs through the MCP connection

Some jobs are too big to plan and confirm one call at a time: a whole schema
(dozens of entities and hundreds of fields), more than 25 content items
(one bulk call), or a bulk asset import. Run them with the connected MCP tools,
the same connection the user set up with connect-prepr, as one job with
one plan and one yes. No extra token or setup is needed.

The rules do not change. Every call goes through the MCP server, never
Prepr's APIs directly, and the job follows plan → confirm → apply → verify
([write-safety.md](write-safety.md)).

## Plan the whole job

- Read the live input schema of every tool the job calls and build arguments
  from it. Do not copy parameters between tools: pass `intent` only to tools
  whose schema lists it.
- Write one plan for the whole job: the environment, what you will create
  grouped by kind, the order, the phases, and how you will verify. For many
  similar items, show the first few in a table and give the totals.
- Ask for one yes for the whole plan. It covers the calls in that plan and
  nothing you add later. If the plan changes, show it again and ask again.

## Run it

- **Dependency order.** Schema: enums, then models and components, then
  their fields. Content: referenced items before the items that point at
  them, and assets before the items that use them.
- **Bulk calls.** Send at most 25 ids per bulk call; split larger lists.
- **A state file.** Keep a JSON file in the project, for example
  `prepr/batch-state.json`, with the environment at the top. After each
  successful create, save the new id under a stable key (`model:Page`,
  `field:Page.title`, `item:home`) and write the file at once. Before each
  create, skip keys that are already there. A new session, or a rerun after
  a fix, then resumes instead of creating duplicates. The ids belong to one
  environment: start a new state file for another.
- **Stop at the first error.** Do not go on with the next call, and do not
  retry with guessed parameters. Report what the state file says was
  applied, the server's message, and what was not attempted. Resume only
  after the user agrees to a fix.
- **Phases for what comes from outside.** Leave out parts that wait on
  something the job cannot do itself, such as uploads or another team's
  input. Apply them in a later phase; show that phase again and ask before
  you run it.
- **Content in a stage before Done** while required fields are still empty,
  then move it to Done in the last step.
- **Report progress** after each phase or every 25 items, so the user can
  stop the job.

## Verify

Read every entity back with `get_schema_entity`, or count the created items
and read a sample, and compare with the plan and the state file.

## Optional: a script with its own token

Most users connect with OAuth, and a script cannot use that connection.
Offer a script only when `PREPR_MCP_TOKEN` is already set in the user's
shell (the token route in connect-prepr) and the job is too long for chat.
Do not suggest getting a token for this. Without one, run the job in chat.

The script follows everything above, plus:

- **The token.** Read `PREPR_MCP_TOKEN` from the environment. Never print,
  log or write the token, and never ask the user for its value.
- **The environment.** The token can reach a different environment than the
  connection in chat. Make the script's first call `get_initial_context`,
  print the environment it names, and stop if it is not the one in the plan.
- **Two modes.** `plan` prints every change and writes nothing; `apply`
  writes. Show the plan output, wait for the yes, then run `apply`.

The server speaks JSON-RPC over HTTPS: one POST per tool call, no SDK
needed. It may answer as an event stream; the JSON is on a `data:` line.

```python
import json, os, urllib.request

def call(tool, args):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                       "params": {"name": tool, "arguments": args}}).encode()
    req = urllib.request.Request("https://mcp.prepr.io", body, {
        "Authorization": "Bearer " + os.environ["PREPR_MCP_TOKEN"],
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"})
    raw = urllib.request.urlopen(req, timeout=120).read().decode()
    line = next(l.removeprefix("data: ") for l in raw.splitlines()
                if l.removeprefix("data: ").startswith("{"))
    d = json.loads(line)
    if "error" in d:
        raise RuntimeError(f"{tool}: {d['error']}")
    r = d["result"]
    text = "\n".join(c.get("text", "") for c in r.get("content", []))
    if r.get("isError"):
        raise RuntimeError(f"{tool}: {text}")
    return r.get("structuredContent") or json.loads(text)
```

A tool failure comes back as `result.isError`, not as a JSON-RPC `error`.
Treat both as errors. Use the standard library only, run the script with
`python3 -I`, and keep it next to the state file so the user can rerun it.
