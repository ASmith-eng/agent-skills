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
   - **Real problem:** the name uses an Avoid term, or a reserved word for this group's own data. `activeOrders` in Fulfilment code holding fulfilments is real.
   - **False positive:** the name really refers to the thing the word belongs to, or is a different sense of the word. `order` holding an actual `Order` loaded for a Fulfilment, or `displayOrder` meaning sort position, are false positives.
5. **Check each mention.** Mentions are names that are new in the diff (they didn't exist at the base) and use a word that belongs to a group: `recentOrders` points to Order. For each one, ask: **does this name describe what it holds?** Judge from the flagged line and the nearby lines of the same change: the assignment, the query, the type or the return value. `recentOrders = fulfilmentRepo.listCompleted()` holds Fulfilments, so it's a finding ("Name holds another group's data"). `orderTotal = order.lines.sum()` is fine; say nothing. If the diff doesn't show what it holds, open the definition it's assigned from, but no further. If that still doesn't settle it, report it as unsure instead of searching. Mentions that turn out fine aren't listed in the report; they're only counted.
6. **Run a short semantic pass** over the rest of the diff, for what neither list covers:
   - **New domain terms** that aren't in the glossary: new models, tables, types, or a new word for an existing concept.
   - **Business names in code identifiers** that aren't Avoid entries yet: a group body says the UI calls it "Job", and new code has `JobBadge`.
   - **Naming rules broken:** check new functions and booleans against each rule in INDEX.md (`getInvoices()` that makes a network call, when the rule says `fetch`).
   - **Watch list cases:** re-read the watch list and look for each case in the diff.
7. **Report** in the format below.

When Check runs at the end of your own feature work, the report goes back to that task. Fix the code for the real problems you're sure of, as part of the feature, and tell the user what you changed. Anything that needs the glossary changed is the user's call: list it and ask.

## Report format

Output exactly these parts, in this order: the scope line, the findings table, a block for each finding, false positives, integrity, and the recommendation. Leave out a part that has nothing in it, except the scope line, integrity and the recommendation.

```markdown
**Glossary check:** working tree vs `a1b2c3d` (merge base with main), 6 changed files. Script: 3 candidates. Mentions checked: 7 (1 finding). Semantic pass: 1 finding.

| # | Category | Location | Identifier |
|---|---|---|---|
| 1 | Name holds another group's data | src/reports/weekly.ts:22 | recentOrders |
| 2 | Reserved term in the wrong group | src/fulfilment/ActiveList.tsx:14 | activeOrders |
| 3 | Avoid term used | src/web/JobCard.tsx (new file) | JobCard |
| 4 | New domain term | src/scheduling/round.ts:3 | Round |

### 1. Name holds another group's data — `src/reports/weekly.ts:22`

`recentOrders` is filled from `fulfilmentRepo.listCompleted()`, so it holds Fulfilments. "order" means the purchase and its payment status ([Order](documentation/conventions/glossary/order.md)), and the watch list names this case.

**Opinion:** real problem. `recentFulfilments` fits the glossary.
**Options:** Fix the code

### 2. Reserved term in the wrong group — `src/fulfilment/ActiveList.tsx:14`

…

### 4. New domain term — `src/scheduling/round.ts:3`

`Round` is a new model grouping Visits by crew and schedule. It isn't in the glossary, and no existing term covers it.

**Opinion:** add it. Proposed definition: "A crew's recurring route of visits on a fixed schedule."
**Options:** Update: add it to the glossary / Fix the code to use an existing term

## False positives

| Location | Identifier | Why | Option |
|---|---|---|---|
| src/fulfilment/sort.ts:8 | displayOrder | sort position, not a purchase | Update: add to `allow` |

## Integrity

OK. *(or each problem, one line each, with its file and line)*

**Recommendation:** 3 findings to fix; the glossary needs an Update for 1 new term and 1 `allow` entry.
```

### Rules

- **Most important first.** Order the findings: names holding another group's data, then reserved terms, then Avoid terms, then naming rules, then new domain terms. `#` in the table is the block number.
- **One finding per identifier per file.** If the same identifier appears on several lines of one file, report it once and list the lines in the block heading.
- **Location** in the table is the repo-relative path and line, or `(new file)` for a file name. Paths are always repo-relative.
- **Mentions that turn out fine aren't listed,** only counted in the scope line. A mention that's a problem becomes a finding in its category, usually "Name holds another group's data". One you couldn't settle is a finding whose opinion says "unsure", with what would settle it.
- **Every block has an opinion with its reasoning.** Say what the identifier actually holds, and why it is or isn't a problem. If you aren't sure, say so and say what would settle it.
- **Options come from this table only:**

| Category | Options |
|---|---|
| Avoid term used | Fix the code / Update: change the decision |
| Reserved term in the wrong group | Fix the code / Update: add to `allow` |
| Name holds another group's data | Fix the code |
| New domain term | Update: add it to the glossary / Fix the code to use an existing term |
| Naming rule broken | Fix the code / Update: change the rule |
| False positive | Update: add to `allow` so it isn't flagged again |

- **Integrity** lists every problem from the script's integrity output, or `OK`. Mention warnings only if they matter, such as a schema version that's out of date.
- **Recommendation** is one line: how many findings to fix, and whether the glossary needs an Update and why.
- **No preamble or narration** beyond the scope line.

### After the report

Ask the user which option they want for each finding that has more than one. Collect every choice that says "Update", and offer to run Update with them. Pass each one with its category, location, identifier and the user's choice. Don't change the glossary from within Check.

## Running by hand

When the script can't run, apply its rules yourself. They're the same rules, so the results should match.

1. **Files in scope:** `git diff --name-status <base>` plus `git ls-files --others --exclude-standard`, or the files matching the paths. Skip the glossary directory, prose files (`.md`, `.mdx`, `.txt`, `.rst`, `.adoc`) and lockfiles.
2. **Lines in scope:** for a diff, the added lines (`git diff -U0 <base>`) and the names of new or renamed files. For paths, every line.
3. **Build the rules** from the group frontmatter:
   - each lost variant (an `avoid` entry with no `reserved_by`) applies to every file
   - each reserved term applies only to files matching that group's `paths`
4. **Search** the lines in scope for each term, case-insensitively, in the files the rule applies to. For example, `git diff -U0 <base> -- <files> | grep -n -i -E '^\+.*jobs?'`. Do the same for untracked files. Then, for each hit:
   - Ignore it if it's inside a string literal or comment.
   - Split the identifier into words (camelCase, PascalCase, snake_case, kebab-case, SCREAMING_CASE). Keep it only if the term's words appear consecutively, with only the last word allowed to be plural. So `activeJobs` matches `job`, but `jobber` doesn't.
   - Drop identifiers in the entry's `allow` list. For a reserved term, also drop identifiers in the owning group's `code` list.
5. **Mentions** (diff only): from the same lines and new file names, list the identifiers whose words match a group's name, or a term the term index links to that group. Use the same matching rules as above. Drop:
   - identifiers that are already candidates
   - identifiers in any `code` or `allow` list
   - identifiers that already existed at the base: `git grep -w -q <identifier> <base> -- . ':(exclude)<glossary dir>'` succeeds for those
6. **Integrity by hand:** see the list in `update.md`, step 5.

Then carry on from step 4 of the workflow. Note in the scope line: "Script not used (no Node); rules applied by hand."
