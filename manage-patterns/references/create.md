# Create

Write a new catalog. Follow the principles in `SKILL.md` throughout.

## Workflow

**Keep a list of the session's decisions:** every answer the user gives in the question batches and at the draft review. Step 11 checks the catalog against it.

1. **Check for an existing catalog.** Look for `conventions/patterns/INDEX.md` under the project's docs directory, and for any other file that looks like a conventions, patterns or architecture doc. If a catalog in this format exists, say so and offer Update. Never overwrite one. An older doc in another format is a source for discovery. Ask whether the new catalog should replace it, in the step 4 batch.
2. **Detect the stack and the kind of application** (an API, a SPA, a full-stack web app, a CLI, a library…) from the manifests (`package.json`, `composer.json`, `pyproject.toml`, `go.mod`, `Gemfile`, `*.csproj`, …) and the directory structure. Record both: they choose which commonly introduced patterns to offer in step 3. Read `discovery.md` now.
3. **Confirm the architecture and approach.** Infer the structural model from the directory layout, the framework's conventions and any existing docs, and gather the approach signals (`discovery.md`). This approach-level discovery (structure, paradigm, competing structures, where logic actually lives) happens now, before any question; scenario-level discovery waits for step 5. Then ask, in one batch (`questions.md` has the shapes):
   - **Architecture:** confirm the structural model. If the code shows two competing structures, such as an older layer-based tree beside newer feature folders, ask which one new code follows. The other goes under Don't copy.
   - **Stance:** how closely new code follows the framework and the named patterns.
   - **Don't introduce:** which commonly introduced patterns the team rejects for this codebase.

   Then draft the Paradigm and Patterns lines from the approach signals, and the placement table from where each kind of code lives in the chosen structure.
4. **Propose the areas, capabilities and scenarios in one step.**
   - Areas come from the stack (`discovery.md`), each with its path globs.
   - Capabilities and their scenarios come from what the structure shows (routes, jobs, migrations, components, hooks…), including a Testing capability for each area that has tests.
   - Ask the user to add, remove or rename any of them, and whether the team has decided patterns for anything the code doesn't do yet. Add the step 1 question about replacing older docs to this batch.

   This one cheap step bounds the rest of discovery. On a large codebase, recommend scoping the first run to one or two areas.
