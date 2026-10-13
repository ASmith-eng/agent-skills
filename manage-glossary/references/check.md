# Check

Answer one question: **do the new names in the recent changes use the right wording?** The work happens in two layers. The script lists candidates and mentions the same way every time, and you judge each one from the diff.

Check covers the changes only: added lines and new file names. Don't search or trace through the wider codebase, and don't report problems in code the changes didn't touch. Existing drift is Update's job.

Check never edits code or the glossary. It produces a report.

## Workflow

1. **Find the glossary** (`SKILL.md`). If there isn't one, say so and offer Create. Read `INDEX.md` in full, and the frontmatter of every group file. Read group bodies only when you need a definition to judge a finding.
2. **Set the scope.** The default is the working tree against the merge base of the default branch. That covers committed, uncommitted and untracked changes. To find the default branch, use `origin/HEAD`; if that isn't set, try `main` then `master`; if neither exists, ask. The user can name a base commit or branch instead. Use `--paths` (whole files in an area) only when the user asks to check an area rather than their changes. It lists candidates but no mentions.
3. **Run the script** from inside the repo:

   ```bash
   node <skill-dir>/scripts/glossary-check.js --diff --json            # default scope
   node <skill-dir>/scripts/glossary-check.js --diff <base> --json     # a named base
   node <skill-dir>/scripts/glossary-check.js --paths 'src/billing/**' --json
   ```

   The output has three parts: candidates (Avoid and reserved terms), mentions (new names that use a group's word), and the integrity check. If the script can't run (no Node, exit code 2, or results that are clearly wrong for this project), apply the rules under "Running by hand" below, and say in the report that the script wasn't used and why.
4. **Judge each candidate.** Open the flagged line and read enough around it to see what the identifier holds. Then decide:
   - **Real problem:** the name uses an Avoid term, or a reserved word for this group's own data. `activeOrders` in Service delivery code holding fulfilments is real.
   - **False positive:** the name really refers to the thing the word belongs to, or is a different sense of the word. `order` holding an actual `Order` loaded for a Fulfilment, or `displayOrder` meaning sort position, are false positives.
5. **Check each mention.** Mentions are names that are new in the diff (they didn't exist at the base) and use a word that belongs to a group: `recentOrders` points to Bookings, through the term "order". The term tells you which entity in the group it means. For each one, ask: **does this name describe what it holds?** Judge from the flagged line and the nearby lines of the same change: the assignment, the query, the type or the return value. `recentOrders = fulfilmentRepo.listCompleted()` holds Fulfilments, so it's a finding ("Name holds another group's data"). `orderTotal = order.lines.sum()` is fine; say nothing. If the diff doesn't show what it holds, open the definition it's assigned from, but no further. If that still doesn't settle it, put it under Decide instead of searching. Mentions that turn out fine aren't listed in the report; they're only counted.
6. **Run a short semantic pass** over the rest of the diff, for what neither list covers:
   - **New domain terms** that aren't in the glossary: new models, tables, types, or a new word for an existing concept.
   - **Business names in code identifiers** that aren't Avoid entries yet: a group body says the UI calls it "Job", and new code has `JobBadge`.
   - **Naming rules broken:** check new functions and booleans against each rule in INDEX.md (`getInvoices()` that makes a network call, when the rule says `fetch`).
   - **Watch list cases:** re-read the watch list and look for each case in the diff.
7. **Report** in the format below.

When Check runs at the end of your own feature work, the report goes back to that task. Fix the code for the real problems you're sure of, as part of the feature, and tell the user what you changed. Anything that needs the glossary changed is the user's call: list it and ask.

## Report format

The reader should see what to do without reading paragraphs. Each finding leads with the suggestion; the reason comes after, for readers who disagree or want to know why. Output these parts in this order, and leave out any section with nothing in it:

1. the header: two lines
2. **Fix:** findings where you're confident the code should change
3. **Decide:** findings that need the user's choice: new domain terms, unsure cases and real trade-offs
4. **Not a problem:** script candidates you dismissed
5. **Also noticed:** problems outside the glossary, one line each
6. the closing line

```markdown
**Glossary check:** 6 changed files vs `a1b2c3d` (merge base with main). **3 to fix, 1 to decide.** Integrity OK.
Script: 3 candidates, 7 mentions checked. Semantic pass: 1.

## Fix
1. `recentOrders` → `recentFulfilments` · src/reports/weekly.ts:22
   Filled from `fulfilmentRepo.listCompleted()`, so it holds Fulfilments; "order" is the purchase. *Name holds another group's data*
2. `activeOrders` → `activeFulfilments` · src/fulfilment/ActiveList.tsx:14, 19
   "order" is reserved by Bookings inside Service delivery code. *Reserved term in the wrong group*
3. `JobCard` → `FulfilmentCard` · src/web/JobCard.tsx (new file)
   "Job" is the staff app's name; code says Fulfilment. *Avoid term used*

## Decide
4. `Round` · src/scheduling/round.ts:3 · *New domain term*
   **Add to glossary:** "A crew's recurring route of visits on a fixed schedule" | **Use existing term:** none fits
   A new model grouping Visits by crew and schedule.

## Not a problem
- `displayOrder` · src/fulfilment/sort.ts:8: sort position, not a purchase. Add to `allow`?

Reply with a number and "update" to change the glossary instead of the code (e.g. "2 update").
```

### Rules

- **Suggestion first.** A finding's first line is `old` → `new`, then ` · ` and the location. Separate alternative names with ` | `. The second line is the reason, in one or two sentences, ending with the category in italics. Say what the identifier holds, or what rule it breaks. Don't restate the glossary at length.
- **Decide items** put the category on the first line instead of a rename. The second line lists the choices in bold, separated by ` | `, each with its consequence. A third line, if needed, gives what you know. Use Decide whenever you aren't sure: say what would settle it, and don't guess.
- **Order:** within Fix, names holding another group's data first, then reserved terms, Avoid terms and naming rules. Number findings continuously across Fix and Decide.
- **One finding per identifier per file.** List every line it's on in the location.
- **Paths are repo-relative.** Use the file name alone when the header's scope makes the path obvious and no other changed file shares the name.
- **Header:** line 1 gives the scope, the counts to fix and decide, and integrity. Line 2 gives the script's candidate and mention counts and the semantic pass count. If the integrity check found problems, list each one, with its file and line, under the header before Fix. Mention warnings only if they matter, such as a schema version that's out of date.
- **Mentions that turn out fine** are only counted in the header. Dismissed script candidates go under Not a problem, one line each, with the reason. If adding the identifier to `allow` would stop it being flagged again, say so.
- **The closing line** is fixed, as in the example. Leave it out if there are no Fix items.
- **No preamble, narration or summary** outside these parts.

Each category's alternative to fixing the code is what "update" means for that finding:

| Category | Default | "update" means |
|---|---|---|
| Avoid term used | Fix the code | change the decision |
| Reserved term in the wrong group | Fix the code | add it to `allow` |
| Name holds another group's data | Fix the code | none: the name is wrong |
| Naming rule broken | Fix the code | change the rule |
| New domain term | Decide | add it to the glossary, or use an existing term |

### After the report

Wait for the user's choices. Collect every finding they mark "update", every Decide item resolved towards the glossary, and every `allow` they accept, and offer to run Update with them. Pass each one with its category, location, identifier and the choice. Don't change the glossary from within Check.

## Running by hand

When the script can't run, apply its rules yourself. They're the same rules, so the results should match.

1. **Files in scope:** `git diff --name-status <base>` plus `git ls-files --others --exclude-standard`, or the files matching the paths. Skip the glossary directory, prose files (`.md`, `.mdx`, `.txt`, `.rst`, `.adoc`) and lockfiles.
2. **Lines in scope:** for a diff, the added lines (`git diff -U0 <base>`) and the names of new or renamed files. For paths, every line.
3. **Build the rules** from the group frontmatter:
   - each lost variant (an `avoid` entry with no `reserved_by`) applies to every file, or only to files matching its `only_in` globs if it has them
   - each reserved term applies only to files matching that group's `paths`
4. **Search** the lines in scope for each term, case-insensitively, in the files the rule applies to. For example, `git diff -U0 <base> -- <files> | grep -n -i -E '^\+.*jobs?'`. Do the same for untracked files. Then, for each hit:
   - Ignore it if it's inside a string literal or comment.
   - Split the identifier into words (camelCase, PascalCase, snake_case, kebab-case, SCREAMING_CASE). Keep it only if the term's words appear consecutively, with only the last word allowed to be plural. So `activeJobs` matches `job`, but `jobber` doesn't.
   - Drop identifiers in the entry's `allow` list or in its own group's `code` list. For a reserved term, also drop identifiers in the owning group's `code` list.
   - Drop a match that falls inside a longer term from the term index (with "order line item" indexed, "order" doesn't flag `orderLineItems`).
5. **Mentions** (diff only): from the same lines and new file names, list the identifiers whose words match a term the term index links to a group. Use the same matching rules as above. Drop:
   - identifiers that are already candidates
   - identifiers in any `code` or `allow` list
   - identifiers that already existed at the base: `git grep -w -q <identifier> <base> -- . ':(exclude)<glossary dir>'` succeeds for those
6. **Integrity by hand:** see the list in `update.md`, step 5.

Then carry on from step 4 of the workflow. Note in the scope line: "Script not used (no Node); rules applied by hand."
