---
name: design-audit
description: Run a design audit on a page or component — check its source against the project's DESIGN.md for spacing, color, typography, status chips, action placement and accessibility, and report scored findings. Works for any HTML/CSS/JavaScript project or framework (React, Vue, Svelte, Angular, plain HTML, Bootstrap, Tailwind, MUI…). Use when asked to audit, review or check the visual design of an existing page against the design system, e.g. "run a design audit on the orders page". Reviews source code, not a running app.
---

# Design Audit

Audit a page against the project's `DESIGN.md` and report findings in a fixed shape.

Paths to this skill's own files (`references/…`, `scripts/…`) are relative to this skill's directory. Paths in findings are relative to the project's repo root.

## 0. Find the spec

Look for `DESIGN.md` in these places, in order:

1. the project's documentation directory, `documentation/DESIGN.md` or whatever the project calls that directory (`docs/`, `doc/`, `memory-bank/`…)
2. the repo root, `DESIGN.md`

If it isn't in either place, ask the user where it is. Don't audit without a spec.

The spec is the only authority. This skill contains no design rules: read the rules there, cite them, and never restate them from memory. If the spec has YAML frontmatter, treat it as a **token allowlist**: any color, size, radius, spacing or shadow value in the code that isn't in that block is a finding.

Review the source only. Don't start a dev server or take screenshots.

## 1. Scope

Identify the project's stack (framework and styling system), then read `references/stack-checks.md`. It says how to follow the page's files, where the shared primitives live, and which checks to run for that stack.

Starting from the target page or component, follow its imports, templates and stylesheets to build the set of files it renders. Stop at the project's shared UI primitives and theme. Say which folder or file you treated as the shared layer.

A finding belongs to **this page** if its fix lands inside the target feature directory. It belongs to the **shared layer** if the fix lands anywhere else: shared primitives, the theme, global stylesheets or another feature.

## 2. Mechanical checks

Run these first. Their hits are facts, and re-running them gives the same answer every time. Use the patterns in `references/stack-checks.md` for every styling system the page uses, scoped to the files from step 1. They look for:

- hard-coded colors (hex, `rgb()`, `hsl()`, `oklch()`)
- one-off sizes and spacing outside the scale
- raw palette values where a semantic token exists
- radius and shadow values
- scroll regions and width constraints
- action bar and footer alignment
- icon sizes, and components used without an explicit variant

Check every hit against the allowlist before reporting it. Text colors below the spec's contrast floor are always a finding.

Three checks need a judgement attached to each hit, not just a token comparison:

- **Every scroll region: say what happens on the wide axis.** A region that scrolls vertically with no horizontal rule pushes wide content's scroll to the page. A min or max width on an overlay may be overriding the primitive's own viewport clamp.
- **Every action bar and dialog footer: name the left cluster and the right cluster.** End-aligning the whole footer puts escape actions in the forward cluster.
- **Every component used without an explicit variant: open the primitive or theme and resolve what its default renders as.** A default that renders as a solid primary fill uses up the view's one primary emphasis, even though the word "primary" appears nowhere in the code.

## 3. Judgement checks

These rules need reading, not matching. Evaluate them in this order. A fixed order is what makes two audits of the same page comparable.

1. one primary emphasis per view, and one primary per action bar
2. button vs link: does a control that navigates have button styling?
3. action placement and alignment (forward/commit right, escape left, destructive separated)
4. text casing as the spec defines it
5. chip semantics vs the state actually being displayed
6. density and vertical rhythm, including table row height computed from cell padding
7. empty, loading and error states in **every** region of the view: table, pagination, filters, toolbar. A region that stays silent while its neighbour shows a skeleton is a finding, and so is any fetch in scope with no failure path.
8. responsive behavior, especially horizontal overflow
9. microcopy: specific, action-oriented, and naming what it acts on

## 4. Output

Output exactly these parts, in this order: score line, index table, detail blocks, shared layer, judgement calls, counts line, footer. Nothing else: no summary of the design system, no preamble, no step narration.

```
**6/10** — visible inconsistency. 1 blocker, 4 inconsistencies, 3 polish. Shared layer: 5 (unscored).

## This page

| # | Severity | Location | Issue |
|---|---|---|---|
| 1 | blocker | OrderStatus.tsx:6 | Shipped and Delivered share one chip family |
| 2 | inconsistency | page.tsx:228 | 12px between major blocks, spec says 24px |
| 3 | polish | page.tsx:301 | Icon is 18px, spec scale is 16/20 |

---

### 1. `src/features/orders/OrderStatus.tsx:6-7,14-15` — blocker

Shipped and Delivered both render the success chip. The spec gives in-transit states their own family.

**Rule:** "<quoted line from the spec>"
**Fix:** `<the change, using the spec's tokens>`

### 2. `src/features/orders/page.tsx:228` — inconsistency

…

## Shared layer

