# Check

Answer one question: **does the code in the recent changes follow the catalog?** There's no script, because most findings need judgement. What keeps two runs on the same diff in agreement is a fixed starting point (the catalog), a fixed procedure, fixed categories and a fixed report format. Follow them exactly.

Check covers the changes only. Don't report problems in code the changes didn't touch; existing drift is Update's job. Check never edits code or the catalog. It produces a report.

## Workflow

1. **Set the scope.** By default, compare the working tree (committed, uncommitted and untracked files) with the merge base of the default branch:

   ```bash
   git symbolic-ref --short refs/remotes/origin/HEAD        # default branch; if unset, try main, then master; if neither exists, ask
   git merge-base HEAD <default-branch>                     # the base
   git diff --name-status <base>                            # committed and uncommitted changes
   git ls-files --others --exclude-standard                 # untracked files
   ```

   Use the merge base even when the changes are uncommitted. If it's the same commit as HEAD, say "(merge base = HEAD)" in the header. The user can name a base commit or branch, or a list of paths, instead. For paths, review those files in full; there's no diff.

   Leave out of the review: the catalog directory, prose files (`.md`, `.mdx`, `.txt`, `.rst`, `.adoc`), lockfiles, generated and vendored code, and deleted files. Manifests and config files (`package.json`, `.env.example`, …) aren't assigned a scenario, but read their diff: a new dependency often explains a new pattern.
2. **Read the catalog.** Find it (`SKILL.md`). If there isn't one, say so and offer Create. Read `INDEX.md` in full. Use the capability map's paths to find which areas the changed files fall in, and read those area files in full. Don't read other area files.
3. **Assign each changed file.** Its area comes from the capability map's paths. Then work out what job the code does, and find the matching capability and scenario row, using the "Use when / notes" cells to tell similar rows apart. A file gets exactly one of:
   - **a scenario row:** the row whose "I need to…" describes the job the file's changes do. Test files get a Testing row. If the changes do two jobs from two rows, assign both, and review each. The row may be one marked `Not yet defined — ask before inventing.`: that's an *Open decision taken* finding (step 4).
   - **not listed, follows neighbours:** no row matches, and the file matches the placement table and the code beside it. There's nothing to report for its pattern. Placement, Don't copy, Approach and Style still apply.
   - **not listed, no precedent:** no row matches at all, not even a "Not yet defined" one, and nothing in the catalog or the neighbouring code shows how to do this job. This is a *No precedent* finding.

   An edit that only registers, mounts or exports another changed file (an index file, a router mount, a re-export) takes that file's row and is reviewed with it. A file outside every area's paths is assigned the same way, and is listed under Catalog problems.
4. **Review each file against the catalog,** in this order. Each check names the catalog entry it's against:
   1. **Placement:** is the code where the Architecture section's placement table says, for its kind of code? This includes code of one kind inside a file of another kind, such as business logic in a controller.
   2. **Don't copy and Don't introduce:** does it add to, import from, or imitate anything listed under Don't copy, area-wide or in the capability? Does it bring in a pattern listed under Don't introduce? Both are *Uses a Don't copy pattern* findings, and the first line names the entry.
   3. **Approach:** does it follow the Paradigm and Patterns lines in Architecture? A departure that's listed under Don't introduce is already a finding (step 2). Any other departure, such as classes in a functions codebase or page-shaped responses where the Patterns line describes resources, is a *New pattern for a documented scenario*, pointing to the line it departs from. This applies to every file, including files with no scenario row.
   4. **Open decisions:** does it take a row marked "Not yet defined — ask before inventing", or settle an Open decision listed in INDEX.md, such as updating the screen optimistically when that's listed as open? Either is an *Open decision taken* finding, pointing to the row or the Open decisions entry. A "Not yet defined" row has no pattern to check against, so skip the Pattern and Situation steps for it.
   5. **Pattern:** for an assigned row, does it use the listed pattern (including a Planned one) or an accepted variant, rather than an alternative? Using an item from the row's Not column is a *Uses a Don't copy pattern* finding against that item's Don't copy or Don't introduce entry (step 2), not a pattern finding. Otherwise, if it doesn't use the listed pattern, it's one of:
      - **Reinvented pattern:** the code builds its own mechanism for what the listed pattern already provides (its own retry loop, its own request wrapper, its own form state).
      - **Pattern not followed in full:** it uses the listed pattern but leaves out a part whose absence makes it a different pattern in effect. The part must be stated in the row or its note. For example, a mutation service without the query invalidation its note names is a plain API call. A missing permission check or a missing test isn't a finding here: what a feature must contain is code review's concern, not this skill's. A named helper called against the call shape the row or its note gives (not awaited, arguments in the wrong order) is this category too. If the row names the helper but no call shape, a wrong call goes under Also noticed, as a lead for Update to add the call shape.
      - **New pattern for a documented scenario:** it uses a different established approach, such as a framework feature, a library or a well-known pattern, that the catalog neither lists nor puts under Don't copy.

      The test between them: could someone name the approach without reading this diff? If yes, it's a new pattern. If it's a mechanism written for this change, it's reinvented. If the approach is in the Not column or under Don't copy or Don't introduce, it's a Don't copy finding instead.
   6. **Situation:** if it uses a listed pattern, does that row's "use when" fit this situation? If another row's "use when" fits better, or the row's conditions aren't met, it's *Documented pattern, wrong situation*.
   7. **Tests:** do new or changed tests follow the matching Testing row? Review them with the same checks and categories.
   8. **Style:** does it follow the cross-cutting Style in INDEX.md and the capability's Style?
