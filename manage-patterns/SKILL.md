---
name: manage-patterns
description: Create, check and update a project's patterns catalog (documentation/conventions/patterns/). It records the team's decided architecture and where each kind of code goes, which pattern to use for each problem scenario with one exemplar file, house variants that differ from the textbook, patterns decided but not built yet, house style tools don't enforce, and legacy code not to copy. The goal is that agents stop reinventing utilities, adding a second way of doing something, copying legacy code or putting code in the wrong layer. Use it to document codebase conventions, coding patterns, architecture or "how we do things here" for agents. Use it to review finished code against the catalog ("check my changes follow our patterns", "is this the right pattern here", "review this against our conventions", before a PR or after a feature). Use it to bring the catalog up to date after code changes or a release, record a newly decided pattern, or settle open decisions. It only writes the catalog; it never refactors or edits code. Naming and domain vocabulary belong to a glossary, not here.
---

# manage-patterns

Write and maintain a project's patterns catalog: the architecture new code follows, the pattern for each problem scenario with an exemplar to copy, the house style tools don't enforce, and what not to copy. Then check new code against it.

Paths to this skill's own files (`references/…`) are relative to this skill's directory. Paths in the catalog and in reports are relative to the project's repo root.

## Why this exists

Agents copy neighbouring code well. They go wrong where the codebase gives the wrong signal:

- two competing ways of doing the same job, often with the legacy one more common
- a house variant that differs from the textbook pattern the agent already knows
- code that's easy to put in the wrong layer
- a documented pattern used in a situation it wasn't meant for
- nothing to copy at all, because the team has decided how something should be done but nothing does it yet
- a well-known pattern from other codebases (classes and factories, a repository layer, a backend for frontend) that this one has never used, so nothing in the code warns against it

Each wrong choice looks reasonable on its own, so review rarely catches it. The catalog spends its words on those cases. Framework and textbook defaults get no row, because an agent follows them without being told. The overall approach is always named, because agents bring their own from training data.

## Principles

These hold in every mode.

1. **Choose a canonical way.** For each scenario, the catalog records the one approach new code should use, chosen by the user from the evidence. The others go under Don't copy, with a reason. The point is to make the code converge. The catalog settles which pattern to use where the code shows, or an agent might bring in, more than one way to reach the same goal. It doesn't describe what a complete feature contains or the steps it takes.
2. **A record of decisions, not a census.** The catalog holds what the team has decided, whether or not the code does it yet. Spend effort where an agent could plausibly get it wrong: conflicts, house variants, placement, and situations that are easy to confuse. A pattern the team has decided but nothing uses yet is recorded as **Planned**, so the first implementation follows the decision. The codebase's **approach** is always recorded, even when it's consistent: its paradigm, its named patterns, its stance, and the common patterns it doesn't introduce. "Consistent and obvious" applies to scenarios, not to the approach.
3. **Not exhaustive, on purpose.** Each state means something different:
   - **Listed with a pattern:** follow it.
   - **Listed as `Not yet defined — ask before inventing.`:** a known open decision. Ask.
   - **Not listed:** follow the placement table and the neighbouring code. Ask only if there's no clear precedent.
4. **Organised the way agents look things up:** by area (the technology or layer being worked in), then by capability (the problem being solved). Areas and capabilities come from the project, its stack and its own words, never from a fixed list.
5. **Discover first, ask second.** The codebase is the first source. The user confirms, chooses or corrects, and never has to describe a pattern from scratch. The exception is Planned patterns, which only the team can supply. Ask for them once, and draft each entry from the answer.
6. **Name plus exemplar, not explanation.** Name things in well-known terms first. If the house version matches the well-known pattern, a name and one real example file are enough. Explain only where the house version differs from the textbook, in a line or two. Each row names the pattern, the house modules or functions that implement it, and the alternatives it replaces, so an agent could follow it without opening the exemplar. The exemplar shows the pattern in use. A Planned pattern gets a short sketch or an external reference instead of an exemplar.
   - **Names, not explanations.** The catalog references house modules and functions by name, and by call shape wherever an agent would guess wrong (argument shape, an await, a return value to unwrap). It never explains how they work. The code is the only description of a mechanism, so nothing in the catalog goes stale when a helper changes inside.
   - **Import-ready names:** each house helper carries the module it's exported from, so an agent can write the import line without searching.
   - **The self-sufficiency test:** could an agent write the import line and the call from this row alone? If not, name the missing module, function or call shape. Don't describe it.