5. **Discover** patterns for each agreed scenario (`discovery.md`), reusing what step 3 already found. Keep a working list: each scenario, its variants with counts, recency and candidate exemplars, and anything that conflicts.
6. **Classify** each finding (below).
7. **Ask about decisions.** Read `questions.md`, then ask in batches. The last batch includes the house techniques confirmation (below).
8. **Ask about Don't copy.** List the legacy candidates discovery found, each with a drafted reason and where it belongs (a capability, or area-wide). Ask about anything else being phased out.
9. **Draft and get approval.** Read `template.md` and the files in `example-patterns/`, then draft every file in full. Model the depth and tone on the example, but never copy its patterns. Before showing the draft, review it against `template.md`:
   - every row against "When a row exists", and against the self-sufficiency test: could an agent write the import line and the call from this row alone?
   - every pattern-defining part decided in the session against its cell or note: trimming to names must never drop one
   - every Pattern cell against the "one or two names" limit and its worked pair in `template.md`. A cell that joins three or more names with "with", "then" or commas lists contents: cut it to the pattern and its own module
   - every pattern note against the note rules: a long "use when" rule, a house variant's difference, an accepted variant or a Planned sketch, and nothing else

   Cut explanations of house modules and descriptions of what a feature contains; add any missing module, function or call shape. Then show the user the whole draft, starting with the Architecture section (approach, placement table and Don't introduce), and with it:
   - the exceptions to the paradigm and named patterns that discovery found, each with its path. They aren't written into the catalog. The user can leave each one alone, or call it legacy and add it to Don't copy
   - the scenarios left out as framework or textbook defaults, and the one-off mechanisms left out, listed compactly so the user can add any back
   - decisions shown as made, and Don't copy reasons as drafted
   - any exemplar the user might want to swap

   The user corrects anything, then approves. Their corrections are decisions too, so don't argue them back.
10. **Confirm the location and write.** Default: `documentation/conventions/patterns/`, or `conventions/patterns/` under the project's docs directory (`docs/`, `doc/`, …). If there's no docs directory, ask. Set `reconciled_at` to `git rev-parse --short HEAD`.
11. **Verify what you wrote.** Fix anything that doesn't pass.
    - **Paths and links:** every exemplar and placement example path exists (`git ls-files <path>`), every capability map glob matches at least one file, every link and anchor in the Patterns line, the capability map and Open decisions points to a real section, and every Not item has a matching Don't copy entry (in its capability or area-wide) or Don't introduce entry.
    - **Imports resolve:** every helper named in a Pattern cell is exported from the module given for it. That's one targeted search per name.
    - **No contradiction:** no Don't copy or Don't introduce entry forbids what a row or style rule prescribes, unless the entry names the exception.
    - **Every implied location is placed:** if a row's pattern puts code somewhere ("a job calls an imported function"), the placement table has a row for that kind of code.
    - **Exemplars follow the catalog:** an exemplar doesn't use anything its own capability or the area-wide Don't copy lists, and doesn't break a Style rule that applies to it. Check with a targeted search on the exemplar for the listed names, not a full read.
    - **Every decision has a home:** each decision on the session's list appears in the catalog, as a row, a note, a Don't copy or Don't introduce entry, a style rule, an Open decision or the Architecture lines. Restore a decision with no home, or raise it with the user.
12. **Offer the wiring** (below).

## Classifying findings

| Bucket | Example | Action |
|---|---|---|
| Consistent and obvious | A framework or textbook default an agent would follow anyway: every migration is a timestamped file in the migrations folder | Leave out, and list it at the draft review. Don't ask. |
| Consistent, easy to get wrong | A house variant, a house technique the code always uses but the framework wouldn't do by default, code that's easy to put in the wrong layer, or the paradigm when the stack's common alternatives differ (functions over classes) | Record with the best exemplar, or in the Architecture approach lines. A house variant gets a note on how it differs; a house technique gets a brief row with an empty Not cell. Confirm house techniques in one list question (below); don't ask about the rest. |
| One-off | A mechanism one module uses, with no plausible rival, that new code wouldn't repeat | Leave out, and list it at the draft review. Don't ask. |
| Conflicting | Two ways to call external APIs | Ask the user to choose. Losers go under Don't copy with a reason, and in the row's Not cell. |
| Only the user knows | Is `src/v2/` the future or an abandoned experiment? | Ask. |
| No evidence | Scenario agreed, but nothing in the codebase does it yet | Ask whether the team has decided a pattern. If so, record it as Planned with a sketch or reference. If not, gap marker. |

**The approach is always recorded,** whatever its bucket: the Paradigm, Patterns and Stance lines and Don't introduce describe how new code is built, and agents bring their own from other codebases. The buckets apply to scenarios.

**Confirm house techniques before drafting.** "Consistent in the code" isn't the same as "decided by the team", especially on a codebase in the middle of a migration: a technique every file uses may be the one the team is moving away from. List every house technique you'll record, one line each with its exemplar, as a single question in the last decision batch (`questions.md`). The user confirms each, or marks it undecided (an Open decision) or legacy (Don't copy, with a replacement if there is one).

**Answers that give a direction only** ("we're moving to X, details not decided"): record the direction in the Patterns or Stance line, and each undecided detail as an Open decision. It becomes a Planned pattern only if the team gives a sketch or a reference. Don't invent one from the direction.

**Expect many conflicts** on a messy codebase. Rank them by how often the scenario comes up in feature work and ask about the top ones. Aim for about 12 decisions per session (three batches of four). The rest go under Open decisions for a later Update. Say how many are left; the user can ask to keep going.

**"Both are valid" needs a rule** for when each applies (a query hook for reads, a mutation service for writes). Then they're two scenarios, each with a "use when" note. If the user can't give a rule, it's an Open decision.

**"Use when" notes** come from what distinguishes the places each variant is used (`discovery.md`, step 5). Draft the rule and let the user correct it; don't ask for it in prose.

**Don't copy reasons:** draft each from the evidence ("callback-style, only in `src/legacy/`, last touched 2023") and let the user correct it in the draft. Don't spend a question on it.

**Planned patterns:** ask once, openly, at step 4. An agreed scenario that discovery then finds nothing for goes into the decision batches as a No evidence question (`questions.md`). Draft each entry (name, when it applies, the sketch and a reference) from the answer, and let the user correct it in the draft. Patterns that existing docs decide but the code doesn't use are Planned candidates too: offer them in the same step.

**Style:** record a convention only if it holds across the sampled files, no tool enforces it, and it isn't naming. Put it in the capability it belongs to, or in INDEX.md if it applies everywhere. A convention that's split is a conflict to ask about, like any other. State a rule's scope where it's ambiguous, such as what applies when there's no acting user, or when a batch handles many entities.

## Wiring

After writing, offer these. Don't apply them automatically.

- **Docs index:** if `documentation/INDEX.md` (or the project's equivalent) exists, add an entry under a Conventions section, creating that section if needed.
- **CLAUDE.md or AGENTS.md:** offer two lines:

  > Before designing a feature, read the Architecture section (including Don't introduce) and the Capability map section of `documentation/conventions/patterns/INDEX.md`, then the capability section for the problem you're solving. Put new code where the Architecture section says, and don't invent new layers or folder conventions. Use the listed pattern for each scenario and model new code on its exemplar. Never copy anything listed under Don't copy, and never bring in anything listed under Don't introduce. If a scenario isn't listed, follow the placement table and the neighbouring code; ask only if there's no clear precedent.

  > When you finish a feature, offer to run the `manage-patterns` skill's Check mode on your changes.

  Use the catalog's real path in the first line.

Unlike a naming glossary, the catalog keeps a read-first line. A wrong name is a cheap rename after the fact. A feature built in the wrong layer or around a reinvented mechanism has to be redone. Reading only Architecture, the map and one capability section keeps the cost per task small. Don't copy catalog content into CLAUDE.md: one copy, in the catalog, is easier to keep right.

## Finish

End with:
- one line saying where the catalog was written
- how many areas, capabilities and scenarios it has, how many are Planned, how many Don't introduce entries it has, and how many open decisions remain
- the result of the verification step

Then ask the closing question: *"Are there any patterns the team has decided on that I haven't recorded, or approaches being phased out that I won't find in the code?"* If the answers change the catalog, show the change and get approval before editing.

Remind the user that the catalog should go through the team's normal review, such as a PR, because the decisions belong to the team.
