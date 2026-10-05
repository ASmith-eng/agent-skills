---
name: design-spec
description: Write or update a project's DESIGN.md — the design-system spec (color, typography, spacing, components, interaction, accessibility, voice) that keeps developers and AI agents building UI consistently. Works for any HTML/CSS/JavaScript project or framework (React, Vue, Svelte, Angular, plain HTML, Bootstrap, Tailwind, MUI…). Builds the spec from a reference screen in the codebase or a running URL, a mockup (HTML/CSS prototype, SVG, design-token JSON, Figma), structured questions, or any mix. Use this whenever someone wants to document their UI/UX rules, create a design system doc, capture "how our app should look", write design guidelines for agents, or bring an existing DESIGN.md back in line with the current design — even if they don't say "DESIGN.md". Not for auditing code against a spec or for designing a new look.
---

# design-spec

Produce a `DESIGN.md`: a single document that states how a product looks and behaves, so everyone building its UI - people and agents - make the same choices without re-deciding them.

## The golden rule: describe, don't design

This skill records decisions the user has made. It never makes aesthetic decisions for them.

Why: the spec becomes the authority for agents to follow. A color or font you invented to fill a gap becomes indistinguishable from a real decision, and every developer/agent downstream will build on it. Leaving a visible gap is a more useful description of the current state of the approved design choices than a sensible assumption.

So:

- **Don't propose** colors, fonts, sizes, spacing, radii, shadows, component styles, or layout choices. Not as defaults, not as "e.g.", not as a recommended option.
- **Don't infer** components or values the sources don't show. A reference view with no dialog says nothing about dialogs.
- **Mark gaps** with exactly `Not yet defined — ask before inventing.` That line tells future agents to ask instead of guessing.
- **If the user asks for suggestions**, that's their decision — help them then.

The exception is the part that isn't taste: **accessibility requirements and established UX practices**. Those you include and recommend firmly, because they're about whether people can use the product, not how it looks. See `references/core-practices.md`.

## Modes

- **Create** — no `DESIGN.md` yet; write one.
- **Update** — a `DESIGN.md` exists and the design has moved on; bring it up to date, changing only what the user approves.

Before anything else, look for an existing spec (`documentation/DESIGN.md`, `DESIGN.md`, `docs/DESIGN.md`, or any `DESIGN.md` in the repo). If one exists and the user asked to create, say so and offer Update instead. Never overwrite an existing spec.

Auditing code against the spec is out of scope — this skill only ever changes `DESIGN.md`. If the user wants code checked or fixed, point them to a design audit/review skill if one is available.

## Inputs

The user can give any mix of three sources. Ask which they'll provide (they can add more later):

1. **A reference view** — a screen in the codebase (route/component) or a running URL that shows the intended design.
2. **A mockup file** — HTML/CSS prototype, SVG export, design-token JSON (W3C DTCG or Tokens Studio), or Figma via the Figma Dev Mode MCP server.
3. **Questions** — you ask, they answer.

**Images and PDFs** (screenshots, PNG/JPG exports, PDF mockups) are declined: values read from them are approximate and the spec needs exact ones. Say so briefly, list the accepted formats, and offer the codebase or questions as alternatives. Don't extract values from the image anyway.

**When sources disagree** about the same thing, show both values and ask which is right. Don't pick.

## Create workflow

Read each reference file at the step that names it, not all at once at the start. A run that doesn't need a file shouldn't read it.

1. **Check for an existing spec** (see Modes).
2. **Ask which sources** the user will provide.
3. **Read the sources.** If there's a reference view or mockup, read `references/token-discovery.md` first. With questions only, skip this step. Keep a working list of what's settled, by spec section.
4. **Ask about the rest.** Read `references/questions.md`, then ask only about what the sources didn't settle, in small batches, neutrally, always accepting "Undecided".
5. **Resolve conflicts** between sources with the user.
6. **Ask about departures.** Read `references/core-practices.md`, briefly list its tier 2 UX practices and ask whether the product deliberately does any of them differently.
7. **Draft the spec.** Read `references/template.md` and `references/example-DESIGN.md`, then draft following the template, modelled on the example for depth and tone. Fill the Accessibility section from tier 1, weave tier 2 practices into their sections, and record tier 3 conventions only as decided.
8. **Check contrast** (below) and report any failures to the user.
9. **Lint** (below) and fix anything structural.
10. **Confirm the location and write.** Default: `documentation/DESIGN.md` if a `documentation/` directory exists, otherwise `DESIGN.md` at the repo root. Confirm before writing.
11. **Offer the wiring** (below).

## Update workflow

The existing `DESIGN.md` is the baseline; respect it. People edit it by hand, so anything they wrote is intentional until they say otherwise.

1. **Read the existing spec** in full, then `references/template.md`, which you need to keep its format and the undecided marker right.
2. **Ask what to review** — all sections (default) or specific ones — and which sources to compare against (same three as Create).
3. **Read the sources** for the sections in scope. For a reference view or mockup, read `references/token-discovery.md` first.
4. **List the differences.** For each: the section, what the spec says now, what the sources show. Only real differences — a value written differently but equal (`#FFF` vs `#ffffff`) isn't one.
5. **Let the user decide each one:**
   - **Update the doc** — the new design is intended.
   - **Keep the doc** — the spec is still right; nothing is recorded (getting the code back in line is an audit job).
   - **Mark undecided** — replace the entry with the marker.
