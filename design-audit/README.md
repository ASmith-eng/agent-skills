# Design Audit

[![Node.js: required](https://img.shields.io/badge/Node.js-required-5FA04E?logo=nodedotjs&logoColor=white)](#requirements)
[![ripgrep: required](https://img.shields.io/badge/ripgrep-required-blue)](#requirements)
[![Git: optional](https://img.shields.io/badge/Git-optional-lightgrey?logo=git&logoColor=white)](#requirements)

An AI agent skill that audits a page or component against your project's `DESIGN.md` and reports what doesn't match: off-token colors and spacing, the wrong status chips, misplaced actions, missing empty and error states, and accessibility failures.

You write the design rules once in `DESIGN.md`, and this skill checks your code against them. You get the same scored report every time, so you know what to fix first and whether a page is getting better or worse.

## What it's for

- **Auditing an existing page or component** against your design spec, in any HTML/CSS/JavaScript project: React, Vue, Svelte, Angular, plain HTML, Bootstrap, Tailwind, MUI, Chakra and others.
- **Prioritising fixes.** Every finding has a severity, a `file:line` location, the rule it breaks, quoted from your spec, and the fix.
- **Keeping a record.** Audits can be saved alongside your documentation with the branch and commit they were run against, so you can compare audits over time.

## What it's not for

- **Writing or changing your design rules.** The skill reads `DESIGN.md` and never adds rules of its own. If you don't have a spec yet, write one first, by hand or with a skill like [manage-design-scheme](../manage-design-scheme).
- **Fixing the code.** It reports findings and suggested fixes; applying them is up to you or your agent.
- **Testing in a browser.** It audits source code only. It doesn't start a dev server or take screenshots, so final sign-off still needs someone to use the page.

## Why use it

**Your spec is the only authority.** Every finding quotes the rule it breaks from your `DESIGN.md`. If your spec has a token block in its front matter, any color, size, radius, spacing or shadow value not in that block is reported.

**It's repeatable.** Mechanical checks (search patterns for each stack) run first, so their results are facts, not opinions. The judgement checks then run in a fixed order, so two audits of the same page are comparable.

**The report is easy to act on.** It has the same parts every time:

- a score out of 10, with the counts behind it
- a short triage table, worst first
- a detail block for each finding, with the rule and the fix
- shared-layer issues listed separately, so a defect in a shared button doesn't count against every page that uses it

**It checks what's easy to miss.** Every scroll region, action bar and data fetch in the page is counted and checked. That catches problems that don't show up in a quick read: a table with no error state, a footer with Cancel on the wrong side, or a default badge using up the page's one primary emphasis.

**Deviations aren't hidden.** When breaking a rule looks like the right call, the audit reports it as a judgement call and says why. That way you can update the spec instead of finding the same issue again next time. Accessibility failures are never judgement calls.

**Contrast ratios are computed, not guessed.** A bundled script checks colors against WCAG AA on the surface the text actually sits on.

## Example use cases

- *"Run a design audit on the orders page."*
- *"Audit `src/features/billing/InvoiceTable.tsx` against our DESIGN.md."*
- *"We just restyled the settings screen. Check it still follows the design system before I open a PR."*
- *"Does the checkout dialog follow our rules for action placement and button emphasis?"*

After the report, the skill offers to save it to `design-audits/` in your documentation directory (for example `documentation/design-audits/2026-08-12-1432-orders.md`). It only saves if you say yes.

## Report example

```
**6/10** — visible inconsistency. 1 blocker, 4 inconsistencies, 3 polish. Shared layer: 5 (unscored).

## This page

| # | Severity | Location | Issue |
|---|---|---|---|
| 1 | blocker | OrderStatus.tsx:6 | Shipped and Delivered share one chip family |
| 2 | inconsistency | page.tsx:228 | 12px between major blocks, spec says 24px |
| 3 | polish | page.tsx:301 | Icon is 18px, spec scale is 16/20 |

### 1. `src/features/orders/OrderStatus.tsx:6-7,14-15` — blocker
…
```

## Requirements

- **A `DESIGN.md`** in your documentation directory (`documentation/`, `docs/` or similar) or at the repo root. If the skill can't find it, it asks you where it is.
- **Node.js**, for the contrast check.
- **ripgrep** (`rg`) with PCRE2 support, for the mechanical checks. The official release binaries include PCRE2.
- **Optional:** Git, to record the branch and commit in saved audits.
