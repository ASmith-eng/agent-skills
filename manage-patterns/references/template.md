# Catalog templates

The skeleton every catalog follows. `{braces}` are placeholders. Text in *italics* says what belongs in a section. It's guidance for you, not text for the catalog. See `example-patterns/` for a finished one.

## Directory

```
{docs-dir}/conventions/patterns/
  INDEX.md
  {area}.md      one per area, named after the area in kebab-case (web-app.md, api.md)
```

An **area** is where an agent is working: a layer, app or package, named with its technology. A single-layer project (a library, CLI or API service) has one area named after the project. If an area file grows past about 300 lines, offer to split it by package, sub-layer or feature group.

## INDEX.md

```markdown
---
schema: 1
reconciled_at: {short HEAD commit}
---
# Patterns

The team's decided patterns. This catalog isn't exhaustive: it covers scenarios where the codebase gives mixed or misleading signals, and patterns decided before anything uses them. If a scenario isn't listed, follow the placement table and the neighbouring code. Ask only if there's no clear precedent. Any rule here can be broken where following it would be awkward or inefficient: ask the user first.

## Architecture
**Paradigm:** {how code is structured, one line}

**Patterns:**
- {Structural model, stated as a hybrid or custom model where that's the intent}: {how code is grouped, e.g. by feature first, then by layer}
- {Named pattern}: {one line}. See [{Pattern note}]({area}.md#{anchor}).

**Stance:** {how closely new code follows the framework and these patterns}

| Kind of code | Location | Example |
|---|---|---|
| {kind} | `{path pattern}` {condition, if any} | `{real file}` |

**Don't introduce:**
- **New layers or folder conventions:** if new code doesn't fit a placement row, ask.
- **{Pattern}:** {why not, one clause}. {What to do instead.}

## Capability map
### [{Area} ({stack})]({area}.md) · `{glob}`, …
- [{Capability}]({area}.md#{capability}): {what it covers, one line}

## Don't copy (area-wide)
- `{path or glob}`: {what it is and why not, one clause}. {What to use instead.}

## Style (cross-cutting)
- **{Topic}:** {the rule}. `{example}`

## Tooling
{Tool} (`{config path}`), … are the authority for formatting and type rules.

## Open decisions
- [{Capability}]({area}.md#{capability}): {the open question}. Not yet defined — ask before inventing.
```

- **Intro line:** copy it exactly. Agents rely on it to know what an unlisted scenario means, and that a rule may be broken after asking.
- **Architecture:** how new code is built, not a description of every era of the codebase. Competing older structures and maintenance-mode code go under Don't copy. Always fill in the Paradigm, Patterns and Stance lines and Don't introduce, even when the code is consistent: agents bring their own approach from other codebases.
  - **Paradigm:** one line on how code is structured (plain functions and modules, classes and services, functional core with imperative shell…). State the decision, not the evidence or counts.
  - **Patterns:** the well-known patterns new code follows, in well-known terms, with the structural model first. Two to five items. Don't tag them: a pattern with no link is the standard version, and a house variant links to the capability note that explains how it differs.
  - **Stance:** one line, such as "Mostly framework conventions; house variants are linked above" or "Own style on purpose: don't assume framework defaults". When areas differ, split it by area in the same line ("Web app: React conventions. Server: own style on purpose.").
  - **Placement table:** one row per kind of code an agent would need to place, each with a real example path. Add a condition in the Location cell where it matters ("only when used by two or more features").
  - **Don't introduce:** the fixed first entry, then about three to eight well-known patterns an agent working in this stack might plausibly bring in, each with a reason and what to do instead. Leave out patterns nobody would reach for. An entry that applies to only one area starts with the area's name in brackets: `**(Web app) Global store alongside query hooks:**`.
  - **No exceptions:** existing code that breaks the paradigm or a pattern isn't mentioned anywhere in the catalog. State the rule only; the intro line covers the situations where breaking it is the better choice. Legacy exceptions go under Don't copy like any other legacy.