These fixes land outside the target directory. They're listed and unscored, and out of scope for this audit.

| Severity | Location | Issue |
|---|---|---|
| blocker | src/components/ui/dialog.tsx:79 | Footer end-aligned, so Cancel sits in the forward cluster |

## Judgement calls

- `src/features/orders/page.tsx:88` — deviates from "<rule>", and may be correct because …

Files read: 11. Scroll regions: 3. Action bars / footers: 2. Data fetches: 4.

> Source-only audit. Final judgement needs the page loaded in a browser and interacted with.
```

### Rules

- **Use the table to triage and the blocks to act.** Blockers and inconsistencies get both a row and a block. Polish gets a row only, with no block.
- **Findings are one flat list, worst first.** Don't group them by spec section; that leaves the reader to work out priority themselves. A row's `#` is its block's number.
- **Keep the table narrow.** The `Location` cell is filename and line only; the block heading carries the full path. `Issue` is one line of about 60 characters that states the defect, with no rule quote and no fix.
- **One finding per fix.** If the same fix applies to many lines of one file, report it once and list the lines in the block heading.
- **Paths are repo-relative**: `src/features/x/page.tsx:42`, never an absolute path.
- **Counts are required.** Each count covers something whose omission wouldn't show in the findings: a scroll region you never opened, an action bar you never checked, a fetch whose failure path you never traced. Counting them forces you to list them all.
- **Never state a contrast ratio you didn't compute.** Resolve classes, variables and theme values to hex, then run the helper from this skill's directory. The last argument is the surface:

  ```bash
  node scripts/contrast.js "#3b82f6" "#d97706" "#ffffff"
  ```

  Use the surface the text actually sits on. A white card and a tinted background give different results: `#737373` on `#f8fafc` is 4.53:1, only just above the line. If you can't compute a ratio, report the violation and the offending color without a figure.

### Severities

| Severity | Meaning |
|---|---|
| `blocker` | broken layout, accessibility failure, wrong semantic mapping |
| `inconsistency` | off-token value, casing, off-scale spacing |
| `polish` | noted, never scored |

### Score

Score 1–10 against these bands, and print the raw counts beside the score:

| Band | Meaning |
|---|---|
| 9–10 | No blockers, no inconsistencies. Trivial polish at most. |
| 7–8 | No blockers. A few inconsistencies that don't get in the way of use. |
| 4–6 | Inconsistency visible at a glance or throughout, or one contained blocker. |
| 1–3 | Multiple blockers, or any blocker that breaks layout or accessibility on the main path. |

Any blocker caps the score at **6**. Score only the `## This page` findings. Leave shared-layer items out, or every page would lose points for the same shared defect.

### Judgement calls

Some deviations are right. The spec is a living document, its rules can conflict, and following a rule to the letter can produce a worse screen than the one the rule exists to prevent.

When a deviation looks defensible, still report it. Put it under `## Judgement calls` with the rule it breaks and why breaking it may be better; never leave it out.

- Only `inconsistency` and `polish` items can go here. A blocker is always reported as a blocker.
- Accessibility rules are never judgement calls.
- Entries are unscored and don't change the counts. Moving an item here can't improve the score.

If a deviation is genuinely right, the spec should change. This section is how that feedback gets back into the spec.

## 5. Offer to save

After presenting the audit, ask whether to save it. Don't save without asking: an audit the user disagrees with shouldn't end up on disk as a record.

Save to `design-audits/` in the project's documentation directory (`documentation/design-audits/` or the project's equivalent). If the project has no documentation directory, ask the user where to save.

Save **only the audit itself**, from the score line through the footer, exactly as presented. Add no commentary, recommendations or next steps.

Name the file `YYYY-MM-DD-HHMM-<scope>.md`, where scope is the feature or page audited (for example `2026-08-12-1432-orders.md`).

Get the header values by running these commands; don't recall them:

```bash
date +'%Y-%m-%d %H:%M'
git rev-parse --abbrev-ref HEAD
git rev-parse --short HEAD
git status --porcelain
```

The file starts with a header, followed by the audit unchanged:

```markdown
# Design audit — orders

**Date:** 2026-08-12 14:32
**Scope:** src/features/orders/page.tsx
**Branch:** feature/order-history
**Commit:** a1b2c3d

---

<the audit, verbatim>
```

The commit is what makes the audit reproducible: every `file:line` in the findings only means something against the tree that produced it. If `git status --porcelain` prints anything, the working tree is dirty, so say so on the commit line (`a1b2c3d (uncommitted changes)`), because the findings then describe code that isn't in any commit.

## Reference files

| File | What it holds | Read when |
|---|---|---|
| `references/stack-checks.md` | How to scope a page, where the shared layer lives, and check patterns for each stack | Step 1 |
| `scripts/contrast.js` | WCAG contrast checker, Node, no dependencies | Run it; no need to read it |
