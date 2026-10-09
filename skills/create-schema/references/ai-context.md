# Writing AI context in Prepr

Prepr stores context that every AI client reads: Prepr's own AI features,
the MCP server, and any agent working in the environment later. Good context
here does more than any instruction in a skill, because it travels with the
content model.

There are three places: a description on each model, one on each field, and
one for the whole environment.

## Models

Set `ai_goal` on every model (the schema tools name it; check the tool's
input schema). Say what an item of this model is, where it appears, and who
it is for. Two or three sentences.

- Weak: "Blog article."
- Strong: "A long-form article for the blog at /blog/{slug}, written by the
  marketing team for prospective lease customers. Each article answers one
  question about leasing a car and links to related products."

## Fields

Set `ai_purpose` on every field that holds text an editor or an AI writes.
Say what the value is for, where it is shown, and its limits: length, tone,
format, what to avoid. One or two sentences. Skip pure layout fields and
fields whose name already says everything (a Boolean `is_featured` rarely
needs more).

- Weak: "Summary of the article."
- Strong: "Teaser shown on listing cards and in search results. Plain text,
  at most 160 characters, and doesn't repeat the title."

- Weak: "SEO title."
- Strong: "Title tag for search engines. At most 60 characters, the main
  keyword first, and the brand name at the end after a vertical bar."

Write limits that validation can't enforce (tone, audience, what to leave
out) here; put limits it can enforce (max length, regex, required) in the
field's validation settings as well.

## Environment AI context

Each environment has one AI context text in Prepr under
Settings → General → AI context. Prepr's AI features use it, and the MCP
server reads it to interpret requests. It describes the brand, audience and
purpose of the whole environment. Users set it in the Prepr UI; there is no
tool to write it, so draft the text for the user to paste.

If `get_initial_context` returns the environment's AI context, use it as
background and say whether it looks empty or outdated. If it doesn't, ask the
user whether one is set.

Draft it in this shape, filled from what you know about the project:

```text
Organisation: <who publishes this site and what they offer>
Audience: <who reads it and what they come to do>
Purpose of this environment: <which site or channel, and its main goals>
Tone of voice: <three or four adjectives, plus words or styles to avoid>
Languages: <locales and which one is the source>
Content types: <the main models and what each is for, one line each>
Rules: <facts AI must never invent, such as prices, legal text or claims>
```

Keep it under about 300 words. Ask the user to paste it into
Settings → General → AI context and review it before saving.
