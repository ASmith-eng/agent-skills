# Glossary templates

The skeleton every glossary follows. `{braces}` are placeholders. Text in *italics* says what belongs in a section. It's guidance for you, not text for the glossary. See `example-glossary/` for a finished one.

## Directory

```
{docs-dir}/conventions/glossary/
  INDEX.md
  {group}.md      one per group, named after the group in kebab-case (bookings.md, service-delivery.md)
```

A **group** is a family: one feature, workflow or set of entities that are built and changed together, such as everything from booking to payment. It isn't one file per entity. Each entity in the family gets a section in the group file.

## INDEX.md

```markdown
---
schema: 1
reconciled_at: {short HEAD commit}
---
# Glossary

{One sentence: what this glossary covers.} Check reads this file after each feature. Read it yourself only to settle a Check finding or a term you're unsure about.

## Watch list
- **{term}** {what it means here, and what to use instead in the case that goes wrong}. {One line each.}

## Term index
| Term | Belongs to |
|---|---|
| {term} | [{Group}]({group}.md#{entity}) |
| {business name} | [{Group}]({group}.md#{entity}) (business name) |
| {reserved term} | [{Group}]({group}.md#{entity}), not {the meaning it's mistaken for} |

## Naming rules
- **{Topic}:** {the rule}. `{example}`

## Open decisions
- {Competing terms or the open question}. Ask before using either.
```

- **Watch list:** three to seven entries, chosen from confirmed collisions and the conflicts with the most impact. Each says what the word means here and what to use instead, so an agent can act on it without opening a group file. If nothing has earned a place yet, write `Not yet defined — ask before inventing.`
- **Term index:** every term from every group, in alphabetical order and lowercase, one row each. That includes code names, business names, reserved terms, and other nouns specific to the concept (`visit`, `line item`). Leave out generic words such as verbs (`cancel`) or `status`: Check treats each indexed term as that group's word, and flags new names that use it for review. A generic word would flag names with nothing to do with the group. Each row links the group that owns it, with the link text exactly the group name, and an anchor to the entity's section (`#customerprotocol` for `## CustomerProtocol`: lowercase, spaces as hyphens, other punctuation dropped). Annotate a row only when the bare link would mislead: `(business name)` for a word that isn't used in code, and `not {x}` for a collision.
- **Naming rules:** only rules the team has chosen that go beyond the usual defaults. Each has one inline example. Topics include reading vs fetching, booleans, collections, events, handlers, and IDs. Leave out a topic the team hasn't decided, and leave the section empty with the marker if there are none.
- **Open decisions:** one line each, naming the competing terms. If there are none, write `None.`

## Group file

```markdown
---
schema: 1
group: {Group}
paths: [{glob}, …]
code: [{Model}, {table}, {foreignKey}, {mainCollection}, …]
avoid:
  - term: {lost variant}
    reason: "{why, one short clause}"
  - term: {reserved term}
    reserved_by: {Other group}
    allow: [{identifier}, …]
---
# {Group}

{Two or three lines: what this family is, and how its entities relate or flow, e.g. "A booking is an Order; paying it creates Fulfilments."}

## {Entity}

{One-line definition, in business terms.}

- **Business name:** "{name}" {where it appears}
- **Relationships:** {belongs to / has many, using code names}
- **Vocabulary:** {states, actions and fields specific to this entity}

## {Entity}

…
```

- **What belongs in one group:** entities that share paths, are changed in the same features, or flow into each other. A concept used everywhere (the user, the organisation) can be a small group of its own, and later runs can add to it.
- **When to split:** when a file passes about 150 lines, or parts of the family are owned or changed separately. Splitting means moving sections to a new group file and updating the term index links.
- `paths` covers the whole family. Leave it out for families that span the codebase, and leave out `avoid` when there's nothing to avoid.
- `code` lists the identifiers someone would search for, for every entity in the family: the model or type, the table, the foreign key, and the main collection and variable names. It isn't every identifier that mentions the concept.
- Reserved terms work between groups. Collisions inside one family, where two of its entities share a word, are handled by the watch list and the entity sections; Check's mentions point to the group, and the agent uses the sections to tell the entities apart.
- Leave out any body line that doesn't apply. "Business name" appears only when it differs from the code name.
- Add more prose (a short paragraph, a rule specific to an entity) only when an agent would otherwise get something wrong.
- If a definition isn't known, write `Not yet defined — ask before inventing.` instead.

## Writing rules

- **State current decisions only.** No change log, dates, "renamed from…" notes or discovery notes. The exception is an Avoid `reason`, which may say where the old name still lives ("legacy name, only in `legacy/`"), because that helps an agent judge what it finds.
- **Code identifiers and Avoid entries live only in the frontmatter.** Don't repeat them as lists in the body, or the two will drift apart. The body may mention an identifier in a sentence.
- **Write frontmatter in the YAML subset** (`schema.md`), and always quote `reason`.
- **Use the code's spelling** for code names, and the UI's spelling for business names, even when they differ (`Fulfilment` vs "Job").
- **No generic advice.** If a rule would apply to any codebase, it doesn't belong here.
- **Every term in a group appears in the term index**, and every group file is linked from it at least once. The integrity check checks the second part, and that each link's text matches the group name.
