---
name: manage-glossary
description: Create, check and update a project's domain glossary (documentation/conventions/glossary/). It records the team's vocabulary, how business terms map to code names, which word belongs to which concept, names to avoid, and house naming rules, so agents name things the way the team does and stop reusing one concept's name for another (`activeOrders` for jobs in progress when "order" means the purchase). Use it to write a glossary, ubiquitous language or naming conventions for a codebase, or to stop agents inventing or mixing up names. Use it to check finished code against the glossary ("check my changes against the glossary", "did I use the right terms", "run the glossary check", before a PR or after a feature). Use it to bring the glossary up to date after code changes or a release, or to settle open naming decisions. It only writes the glossary; it never renames or edits code.
---

# manage-glossary

Write and maintain a project's glossary: the domain vocabulary, how it maps to code, and the naming rules agents follow. Then check new code against it.

Paths to this skill's own files (`references/…`, `scripts/…`) are relative to this skill's directory. Paths in the glossary and in reports are relative to the project's repo root.

## Why this exists

Agents name things with whatever word seems plausible. In an established codebase that causes drift (`Client` where the team says `Customer`), and worse, **collisions**: a word that fits in plain English but already belongs to a different concept here. An agent building service fulfilment names a list of jobs in progress `activeOrders`, when "order" in this codebase means the purchase and its payment status. Collisions do the most damage, so they get the most attention: in discovery, in the questions, at the top of the index, and in Check.

## Principles

These hold in every mode.

1. **Record the target, not a census.** The glossary is the set of naming decisions the team has made, not a list of every name in use. Where the code disagrees with itself, ask the user to choose, so future work converges.
2. **Discover first, ask second.** The code and existing docs come first. The user confirms, chooses or corrects, but never has to write a convention from scratch. Propose a definition or reason and let them fix it.
3. **Don't repeat what models already know.** No generic naming advice (camelCase, descriptive names, no abbreviations). Record only what's specific to this team: domain terms, business-to-code mappings, and house rules that differ from or go beyond the usual defaults.
4. **Team convention beats industry practice.** If the team deliberately does something unusual, record it. Don't "correct" it.
5. **Gaps are visible.** Anything undecided is written as exactly `Not yet defined — ask before inventing.`, so agents ask instead of guessing.
6. **Docs only.** This skill never edits code. Check reports findings. When Check runs at the end of feature work, the report goes back to that task, and the task fixes its own code.
7. **The script is an accelerator, not a dependency.** Every mode works by hand. If Node is missing, or the script fails or doesn't fit the project, apply the same rules yourself (`references/check.md` has them in prose) and say the script wasn't used. A script failure makes a run slower, never blocked.
8. **Decisions belong to the team.** One person runs the skill, but the glossary goes through the team's normal review, such as a PR. Undecided items are for the team to discuss, so they go under Open decisions instead of being settled by you.
9. **Stand alone.** Don't rely on any other skill. When existing docs disagree with the code or with each other, show the user the conflict. Don't quietly pick one.

## Modes

First find the glossary: `documentation/conventions/glossary/INDEX.md`, or the same path under the project's docs directory (`docs/`, `doc/`, …). If the user names another location, use that.

| Mode | When | Read |
|---|---|---|
| **Create** | No glossary yet. If one exists, say so and offer Update. Never overwrite. | `references/create.md` (it says when to read the others) |
| **Check** | After a feature or before a PR. It covers only the recent changes (the diff), never the whole codebase. The most frequent mode, so keep it cheap. | `references/check.md`, `references/schema.md` |
| **Update** (reconcile) | When Check or the integrity check reports drift, after a release, or to settle open decisions. | `references/update.md` (it says when to read the others) |

Any mode can be scoped to a domain or directory ("just billing"). On a large codebase, scope the first Create and let later runs add to it.

If the user's request doesn't name a mode, pick it from the state: no glossary means Create; a request about changes or code they've written means Check; anything else that touches an existing glossary means Update. If it's still unclear, ask.

Read each reference file at the step that needs it, not all at once.

## The glossary, in short

Always a directory, even when it's small, so the format never changes as it grows:

```
glossary/
  INDEX.md        watch list, term index, naming rules, open decisions
  <group>.md      one file per group: a feature, workflow or entity family
```

- **INDEX.md** is the entry file. Check reads it first, and reads group files only when a finding needs them. Agents aren't asked to read the glossary before coding; Check sweeps the diff afterwards, like a linter. Its sections, in this order:
  1. **Watch list:** the three to seven collisions or Avoid terms most likely to cause harm.
  2. **Term index:** every term in alphabetical order, with the group it belongs to.
  3. **Naming rules:** the team's house rules, each with one example. All naming rules live here.
  4. **Open decisions:** anything deferred or unsure.
- **Group files** each cover a family of entities that are built and changed together, not one entity. The frontmatter holds the decisions the script checks (`group`, `paths`, `code`, `avoid`). The body is prose: a short overview of the family, then a section per entity with its definition, business name, relationships and vocabulary. Code identifiers and Avoid entries live **only** in the frontmatter, so the two can't drift apart.
- **Avoid entries** come in two kinds:
  - **Lost variants** (a `reason`, no `reserved_by`) are wrong anywhere in new code, or only in their `only_in` paths.
  - **Reserved terms** (`reserved_by: <group>`) belong to another group, and are wrong only inside this group's `paths`.

`references/template.md` has the exact structure. `references/schema.md` has the frontmatter fields and the limited YAML subset the frontmatter must use.

## The script

```bash
node <skill-dir>/scripts/glossary-check.js --diff [<base>]     # added lines and new file names (Check's default)
node <skill-dir>/scripts/glossary-check.js --paths <glob>...   # whole files in an area, only when asked
node <skill-dir>/scripts/glossary-check.js --integrity         # the glossary itself
```

Run it from inside the project's repo. Add `--json` for output you parse, and `--glossary <dir>` if the glossary isn't in a default location. It needs Node and git, and nothing else. It ships with the skill and runs from here; never copy it into the project. It lists two things:
- **Candidates:** Avoid terms, and reserved terms inside the reserving group's paths.
- **Mentions,** with `--diff` only: new names that use a group's word, so you can check each one holds what its name says.

Both are **leads, not verdicts**: you judge each one from the diff. Exit code 2 means it couldn't read the glossary or git failed; anything else means it ran.

## Reference files

| File | What it holds | Read when |
|---|---|---|
| `references/create.md` | Create workflow, classifying findings, wiring | Create |
| `references/discovery.md` | Where models, migrations and UI copy live in each stack; synonym and collision heuristics | Create, discovery step; Update, for new entities |
| `references/questions.md` | Question shapes, batching and examples | About to ask the user decisions |
| `references/template.md` | INDEX.md and group file templates, writing rules | Drafting (Create); adding a group (Update) |
| `references/example-glossary/` | A finished glossary for a fictional company. Never copy its terms. | Drafting (Create) |
| `references/check.md` | Check workflow, report format, matching rules for running by hand | Check |
| `references/update.md` | Update (reconcile) workflow, schema migration | Update |
| `references/schema.md` | Frontmatter fields, YAML subset, versioning | Check, Update, and when writing frontmatter |
| `scripts/glossary-check.js` | Candidate finder and integrity check, Node, no dependencies | Run it; no need to read it |
