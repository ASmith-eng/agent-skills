# Update (reconcile)

Bring an existing glossary up to date with the code, apply findings passed on from Check, and settle open decisions. The glossary is the baseline: people edit it by hand, so everything in it is intentional until the user says otherwise.

## Workflow

1. **Read INDEX.md and every group file in scope, in full.** Then read `schema.md`. You need it to keep the frontmatter valid.
2. **Check the schema version.** If any file uses an older `schema` than the one in `schema.md`, propose the migration as part of this Update (below). If a file uses a newer one, stop and tell the user the skill is out of date.
3. **Ask about scope:**
   - the whole glossary or specific domains
   - whether to settle Open decisions
   - whether to apply findings passed on from Check, if there are any
4. **Find what changed** since the last reconcile, limited to the scope:

   ```bash
   git diff --stat <reconciled_at>..HEAD -- <scope paths>
   git diff <reconciled_at>..HEAD -- <scope paths>
   ```

   If `reconciled_at` is missing, or the commit no longer exists (history rewritten or squashed), fall back to a full comparison of the scope, and say so.
5. **Run the integrity check:** `node <skill-dir>/scripts/glossary-check.js --integrity --json`. Without Node, check these by hand:
   - every file's frontmatter follows the subset in `schema.md`
   - every `code` identifier is still found outside the glossary (`git grep -w <id>`)
   - every `reserved_by` names a group that exists
   - every `paths` glob matches at least one file
   - every term index link points to a group file and uses its `group` name, and every group file is linked
6. **Compare against the code** for the scope:
   - **New entities** not in the glossary: models, tables and types added since `reconciled_at`. Use `discovery.md` to find them in this stack.
   - **`code` identifiers that no longer exist:** find what they became (`git log -S'<id>' --oneline <reconciled_at>..HEAD -- . ':(exclude)<glossary dir>'`, then read the commit's diff). A rename usually means updating `code`, and maybe adding the old name as a lost variant.
   - **Avoid and reserved terms in code added since the last reconcile:** run `--diff <reconciled_at> --json` and judge the candidates as Check does (`check.md`, step 4). Each real one is drift. Ask whether the code should change (outside this skill) or the decision should.
   - **Term index entries that no longer match the group files,** and terms in group files missing from the index.
   - **`paths` globs that match no files,** or that miss where the group's code now lives.
   - **Findings passed on from Check.**
   - **Open decisions** the user chose to settle. Read `questions.md` before asking.
7. **List the differences** and let the user decide each one:
   - **Update the glossary:** the code reflects a real change.
   - **Keep it as it is:** the glossary is still right. Nothing is recorded; bringing the code back in line is separate work.
   - **Mark undecided:** move it to Open decisions, or replace the entry with `Not yet defined — ask before inventing.`

   Show the evidence for each (counts, locations, commits), the same way `questions.md` does, and batch the decisions in the same way.
8. **Apply only approved changes,** as targeted edits. Leave every other line exactly as written, including wording you'd have written differently and sections that aren't in the template. Keep the frontmatter in the YAML subset. Then review whether the watch list is still right: propose additions for new collisions, and removals for entries that no longer cause problems.
9. **Set `reconciled_at`** to `git rev-parse --short HEAD`, but only if the whole glossary was reconciled. If the scope was partial, ask whether to set it. Setting it after a partial run hides changes in the parts you didn't look at from the next Update.
10. **Run the integrity check again** and fix anything structural your edits caused.

Update follows the same writing rules as Create (`template.md`): the glossary states current decisions only, with no change log, dates or "renamed from…" notes outside Avoid reasons.

Finish with one line per change applied, the integrity result, and a reminder that the change should go through the team's normal review.

## Applying Check findings

| Choice from Check | Edit |
|---|---|
| Update: add to `allow` | Add the identifier to the `allow` list of that Avoid entry, in the group that holds it. |
| Update: change the decision | The Avoid term is now accepted. Remove the entry, add the term to the right group, and decide (with the user) whether the old winner becomes a lost variant. |
| Update: add it to the glossary | Add the term to an existing group, or create a new group file from `template.md`. Then add it to the term index, and propose `paths` and any reserved terms. |
| Update: change the rule | Edit the naming rule in INDEX.md, keeping one example. |

## Schema migration

Migrating changes the format, not the decisions, so do it as a separate step from reviewing changes in the code. Show the user the migrated files, get approval, write them, run the integrity check, then continue with the review.

- Rewrite each file's frontmatter in the current version, following the migration notes in `schema.md`, and set its `schema`.
- Keep every decision, reason, allow entry and line of prose. If a field has no equivalent in the new version, ask the user before dropping it.