5. **Read further only to judge a finding.** The diff and the catalog come first. If they can't settle a specific finding, you may read what that finding needs, and nothing else:
   - the exemplar, to see whether the new code really differs
   - a function the diff calls, to see what it already does
   - sibling files in the same folder, to apply the neighbour rule

   The test is whether the reading answers a question about a specific finding. Searching to find out what the conventions are doesn't pass it: that's Create's and Update's job. A finding settled this way names what was read ("Checked against `src/web/services/updateVisit.ts`").
6. **Check the exemplars** of the rows assigned in step 3: does each path still exist (`git ls-files <path>`)? If the diff changed an exemplar, does it still show the pattern? If the diff contains the first implementation of a Planned pattern, note it as an exemplar candidate. All of these go under Catalog problems, not Fix or Decide.
7. **Report** in the format below.

**Every finding points to a catalog entry:** a placement row, a Paradigm or Patterns line, a Don't copy or Don't introduce entry, a scenario row, an Open decisions entry or a Style rule. A Not item points to its Don't copy or Don't introduce entry, so it's never an entry of its own. Anything convention-like you notice outside the catalog, such as an unlisted helper the new code could have used, goes under **Also noticed** as a lead for Update. It never goes under Fix or Decide, so repeat runs agree on the findings.

When Check runs at the end of your own feature work, the report goes back to that task. Fix the code for the Fix items you're sure of, as part of the feature, and tell the user what you changed. Decide items, and anything that needs the catalog changed, are the user's call: list them and ask.

## Categories

| Category | Default | "update" means |
|---|---|---|
| Wrong placement | Fix | change the placement table |
| Uses a Don't copy pattern (including Don't introduce) | Fix | remove the entry: the team has changed its mind |
| Reinvented pattern | Fix | accept it as a variant |
| Pattern not followed in full | Fix | take the part out of the row or its note, or accept its absence as a variant |
| Documented pattern, wrong situation | Fix | clarify the "use when" note |
| New pattern for a documented scenario | Decide | accept it as a variant, with its trade-off; for an Approach finding, change the Paradigm or Patterns line |
| Open decision taken | Decide | settle it this way: fill the row with this approach and remove the Open decision |
| No precedent | Decide | add the scenario to a capability (or a new one) |
| Style not followed | Fix | change the rule |

- **Report a root cause once.** When several catalog entries fire on the same lines for the same cause, report one finding, in the earliest of their categories in the table, and name the other entries it breaks in its reason line (in Why it matters, for a Decide item). Code in a new folder can break a placement row, a scenario row and the Don't introduce entry for new folder conventions at once: that's one finding. Different causes on the same lines are separate findings, such as a new Redux action and a mutation service without its query invalidation in the same file. A catalog entry is a placement row, a Paradigm or Patterns line, a Don't copy or Don't introduce entry, a scenario row (with its pattern note), an Open decisions entry or a Style rule.
- **One finding may span several files** when they share the cause. List every file and line range in the location.
- ***Open decision taken*** offers two choices: **Settle it this way** (Update fills the row with this approach and removes the Open decision) | **Hold until the team decides** (the row stays open, and the code may change once the team decides).
- **Defaults are where a finding goes.** If you aren't sure a Fix-default finding is real, put it under Decide, keep its category, and say what would settle it. Don't guess.
- **For a new pattern,** say whether you think the new approach is better, worse or a reasonable trade-off, and why. "Different from the catalog" isn't automatically wrong.

## Report format

Output these parts in this order, and leave out any that are empty:

1. **Header:** two lines. Line 1: the scope and counts, naming the default branch as found ("merge base with `<branch>`"). Line 2: the scenario assignments, as area › capability › scenario, with the file name in brackets. Group the "not listed, follows neighbours" files into a count.
2. **Fix:** findings where the code should change, ordered by category as in the table.
3. **Decide:** findings that need the user's choice, ordered by category as in the table.
4. **Catalog problems:**
   - exemplars that moved, were deleted or drifted
   - exemplar candidates for Planned patterns
   - changed files outside every area's paths
5. **Also noticed:** leads for Update and problems outside the catalog, one line each.
6. **Closing line:** fixed, as in the example. Leave it out if there are no Fix or Decide items.

