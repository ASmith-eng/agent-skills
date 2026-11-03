# Update (reconcile)

Bring an existing catalog up to date with the code, apply findings passed on from Check, record newly decided patterns, and settle open decisions. The catalog is the baseline: people edit it by hand, so everything in it is intentional until the user says otherwise.

## Workflow

1. **Read `INDEX.md` and every area file in scope, in full.** Then read `template.md`; you need it for the format and to add anything new.
2. **Check the format version.** If `schema` in `INDEX.md` is older than the latest version in `template.md`, propose the migration as part of this Update (below). If it's newer, stop and tell the user the skill is out of date.
3. **Ask about scope:**
   - the whole catalog or some areas
   - whether to settle Open decisions
   - whether to apply findings passed on from Check, if there are any
   - whether there are newly decided patterns to record
4. **Find what changed** since the last reconcile, limited to the scope's area paths:

   ```bash
   git diff --stat <reconciled_at>..HEAD -- <area paths>
   git diff <reconciled_at>..HEAD -- <area paths>
   git log --diff-filter=A --format= --name-only <reconciled_at>..HEAD -- <area paths>   # new files
   ```

   If `reconciled_at` is missing, or the commit no longer exists (history rewritten or squashed), fall back to a full review of the scope, using `discovery.md`, and say so.
5. **Check, for the scope:**
   - **Placement:** new code that sits outside the placement table, or a new top-level folder or layer. It's either drift or a structural change to confirm.
   - **Areas and paths:** code outside every area's paths, or a new app, package or stack that may need its own area. Propose the change to the capability map.
   - **Exemplar paths:** does each one still exist (`git ls-files <path>`), and does it still show the pattern? If one moved (`git log --follow --diff-filter=R --format= --name-status -- <path>`), was deleted or drifted, suggest a replacement using the exemplar criteria in `discovery.md`.
   - **Planned patterns:** has anything implemented one since the last reconcile? If so, offer the best instance as its exemplar, and drop the Planned mark and sketch.
   - **New scenarios:** new directories, file kinds or framework features with no catalog entry. Propose the capability each belongs to, or a new capability if none fits. Propose a row only where `template.md`'s "When a row exists" allows one, as Create does.
   - **New variants:** new code that solves a catalogued scenario a different way. It's either drift or the team changing direction.
   - **Don't copy:** are the listed legacy areas gone (`git ls-files <glob>` returns nothing)? If so, offer to remove those entries, and their items in the Not cells unless they're still a plausible pick.
   - **Don't introduce:** has a listed pattern appeared in the changed code? List it as drift, or as the team changing its mind.
   - **Approach:** have the approach signals (`discovery.md`) shifted in the changed code, such as classes appearing in a functions codebase or a new kind of layer? List it as a possible change of approach to confirm, with the counts.
   - **Findings passed on from Check:** accepted variants, clarified "use when" notes, new scenarios, settled Open decisions, exemplar candidates, catalog problems and Also noticed leads.
   - **Open decisions** the user chose to settle. Read `questions.md` before asking.
6. **List the differences** and let the user decide each one:
   - **Update the catalog:** the code reflects a real decision.
   - **Keep it as it is:** the catalog is still right. Nothing is recorded; bringing the code back in line is separate work, outside this skill.
   - **Mark undecided:** move it to Open decisions, or set the row's pattern to `Not yet defined — ask before inventing.`

   Show the evidence for each (counts, locations, commits), as `questions.md` does, and batch the decisions in the same way, about 12 per session.
7. **Apply only approved changes,** as targeted edits. Leave every other line exactly as written, including wording you'd have written differently and sections that aren't in the template.
   - New rows and notes follow `template.md`'s rules: when a row exists, what the Pattern cell names, what a note may hold, and the Not column. Names are import-ready, with the module and any call shape an agent would guess wrong, and pattern-defining parts are kept.
   - When a Don't copy or Don't introduce entry is added, offer to add it to the Not cells of the rows it rivals. When one is removed, remove it from every Not cell that names it.
   - Record an accepted variant in the pattern's note (add the note if the row doesn't have one), with the trade-off and the month accepted. Its names are import-ready too, and it keeps the parts that define it.
   - When an area or capability is added, removed or renamed, update the capability map to match, including its anchors.
   - Offer to split any area file that has grown past about 300 lines.