- **Capability map:** every area, linked to its file, with its stack and the path globs that cover its code. Say what's excluded when globs overlap ("`src/**`, except `src/web/**`"). Under each area, every capability in its file, in the file's order, with an anchor (`#reading-and-changing-data` for `## Reading and changing data`: lowercase, spaces as hyphens, other punctuation dropped). The paths appear only here.
- **Don't copy (area-wide):** only legacy that spans an area or more, such as an abandoned folder structure or a `legacy/` tree. Legacy approaches to one problem go in that capability. An entry that would forbid something a row prescribes names the exception, as for capability Don't copy below. If there's none, leave the section out.
- **Style (cross-cutting):** only rules that apply in every area, aren't naming, and no tool enforces, where the code shows, or an agent might use, two ways of doing the same thing. If the project has a glossary or naming doc, add one line linking to it. If not, don't create naming rules. State a rule's scope where it's ambiguous, as for capability Style below. Leave the section out if there's nothing.
- **Tooling:** one or two lines listing the config files. Don't summarise their rules.
- **Open decisions:** one line each, linking to its capability. If there are none, write `None.`

## Area file

```markdown
# {Area} ({stack})

## {Capability}
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| {scenario} | {pattern name}, with `{house function}` (`{module it's exported from}`) | `{exemplar path}` | {rival}, {rival} | {use when, or a link to its note} |
| {scenario} | {house technique the code always uses} | `{exemplar path}` | | |
| {scenario} | {pattern name} (Planned) | None yet | {rival} | [{Pattern}](#{pattern}) |
| {scenario} | Not yet defined — ask before inventing. | | | |

### {Pattern}
{How the house version differs from the textbook, in names and call shapes, or a "use when" rule too long for the cell. One to three lines.}

**Accepted variant:** {what the variant is and when it applies}. Accepted {YYYY-MM} as the trade-off for {situation}.

### {Planned pattern}
**Planned:** nothing uses this yet. {When it applies and the sketch: what to do, and what never to do.} Reference: {URL or doc}. The first implementation becomes the exemplar.

**Don't copy:** {approach} (`{path}` and similar): {why not, one clause}. Use {replacement}.

**Style:** {a convention that applies only to this capability}.

## Testing
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| {kind of test} | {pattern}, with `{house fixture or helper}` (`{module it's exported from}`) | `{test file}` | {rival} | {use when, if needed} |
```

- **A capability** is a problem an agent is solving, in the codebase's own terms. It exists only if it holds at least one scenario, Don't copy entry or style rule. Order capabilities by how often feature work touches them, with Testing last.
- **When a row exists:** only where there's a real choice:
  1. **Competing variants in the code:** two or more ways to do the same job.
  2. **A decided pattern with a likely alternative:** one way in the code, but an agent would plausibly use another.
  3. **A house variant:** the house version differs from the textbook pattern an agent already knows.
  4. **Planned:** decided, and nothing uses it yet.
  5. **A house technique the code always uses:** consistent, but not what the framework or textbook would do by default. It gets a brief row: the technique named, with an empty Not cell.

  Leave out framework and textbook defaults an agent would follow anyway. Leave out a one-off mechanism that's neither a choice nor a technique new code repeats.
- **Scenario rows** start with a verb ("Call an external API"). A row holds the goal, the pattern, one exemplar and the alternatives it replaces. The "Use when / notes" cell holds only a "use when" rule, a link to the pattern note, or nothing. It's required wherever two rows could be mistaken for each other.
- **The Pattern cell names what to use:** the technique in well-known or house terms, plus the house module or function an agent would import or call. Test every row: *could an agent write the import line and the call from this row alone?* If not, name the missing module, function or call shape. Don't describe it.
  - **Import-ready names:** a house helper carries the module it's exported from: `` `requireUser` (`src/http/auth.ts`) ``. A name with its module counts as one name.
  - **Call shapes** wherever an agent would guess wrong: argument order or shape (`sendResult(res, { body })`), an async helper that must be awaited, a return value that has to be unwrapped. They matter most for the few helpers nearly every feature calls. A long call shape can go in the pattern note.
  - **Allowed:** names of house modules, functions and paths, and call shapes.
  - **Not allowed:** what a module or function does inside, and what a feature must contain or the steps it takes.
  - **One or two names:** the thing an agent would import or call, and at most one path it goes in or is registered in. A cell joining three or more names with "with", "then" or commas is listing a feature's contents, even when every item is a name. The self-sufficiency test asks for the missing name of the pattern's own module, not for every place a feature touches.
  - **Pattern-defining parts stay:** a part whose absence makes it a different pattern in effect is named in the cell or its note, even under the names limit. Without deny-all, a collection is the open-collection pattern, so deny-all is named. Trimming a cell to names never drops one. Check's *Pattern not followed in full* relies on it being written down.

  | | Pattern cell |
  |---|---|
  | **Too much** | Queued command class in `src/queue/commands/` holding IDs, registered in `src/queue/schedule.ts`, dispatched with `JobBus.dispatch()`, tested with `runCommand()` |
  | **Right** | Queued command, dispatched with `JobBus.dispatch()` (`src/queue/jobBus.ts`) |
- **The Not column** names the alternatives the pattern replaces:
  - **Names only,** a few words each. The reason, and where the old approach lives, stay in its entry. The Not cell doesn't repeat them.
  - **Don't introduce items appear here too** where they're a common choice for that goal in the wider ecosystem, so an agent might pick them (a repository layer for "query the database", a second validation library for "validate input"). Name them only on the rows where they're a plausible pick, not on every row.
  - **Every item has a matching entry:** a Don't copy entry, in the capability or area-wide, or a Don't introduce entry.
  - **Not a neighbouring tool:** a house tool that's right for a nearby goal (an audit log against an operational log) isn't a rival and isn't legacy. Separate the two in each row's "use when" note instead.
  - **Empty** when nothing in the code or the ecosystem is a likely rival. Every table keeps the column, even when it's empty in every row, so the format never changes.
- **Exemplars** are real files: recent, small, idiomatic, with tests where possible, and outside legacy areas. A path with a line range (`file.ts:20–48`) is fine when the pattern is one function in a large file. Every row that has an implementation has one.
- **Pattern notes** (`###` under the capability) only for:
  - a "use when" rule that's too long for the cell
  - how a house variant differs from the textbook, in names and call shapes ("a queued command through `JobBus.dispatch()`, not the queue client")
  - an accepted variant
  - a Planned pattern's sketch

  Never a sequence of steps, a list of the parts a feature needs, an explanation of a house module, field lists or counts. Counts are evidence for Create's questions, never catalog content. Link to a note from the row's last column.
- **Planned patterns** say "Planned" in the Pattern cell and "None yet" in the Exemplar cell, and always have a note with the sketch or a reference.
- **Don't copy entries** each name the approach, where it lives, a reason, and the replacement. If there are several, make it a list under a `**Don't copy:**` line. When an entry would otherwise forbid something a row or style rule prescribes, it names the exception: "no calls to the RPC layer from server code, except the logging call the Logging rule names". The same goes for Don't introduce entries.
- **Style** in a capability applies only to that problem. A style rule exists only where the code shows, or an agent might use, two ways of doing the same thing. How to write a kind of test belongs in the area's Testing capability.
- **Style rules state their scope** where it's ambiguous: what applies when there's no acting user, or when a batch handles many entities.
- **Testing** is in every area that has tests: one row per kind of test, naming its house fixtures and helpers in the Pattern cell.

## Writing rules

- **State current decisions only.** No change log, discovery notes or "used to be…" lines. Dates appear only on accepted variants, as the month accepted. A Don't copy reason may say where the old approach still lives and how old it is, because that helps an agent judge what it finds.
- **Name plus exemplar.** Name things in well-known terms first. Don't explain well-known patterns. Explain only how the house version differs.
- **Patterns, not contents.** Say which pattern to use and what it replaces. Never the steps or parts of a feature: that's code review's job.
- **Names, not explanations.** Reference house modules and functions by name, with the module they're exported from, or by call shape. Never explain how they work: the code is the only description of a mechanism, so the catalog doesn't go stale when one changes inside.
- **No tool rules.** If a linter, formatter or type checker enforces it, leave it out.
- **No naming rules.** Those belong to a glossary.
- **No generic advice.** If a rule would apply to any codebase, it doesn't belong here.
- **Use the codebase's own words** for areas, capabilities and pattern names, and its paradigm (a CQRS codebase has "Commands" and "Queries"; a functional one may have "Effects").
- **Paths are repo-relative,** in backticks.

## Format versions

`schema` in `INDEX.md` is the catalog format version. Update compares it with the version here and proposes a migration when the catalog is older.

- **1:** the format described in this file.