Each finding has:

- **First line:** what was done → what to do, ` · ` the location (every file and line range, for a finding that spans files), ` · ` the category in italics. For Decide items, the first line names the situation instead of a fix.
- **Decide items** put the choices in bold on their second line, separated by ` | `, each with its consequence in brackets.
- **Reason** (Fix items): one unlabelled line, as short as possible: which catalog entry, any other entries the same cause breaks, and what the code does instead.
- **Why it matters:** required. What the catalog says, what the code does, and the consequence.
- **Trade-off:** required for Decide items. Your view: better, worse or a reasonable trade-off, and where.
- **Suggested action:** the exemplar to model the fix on, and what to keep. When the Don't copy entry's replacement is an Open decision, say to ask, and link the Open decision. Don't invent a replacement. For Decide items, what Update would record if accepted.

Each labelled block is two or three sentences at most. Number findings continuously across Fix and Decide. Paths are repo-relative; use the file name alone when no other changed file shares it. No preamble, narration or summary outside these parts.

If there are no findings, line 1 of the header ends **Nothing to fix or decide.**, followed by line 2 and any Catalog problems or Also noticed.

### Worked example

Diff: five files on a branch. `src/integrations/mailer/sync.ts` (new) syncs mailing-list contacts; `src/web/visits/RescheduleForm.tsx` (new) lets a customer move a visit; `src/web/visits/RescheduleButton.tsx` and `src/web/visits/VisitList.tsx` (changed) open the form; `scripts/seed-demo.ts` (changed) adds demo visits. The catalog is `example-patterns/`.

- `sync.ts` falls in API (`src/**`, except `src/web/**`). Its job is calling an external API, so it gets the "Call an external API" row. It calls `fetch` directly inside its own retry loop, which the row's Not column lists as "direct `fetch` with manual retries". So it's a *Uses a Don't copy pattern* finding against that item's Don't copy entry, not a reinvented pattern.
- `RescheduleForm.tsx` falls in Web app. Submitting it changes data, so it gets "Change data from a component", whose note says every write goes through a mutation service. It calls a server action, which is a named framework feature, so it's a *New pattern for a documented scenario*. To judge the trade-off, the agent reads the exemplar `updateVisit.ts` and finds the cache invalidation the server action skips.
- The button and list changes follow their neighbours. `seed-demo.ts` is outside every area's paths, and follows the scripts beside it.
- A comment in `sync.ts` mentions `src/lib/backoff.ts`, a retry helper the catalog doesn't list. No catalog entry covers it, so it isn't a finding: it goes under Also noticed.

```markdown
**Patterns check:** 5 changed files vs `a1b2c3d` (merge base with main). **1 to fix, 1 to decide.**
Scenarios: API › External integrations › Call an external API (`sync.ts`) · Web app › Reading and changing data › Change data from a component (`RescheduleForm.tsx`) · not listed, follows neighbours (3 files).

## Fix
1. Direct `fetch` with a hand-rolled retry → use `HttpClient` · src/integrations/mailer/sync.ts:30–58 · *Uses a Don't copy pattern*
   External integrations › Don't copy: direct `fetch` with manual retries. This calls `fetch` in its own retry loop.
   **Why it matters:** the catalog says to call external APIs through `HttpClient`, and lists this approach as having no tracing or shared retry policy. This loop retries on every status, including 4xx, and its calls won't show up in traces.
   **Suggested action:** replace the loop with `HttpClient.post()`, modelled on `src/integrations/stripe/client.ts`. Keep the payload mapping in lines 22–28 as it is.

## Decide
2. Server action for a form submit · src/web/visits/RescheduleForm.tsx:12 · *New pattern for a documented scenario*
   **Accept as variant** (mutation services stay the default) | **Fix the code** (use `updateVisit` from the mutation service row)
   **Why it matters:** the catalog says to change data from a component through a mutation service. This calls a server action directly.
   **Trade-off:** less code, and the form works without JavaScript. But it skips the service's cache invalidation, so the visit list stays stale until a reload. A reasonable trade-off for standalone forms, worse anywhere a list shows the same data. Checked against `src/web/services/updateVisit.ts`, which does the invalidation.
   **Suggested action:** if accepted, Update records it as an accepted variant: "Server actions for standalone forms with no cached list of the same data."

## Catalog problems
- `scripts/seed-demo.ts` is outside every area's paths. Add `scripts/**` to the API area, or a new area?

## Also noticed
- `src/lib/backoff.ts` looks like a shared retry helper, but the catalog doesn't list it. A lead for Update.

Reply with a number and "update" to change the catalog instead of the code (e.g. "1 update").
```

## After the report

Wait for the user's choices. Collect every finding they mark "update", every Decide item resolved towards the catalog, every Catalog problem and every Also noticed lead they want followed up, and offer to run Update with them. Pass each one with its category, location, the catalog entry it points to, and the choice. Don't change the catalog from within Check.