7. **Don't restate tools.** Anything a linter, formatter or type checker enforces stays out. The catalog points to those configs.
8. **Judgement, anchored to the catalog.** Check starts from the catalog, and every finding points to a catalog entry. Read the codebase only to judge a specific finding, never to work out the conventions again. Give your opinion with your reasoning: a new pattern may be the right trade-off, and code can match the catalog while not suiting the situation. The user decides.
9. **Docs only.** This skill never refactors code. Check reports findings. When Check runs at the end of feature work, the report goes back to that task, and the task fixes its own code.
10. **Decisions belong to the team.** One person runs the skill, but the catalog goes through the team's normal review, such as a PR. Undecided items go under Open decisions for the team to discuss, instead of being settled by you.
11. **Stand alone.** Don't rely on any other skill. Overlap with other docs (feature docs, ADRs, a glossary) is fine. When existing docs disagree with the code or with each other, show the user the conflict. Don't quietly pick one.

## Modes

First find the catalog: `documentation/conventions/patterns/INDEX.md`, or the same path under the project's docs directory (`docs/`, `doc/`, …). If the user names another location, use that.

| Mode | When | Read |
|---|---|---|
| **Create** | No catalog yet. If one exists, say so and offer Update. Never overwrite. | `references/create.md` (it says when to read the others) |
| **Check** | After a feature, before a PR, or on a set of paths the user names. The most frequent mode, so keep it cheap. | `references/check.md` |
| **Update** (reconcile) | When Check passes findings on, after a release, to settle open decisions, or to record a newly decided pattern. | `references/update.md` (it says when to read the others) |

Any mode can be scoped to an area ("web app only"). On a large codebase, scope the first Create and let later runs add to it.

If the user's request doesn't name a mode, pick it from the state: no catalog means Create; a request about changes or code they've written means Check; anything else that touches an existing catalog means Update. If it's still unclear, ask.

Read each reference file at the step that needs it, not all at once.

## The catalog, in short

Always a directory, even for a small project, so the format never changes as it grows:

```
patterns/
  INDEX.md        intro, architecture, capability map, area-wide Don't copy, cross-cutting style, tooling, open decisions
  <area>.md       one file per area: its capabilities, each with scenarios, notes, Don't copy and style
```

- **INDEX.md** is the entry file. Its frontmatter holds `schema` and `reconciled_at` (the commit the catalog was last reconciled against), and nothing else. Its sections, in order:
  1. **Intro line:** fixed text saying the catalog isn't exhaustive, what to do when a scenario isn't listed, and that any rule can be broken where following it would be awkward, after asking the user. Specific exceptions are never recorded.
  2. **Architecture:** how new code is built. The approach first (**Paradigm**, named **Patterns** with the structural model first, and a **Stance** line on how closely the code follows its framework), then a placement table of where each kind of code goes, then **Don't introduce**: well-known patterns the team rejects for this codebase, each with a reason and what to do instead. It comes before the capabilities because the approach and placement are decided before any scenario's pattern.
  3. **Capability map:** each area with its file, stack and path globs, and under it each capability with one line on what it covers. Agents find their section here. Check uses the paths to map a diff to area files, so paths appear only here.
  4. **Don't copy (area-wide):** legacy that spans an area or more, each with a reason and its replacement.
  5. **Style (cross-cutting):** house conventions that apply everywhere, aren't naming, and aren't enforced by tools.
  6. **Tooling:** pointers to lint, format and type-check configs.
  7. **Open decisions:** each linking to its capability.
- **An area** is a layer, app or package, named with its technology ("Web app (React, TypeScript)"). A single-layer project has one area.
- **A capability** is a problem being solved, in the codebase's own terms ("Background work", "Commands"). Each section holds, in order and only as needed: a scenario table ("I need to…", pattern, exemplar, Not, "Use when / notes"), pattern notes, Don't copy entries, and style. A row exists only where there's a real choice, or for a house technique the code always uses. Every area with tests has a Testing capability. Empty capabilities are left out.
- **The Not column** names the alternatives a row's pattern replaces, names only. Each item has its own Don't copy or Don't introduce entry, which holds the reason. Every table has the column, even when it's empty.
- **"Use when" notes** are required wherever two scenario rows could be mistaken for each other. Check needs them to judge whether a pattern fits the situation.
- **Dates** appear only on accepted variants, as the month accepted. Everything else states current decisions, with no change log.
- **Naming is out of scope.** If the project has a glossary or naming doc, cross-cutting Style links to it in one line.

`references/template.md` has the exact structure.

## Reference files

| File | What it holds | Read when |
|---|---|---|
| `references/create.md` | Create workflow, classifying findings, wiring | Create |
| `references/discovery.md` | Finding areas, capabilities, scenarios, variants, legacy signals and exemplars in any stack | Create, discovery step; Update, for new scenarios or areas |
| `references/questions.md` | Question shapes, batching and examples | About to ask the user decisions |
| `references/template.md` | INDEX.md and area file templates, writing rules, format versions | Drafting (Create); adding an area or migrating the format (Update) |
| `references/example-patterns/` | A finished catalog for a fictional company. Never copy its patterns. | Drafting (Create) |
| `references/check.md` | Check workflow, review order, categories, report format and a worked example | Check |
| `references/update.md` | Update (reconcile) workflow, applying Check findings, format migration | Update |
