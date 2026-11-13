# Create

Write a new glossary. Follow the principles in `SKILL.md` throughout.

## Workflow

1. **Check for an existing glossary.** Look for `conventions/glossary/INDEX.md` under the project's docs directory, and for any other file that looks like a glossary or naming conventions doc. If a glossary in this format exists, say so and offer Update. Never overwrite one. If there's an older doc in another format, it's a source for discovery. Ask whether the new glossary should replace it.
2. **Agree the scope.** Ask whether to cover the whole codebase or a domain or directory. On a large codebase (many domains, or more entities than you can classify in one session), recommend scoping, starting with the domain where naming problems happen most.
3. **Discover.** Read `discovery.md` and work through its sources for the scope. Keep a working list of findings: each term, its code names with counts and locations, its business name, and anything that conflicts.
4. **Classify** each finding (below).
5. **Ask about decisions.** Read `questions.md`, then ask in batches.
6. **Confirm the groups and their paths.** Propose the groups: families of entities that share paths, are changed in the same features, or flow into each other (`template.md` says what belongs together). For each, list its entities and propose `paths` globs from where its code lives. The user corrects both in one step. Leave `paths` empty for families that span the codebase (the users of the system). Paths matter: reserved terms between groups are only flagged inside them.
7. **Draft and get approval.** Read `template.md` and the files in `example-glossary/`, then draft every file in full. Model the depth and tone on the example, but never copy its terms. Show the user the whole draft:
   - Consistent findings are listed compactly so the user can scan them.
   - Decisions are shown as made, and Avoid reasons as drafted.
   - The watch list is proposed from the confirmed collisions and the conflicts with the most impact.

   The user corrects anything, then approves. Their corrections are decisions too, so don't argue them back.
8. **Confirm the location and write.** Default: `documentation/conventions/glossary/`, or `conventions/glossary/` under the project's docs directory (`docs/`, `doc/`, …). If there's no docs directory, ask. Set `reconciled_at` to `git rev-parse --short HEAD`.
9. **Run the integrity check:** `node <skill-dir>/scripts/glossary-check.js --integrity`. Fix anything structural it reports (frontmatter, term index links). If a `code` identifier isn't found, you recorded it wrong, so check the spelling in the code. If a `paths` glob matches nothing, fix the glob. Without Node, do the same checks by hand (`update.md` lists them).
10. **Offer the wiring** (below).

## Classifying findings

| Bucket | Example | Action |
|---|---|---|
| Consistent | `Invoice` everywhere, in code and UI | Record. Show it in the draft; don't ask. |
| Conflicting | `Client` (12 files) vs `Customer` (40 files) for the same thing | Ask the user to choose. Losers become Avoid entries with a reason. |
| Collision | "Order" (purchase) and "Fulfilment" (service progress) could both describe a booked service | Ask the user to confirm they stay separate. Each becomes a reserved term in the other's group. |
| Only the user knows | What "Round" means to the business; whether `Account` is deprecated | Draft an answer from the evidence and ask the user to confirm or correct it. |
| No evidence | A term in docs but not in code, with no definition | Gap marker, or ask if it matters. |

**Expect many conflicts.** On a messy codebase, rank them by impact (how many files use each variant, and whether the term crosses domains) and ask about the top ones. Collisions come first, because they cause the most harm. Aim for about 12 decisions per session (three batches of four). The rest go under Open decisions for a later Update. The user can ask to keep going.

**"Both are right" is a valid answer** only with a rule for when each applies. If they're two concepts (`Customer` for the billing entity, `Client` for the API consumer), they're two entries, not synonyms, and each probably reserves the other's word. If it's one concept named differently by layer (`customer` in backend code, `patient` in frontend code), record the rule under Naming rules and add each word as a lost variant with `only_in` set to the layers where it's wrong (`schema.md`).

**Reasons for Avoid entries:** draft the reason from the evidence ("legacy name, only in `legacy/`, last touched 2023") and let the user correct it while reviewing the draft. Don't spend a question on it.

**Business names** go in the group body. Add them as lost variants ("UI-only name") only when there's evidence they leak into code, or the user says they shouldn't be used there.

**Collisions between groups become a pair of reserved terms.** If "order" (Bookings) and "fulfilment" (Service delivery) are confirmed separate:
- Service delivery's `avoid` gets `term: order, reserved_by: Bookings`.
- Bookings' `avoid` gets `term: fulfilment, reserved_by: Service delivery`, plus the Fulfilment business name ("job") if it's a risk there too.

Add an `allow` entry for each identifier in the group's paths that contains the word but is fine (`sortOrder`, `orderBy`). Find them with `--paths` on the group's own paths before writing. The owning group's own `code` identifiers are allowed automatically (`schema.md`). If `--paths` flags many of the group's own compound names (`customerProtocolId` when "protocol" is reserved), the reserved term costs more than it catches. Drop it and rely on the watch list and Check's mentions.

**Collisions inside one group** (two of its entities share a word, like a Protocol and a patient's assigned CustomerProtocol) can't be reserved terms, because both sides share the group's paths. Put them on the watch list, and make each entity section say which one the word means.

## Wiring

After writing, offer these. Don't apply them automatically.

- **Docs index:** if `documentation/INDEX.md` (or the project's equivalent) exists, add an entry under a Conventions section, creating that section if needed.
- **CLAUDE.md or AGENTS.md:** offer one line:

  > When you finish a feature, offer to run the `manage-glossary` skill's Check mode on your changes.

The glossary works as a sweep after the feature, like a linter. Don't tell agents to read it before they start: that costs tokens on every task, and Check catches what matters in the diff. Don't copy the watch list into CLAUDE.md either. It stays at the top of INDEX.md, where Check reads it, so there's one copy to maintain.

## Finish

End with:
- one line saying where the glossary was written
- how many groups and terms it has, and how many open decisions remain
- the integrity check result

Then ask the closing question: *"Are there any terms being phased out, or business terms I won't find in the code?"* If the answers change the glossary, show the change and get approval before editing.

Remind the user that the glossary should go through the team's normal review, such as a PR, because the decisions belong to the team.