6. **Offer to settle existing gaps** — any `Not yet defined` sections — from the sources, or with questions (read `references/questions.md` only if the user wants questions).
7. **Check contrast** on any changed colors.
8. **Apply only approved changes**, as targeted edits. Leave every other line exactly as it was, including wording you'd have written differently and custom sections that aren't in the template.
9. **Lint, then confirm the token changes.** Keep a copy of the spec from before your edits and run `npx @google/design.md@0.4.0 diff <before> <after>`. The token changes it lists should be exactly the approved ones; anything else is a mistake to undo. Components that reference a changed token also show as modified (changing `primary` modifies `button-primary`); that's expected.

If the existing spec doesn't follow the Google format (for example `radius` instead of `rounded`, or a nested typography scale), point it out and offer to convert it as a separate step. Converting changes the format, not the design, so don't mix it into the review of design changes.

Update follows the same writing rules as Create: the spec states current decisions only — no change log, dates, or "updated to…" notes.

## Writing the spec

The spec follows Google's DESIGN.md format (https://github.com/google-labs-code/design.md): their front-matter schema and their section names in their order, plus our own sections for Interaction & Motion, Iconography, Accessibility and Voice & Tone. Using a shared format means other tools and agents that understand DESIGN.md can read the spec too. `references/template.md` has the exact structure.

Follow the writing rules at the end of `references/template.md`.

## Contrast check

Before writing, check every text/background pair the spec defines, plus control outlines and the focus ring:

```bash
node <skill-dir>/scripts/contrast-check.js "body=#1c1917:#ffffff" "muted=#57534e:#faf9f7" "on-primary=#ffffff:#115e59" "input-border=#78716c:#ffffff:3" "focus=#115e59:#ffffff:3"
```

Pairs are `label=FOREGROUND:BACKGROUND[:MIN]`; MIN defaults to 4.5 (text), use 3 for large text and non-text UI. Check text colors against every surface they sit on, and each status text against its own tint. Only apply 3:1 to a border when it's needed to identify a control — decorative dividers are exempt (see 1.4.11 in `core-practices.md`).

When a pair fails, report the ratio and the requirement — "muted text `#9ca3af` on `#ffffff` is 2.54:1; WCAG 1.4.3 requires 4.5:1" — and ask how they want to proceed. Don't propose a replacement color unless they ask. If they keep the value, write it as given, and add one short line to the Accessibility section stating the failure, so agents know not to rely on that pair: "`muted-foreground` on `background` is 2.54:1 and does not meet 1.4.3." Write only that line, with no history or justification.

The linter (below) also checks contrast, but only for component text and background pairs at 4.5:1. This script covers what the linter doesn't: text on each surface, and 3:1 for borders and focus rings.

## Lint

Validate the draft with Google's linter, pinned to the version this skill was tested against (the format is still `alpha` and may change):

```bash
npx -y @google/design.md@0.4.0 lint <draft>.md
```

- **Errors** (broken token references, duplicate sections) must be fixed.
- **Warnings** must be fixed, except `orphaned-tokens` on colors used only for borders, dividers or focus rings. Those are expected (see `references/template.md`).
- A `contrast-ratio` warning is a contrast failure: report it to the user the same way as above.
- Passing the linter doesn't prove the headings are right, because it treats unrecognised headings as custom sections. Check the section names and order against the template yourself.

If `npx` isn't available, say that the lint step was skipped and ask if the user wants you to check the draft against the template by hand.

## Wiring

After writing, offer - don't do automatically - to make agents read the spec only when it's relevant, so it costs nothing in sessions that don't touch UI:

- **Claude Code**: a path-scoped rule, `.claude/rules/design.md`, with globs matching this project's actual UI files:

  ```markdown
  ---
  paths:
    - "src/**/*.{tsx,jsx,css}"
  ---
  Before creating or changing UI, read `documentation/DESIGN.md` and follow it. Where it says "Not yet defined — ask before inventing.", ask the user rather than choosing.
  ```

- **Other agents**: a one-line pointer in `AGENTS.md` saying the same.

Avoid `@`-importing the spec into `CLAUDE.md` — that loads it into every session.

## Reference files

| File | What it holds | Read when |
|---|---|---|
| `references/token-discovery.md` | Where design values live in each stack and mockup format | Reading a reference view or mockup |
| `references/questions.md` | The question set and how to ask | About to ask the user design questions |
| `references/core-practices.md` | Accessibility, UX practices and conventions, by tier | Asking about departures; drafting |
| `references/template.md` | Spec structure, format rules and writing rules | Drafting; Update mode |
| `references/example-DESIGN.md` | A finished spec for a fictional product. Never copy its values. | Drafting (Create) |
| `scripts/contrast-check.js` | WCAG contrast checker, Node, no dependencies | Run it; no need to read it |