8. **Verify the edits,** as in Create step 11: exemplar and placement paths exist, capability map globs match files, links and anchors resolve, and every Not item has a matching Don't copy or Don't introduce entry. Then run its consistency checks: imports resolve, no Don't copy or Don't introduce entry contradicts a row or style rule, every implied location is placed, and exemplars follow the catalog.
9. **Set `reconciled_at`** to `git rev-parse --short HEAD`, but only if the whole catalog was reconciled. After a partial Update, ask first: setting it would hide unreviewed changes in the rest of the catalog from the next Update.

Update follows the same writing rules as Create (`template.md`): the catalog states current decisions only, with no change log. Dates appear only on accepted variants.

Finish with one line per change applied, the verification result, and a reminder that the change should go through the team's normal review.

## Applying Check findings

| Choice from Check | Edit |
|---|---|
| Wrong placement: update | Change or add the placement table row. If it's a new layer or folder convention, confirm it's a structural decision, not a one-off. |
| Uses a Don't copy pattern: update | Remove the Don't copy or Don't introduce entry, and the item from every Not cell that names it. If the approach now becomes the pattern for a scenario, update that row and move the old pattern to Don't copy, with a reason. If a Don't introduce pattern is now part of the approach, add it to the Patterns line. |
| Reinvented pattern: update | Add an accepted variant to the pattern's note, with the trade-off and the month. If the mechanism should be reused, ask whether it moves to a shared location first; that's code work, outside this skill. |
| Pattern not followed in full: update | The team accepts the pattern without that part. Take the part out of the row or its note, or, if it may be left out only in some situations, record that as an accepted variant with the trade-off and the month. |
| Documented pattern, wrong situation: update | Rewrite the row's "Use when / notes" so this situation is clearly in or out, and check the rows it could be confused with. |
| New pattern for a documented scenario: accepted | Add an accepted variant to the pattern's note: when it applies, the trade-off and the month. If it replaces the pattern, update the row and move the old one to Don't copy and the row's Not cell instead. For an Approach finding, edit the Paradigm or Patterns line; if it's a one-off the team accepts, change nothing, because the approach lines don't record exceptions. |
| Open decision taken: settled | Fill the "Not yet defined" row with the approach, and use the new code as the exemplar if it meets the exemplar criteria. Remove the Open decisions entry. If the decision had no row, add one. |
| No precedent: add the scenario | Add a row to the capability it belongs to, or a new capability (and its capability map line). Use the new code as the exemplar only if it meets the exemplar criteria. |
| Style not followed: update | Edit the rule where it lives, cross-cutting or in its capability, keeping one example. |
| Catalog problem: exemplar | Replace the path, or offer the Planned pattern's first implementation as its exemplar. |
| Catalog problem: outside every area | Extend an area's paths, or propose a new area. |
| Also noticed lead | Treat it as a new scenario or variant: gather the evidence (counts, recency) and ask, as above. |

## Recording a newly decided pattern

When the team has decided a pattern, whether or not anything uses it yet:

1. Ask which area and capability it belongs to, and what it replaces, if anything.
2. If something already uses it, find the best exemplar (`discovery.md`). If nothing does, it's Planned: draft the row and a note with a short sketch and a reference from the user's description. Make the names import-ready, and keep its pattern-defining parts.
3. If it replaces an existing pattern, move the old one to Don't copy with a reason, and name it in the row's Not cell.
4. Show the drafted rows and notes, and apply them once approved.

When the team rejects a pattern for the codebase, or stops rejecting one, add or remove the Don't introduce entry. Draft the reason and the "instead" for a new entry, and the rows whose Not cells should name it, and show them for approval as above.

## Format migration

Migrating changes the format, not the decisions, so do it as a separate step from reviewing changes in the code. Show the user the migrated files, get approval, write them, verify them, then continue with the review.

- Restructure each file to the current version, following the version notes in `template.md`, and set `schema`.
- Keep every decision, reason, exemplar, accepted variant and line of prose. If something has no place in the new format, ask the user before dropping it.
