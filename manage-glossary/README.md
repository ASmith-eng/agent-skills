# Manage Glossary

[![Git: required](https://img.shields.io/badge/Git-required-F05032?logo=git&logoColor=white)](#requirements)
[![Node.js: recommended](https://img.shields.io/badge/Node.js-recommended-5FA04E?logo=nodedotjs&logoColor=white)](#requirements)

An AI agent skill that writes and maintains your codebase's glossary: the team's domain vocabulary, how business terms map to code names, and the naming rules agents must follow. It also checks new code against those decisions.

Agents name things with whatever word seems plausible. In an established codebase that causes drift (`Client` where the team says `Customer`, `fetchX` next to `getX`) and, worse, **collisions**: a word that fits in plain English but already means something else here. An agent building service fulfilment names a list of jobs in progress `activeOrders`, when "order" in your codebase means the purchase and its payment status. This skill records which word belongs to which concept, and catches the cases where new code gets it wrong.

## What it's for

- **Creating a glossary.** The skill reads your data model, migrations, UI copy and docs. It finds the terms, the synonyms and the collisions, and asks you to decide only what the code can't settle. Questions are multiple choice and come with evidence: counts, locations and which variant newer code uses.
- **Checking your changes against it.** After a feature or before a PR, Check looks at the new names in your changes, not the whole codebase. It reports names that use an Avoid term, borrow another concept's word, hold another concept's data, or introduce a new domain term. The report is built for skimming. Each finding leads with the suggested rename (`protocolsToPause` → `customerProtocolsToPause`), followed by a one-line reason. Findings are grouped into **Fix** and **Decide**, so you can see what needs your input at a glance.
- **Keeping it up to date.** Update reconciles the glossary with everything that changed since it was last reconciled. It shows each difference and changes only what you approve.

## What it's not for

- **Renaming code.** The skill only writes the glossary. Check reports findings; when it runs at the end of an agent's own feature work, that agent fixes its own new code.
- **Generic naming advice.** camelCase, descriptive names and avoiding abbreviations are things models already know. The glossary records only what's specific to your team.
- **Making decisions for you.** Where the code disagrees with itself, the skill asks. Anything you're unsure about goes under Open decisions, marked `Not yet defined — ask before inventing.`, so agents ask too.

## What it writes

A directory, `documentation/conventions/glossary/` (or the same under `docs/` or `doc/`):

```
glossary/
  INDEX.md              watch list, term index, naming rules, open decisions
  bookings.md           one file per group: a feature, workflow or entity family
  service-delivery.md
```

`INDEX.md` is the entry file, and the first thing Check reads. It opens with a **watch list** of the collisions most likely to cause harm, followed by an alphabetical **term index** that says which concept owns each word. Each group file covers one family of entities that are built and changed together, such as everything from booking to payment. It has a short overview, then a section per entity with its definition, business name, relationships and vocabulary. Its frontmatter holds the decisions the script checks: the group's code identifiers, the paths its code lives in, and its **Avoid** entries.

Avoid entries come in two kinds:

- **Lost variants** are names that lost a decision (`Client`, when the team chose `Customer`). They're flagged anywhere in new code, or only in the paths you give, for rules that depend on the layer (`customer` in backend code, `patient` in frontend code).
- **Reserved terms** are words that belong to another group ("order", which belongs to Bookings, inside Service delivery code). They're flagged only inside that group's paths, because elsewhere the word may be right.

See [`references/example-glossary/`](references/example-glossary/) for a finished glossary.

## Example use cases

- *"Create a glossary for this codebase, starting with the scheduling and billing domains."*
- *"Agents keep calling fulfilments 'orders'. Set up naming conventions so they stop."*
- *"I've finished the crew schedule feature. Check my changes against the glossary."*
- *"Did I use the right terms in `src/fulfilment/`?"*
- *"We've shipped the release. Bring the glossary up to date and let's settle the open decisions."*

## Recommended cadence

- **Run Check after each feature.** It's the cheapest mode, and it also runs the integrity check on the glossary itself.
- **Run Update** when Check reports drift or glossary problems, and after each release.

If your team wants this on a schedule, set it up with your own tools (cron, CI, a scheduled agent). The skill doesn't assume one.

Once the glossary is written, the skill offers one line for `CLAUDE.md` or `AGENTS.md`, telling agents to run Check when they finish a feature. Agents aren't asked to read the glossary before they start. It works like a linter: a sweep over the diff afterwards, which costs nothing on tasks that don't need it.

## The check script

`scripts/glossary-check.js` finds candidates the same way every time, so the agent can spend its effort judging them:

```bash
node scripts/glossary-check.js --diff            # your changes vs the merge base with the default branch
node scripts/glossary-check.js --diff <base>     # vs a commit or branch
node scripts/glossary-check.js --paths 'src/billing/**'
node scripts/glossary-check.js --integrity       # does the glossary still match the code?
```

Add `--json` for machine-readable output, `--glossary <dir>` for a non-default location, and `--strict` to exit 1 when there are candidates (for CI).

`--diff` gives the agent two short lists:
- **Candidates:** Avoid terms, and reserved terms used inside the reserving group's code.
- **Mentions:** names that are new in your changes and use a word belonging to a group. Words like "order" are used legitimately all over a codebase. So instead of flagging every use, the agent checks only these new names, asking whether each one holds what its name says. `recentOrders` filled from the fulfilments table is caught this way, wherever it is.

Both lists are leads, not verdicts: a name like `displayOrder` may contain a reserved word and still be fine. The agent judges each one from the diff, and doesn't search the rest of the codebase.

The script runs from the skill's directory and is never copied into your project. It has no dependencies beyond Node and git.

### Running without Node

Every mode works without the script. `references/check.md` describes the same matching rules in prose, and the agent applies them with `git grep`. It's slower and less repeatable, so the report says when the script wasn't used.

### Tests

```bash
node --test scripts/test/*.test.js
```

The tests build small fixture repositories in a temp directory. They need git.

## Choices beyond the plan

These weren't covered by the design plan and were decided while building the skill:

- **Groups are families, not single entities.** The plan's "one file per group (data entity or feature)" is read as one file per feature, workflow or entity family, with a section per entity. Term index rows link to the entity's section with an anchor.
- **Recorded names and longer terms aren't flagged.** A group's own `code` is never flagged by its own Avoid entries, and a match inside a longer term from the term index ("order" inside `orderLineItems`, when "order line item" is indexed) is skipped. On a real codebase this cut a reserved term's hits from 462 to 170.
- **`only_in` for layer rules.** A lost variant can be limited to some paths, so "customer in backend code, patient in frontend code" is checked by the script. This is a new optional field; the schema stays at version 1.
- **The owning group's code is always allowed.** Inside Service delivery's paths, "order" is reserved, but `Order` and `orderId` (from Bookings' `code` list) aren't flagged, because referring to the real Order by its own name is correct. A bare `order` variable or `activeOrders` still is.
- **No "read before naming" instruction.** The plan's wiring had two lines. Only "run Check after a feature" is kept, so the glossary costs nothing on tasks that don't need it.
- **Mentions decide what Check looks at outside known paths.** The plan's semantic pass covered "the new identifiers in the diff". The script narrows that to new names that use a group's word, meaning a term the term index links to it. Names that already existed at the base aren't new, so they aren't listed. `--paths` doesn't list mentions.
- **Prose and lockfiles aren't checked.** `.md`, `.mdx`, `.txt`, `.rst`, `.adoc` and lockfiles are skipped, because prose may rightly use business names.
- **A path without wildcards covers everything under it,** so `src/billing` works like `src/billing/**`.
- **Plain scalars that YAML would misread must be quoted.** The frontmatter subset also requires quotes for values starting with `*`, `&`, `!`, `|`, `>` and similar, so that every glossary file is still valid YAML. A glob starting with `**` must be quoted.
- **`--strict` with `--integrity`** exits 1 when there are integrity problems. With `--diff` or `--paths` it exits 1 when there are candidates.
- **`reconciled_at` after a partial Update** is set only if the user agrees, because setting it would hide unreviewed changes in the rest of the glossary from the next Update.

## Requirements

- **Git.** The skill reads history for recency and reconciling, and the script uses git to list and diff files.
- **Node.js** (current LTS), recommended, for the check script. Without it, the skill applies the same rules by hand.
