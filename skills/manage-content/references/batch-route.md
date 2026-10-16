# Batch route: a script that calls the MCP server

Some jobs are too big to run one tool call at a time in chat: a whole schema
(dozens of entities and hundreds of fields), more than about 50 content
items, or a bulk asset import. For those, write a short script that calls
the same MCP tools over HTTPS. Below that size, use the tools in chat.

The script changes nothing about the rules. It still goes through the MCP
server, never Prepr's APIs directly, and every run still follows plan →
confirm → apply → verify ([write-safety.md](write-safety.md)). The script
does the apply step; the user's yes still comes first.

## Before you write it

- **The token.** The script reads `PREPR_MCP_TOKEN` from the environment.
  Never print, log or write the token, and never ask the user for its value.
  If it is not set, ask the user to set it (see connect-prepr) and stop.
- **The environment.** The token can reach a different environment than the
  MCP connection in chat. Make the script's first call `get_initial_context`,
  print the environment it names, and stop if it is not the one in the plan.
- **The tool schemas.** Read the live input schema of every tool the script
  calls and build arguments from it. Do not copy parameters between tools:
  pass `intent` only to tools whose schema lists it.

## The call

The server speaks JSON-RPC over HTTPS. One POST per tool call, no SDK
needed. It may answer as an event stream: the JSON is on a `data:` line.

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
Treat both as errors. Use the standard library only, and run the script with
`python3 -I`.

## How the script works

- **Two modes.** `plan` prints every change and writes nothing. `apply`
  writes. Show the plan output to the user, wait for an explicit yes, then
  run `apply`. If you change the script's spec, run `plan` again and ask
  again.
- **A state file.** After each successful create, save the new id under a
  stable key (`model:Page`, `field:Page.title`, `item:home`) to a JSON file
  and write it to disk at once. On a rerun, skip keys that are already
  there. A rerun after a fix then resumes instead of creating duplicates.
  The ids belong to one environment: start a new state file for another.
- **Stop at the first error.** Let the error end the run. Do not catch and
  continue, and do not retry with guessed parameters. Report what the state
  file says was applied, the server's message, and what was not attempted.
- **Dependency order.** Schema: enums, then models and components, then
  their fields, one call each. Content: referenced items before the items
  that point at them, and assets before the items that use them.
- **Phases for what comes from outside.** A remote-content field needs its
  remote source to exist, and these skills do not create one. Leave such
  fields out of the first phase and apply them in a later one, once the
  user gives the remote source's id (`apply-remote <id>`). Do the same for
  content that waits on uploads or on another team.
- **Content in a stage before Done** while required fields are still empty,
  then move it to Done in the last step. Bulk calls take at most 25 ids per
  call; split larger lists.
- **Verify.** After `apply`, read every entity back with `get_schema_entity`,
  or count the created items and read a sample, and compare with the plan.

Keep the script and its state file in the project (for example under
`prepr/`), so the user can rerun or adjust it later.
