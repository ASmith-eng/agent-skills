# Core practices

Three tiers, each treated differently in the spec:

| Tier | In the spec |
|---|---|
| 1. Accessibility | Always included, as requirements. Cite the WCAG 2.2 criterion. |
| 2. UX practices | Included by default. An exemption the user asks for is written as a plain rule in the relevant section. |
| 3. Conventions | Never assumed. Ask (questions.md, group 8) and record only what is decided. |

Tiers 1 and 2 are the only places where the skill recommends anything. Everything aesthetic is the user's call.

## Contents

- [Tier 1 — Accessibility](#tier-1--accessibility)
- [Tier 2 — UX practices](#tier-2--ux-practices)
- [Tier 3 — Conventions](#tier-3--conventions)

## Tier 1 — Accessibility

WCAG 2.2 Level AA unless marked. Write these into the spec's Accessibility section, phrased for this product (use its token names and components), not pasted as a generic checklist. Leave out criteria that can't apply — a product with no login has no use for 3.3.8.

### Perceivable

| Requirement | WCAG |
|---|---|
| Text contrast ≥4.5:1; large text (≥24px, or ≥18.66px bold) ≥3:1 | 1.4.3 |
| UI component boundaries and states, focus indicators, and meaningful icons/graphics ≥3:1 against adjacent colors | 1.4.11 |
| Color is never the only way information is conveyed — pair with text, icon, or shape | 1.4.1 |
| Non-text content has a text alternative; decorative images are hidden from assistive tech | 1.1.1 |
| Structure is programmatic: real headings in order, landmarks (header, nav, main), lists, table headers, labels tied to inputs | 1.3.1 |
| Instructions don't rely on shape, position or color alone ("the green button") | 1.3.3 |
| Content reflows at 320 CSS px wide with no two-directional scrolling (data tables and maps may scroll within their own region) | 1.4.10 |
| Text resizes to 200% without loss of content or function | 1.4.4 |
| Layout survives user text-spacing overrides (line height 1.5, paragraph spacing 2×, letter 0.12em, word 0.16em) | 1.4.12 |
| Content shown on hover/focus (tooltips, popovers) is dismissible (Esc), hoverable, and stays until dismissed | 1.4.13 |

**1.4.11 applies only where the boundary is needed to identify the control.** A hairline divider between sections is decorative and exempt. An input whose only visible outline is its border needs that border at 3:1 — unless the field is identifiable another way (a contrasting fill, an underline that meets 3:1). When checking a border token, ask what it's used for before applying 3:1.

### Operable

| Requirement | WCAG |
|---|---|
| Everything works with a keyboard; no keyboard traps | 2.1.1, 2.1.2 |
| Focus order follows the reading/visual order | 2.4.3 |
| Keyboard focus is always visible | 2.4.7 |
| Focused element isn't hidden behind sticky headers, footers or banners | 2.4.11 |
| A way to skip repeated blocks (skip link, landmarks) | 2.4.1 |
| Each page has a descriptive title | 2.4.2 |
| Headings and labels describe their topic or purpose | 2.4.6 |
| Pointer targets ≥24×24 CSS px, or spaced so a 24px circle around each doesn't overlap another | 2.5.8 |
| Drag-only interactions have a single-pointer alternative | 2.5.7 |
| Auto-moving or auto-updating content can be paused, stopped or hidden | 2.2.2 |
| Motion triggered by interaction can be turned off; honor `prefers-reduced-motion` (AAA, included as a baseline) | 2.3.3 |

### Understandable

| Requirement | WCAG |
|---|---|
| Page language is set | 3.1.1 |
| Navigation repeated across pages stays in the same order | 3.2.3 |
| Components with the same function are labelled and styled consistently | 3.2.4 |
| Help mechanisms (contact, help link) appear in the same place across pages | 3.2.6 |
| Inputs have visible labels or instructions | 3.3.2 |
| Errors are identified in text and describe the problem | 3.3.1 |
| Error messages suggest a fix when one is known | 3.3.3 |
| Legal, financial or data-changing submissions can be reviewed, corrected or reversed | 3.3.4 |
| Information already entered in a flow isn't asked for again | 3.3.7 |
| Login doesn't require a cognitive test (memorising, transcribing); paste and password managers work | 3.3.8 |

### Robust

| Requirement | WCAG |
|---|---|
| Custom controls expose name, role and state to assistive tech | 4.1.2 |
| Status messages (toasts, "saved", result counts) are announced without moving focus | 4.1.3 |

## Tier 2 — UX practices

Include each in the relevant section of the spec, using this product's components and wording. If the user says the product deliberately does otherwise, drop the practice and write the actual behavior as a plain rule (e.g. "Clearing the signature pad does not ask for confirmation."). Don't add a justification or say it departs from anything — just state how it works.

- **Every data view designs its empty, loading and error states.** Empty explains what belongs here and offers the next action; loading preserves layout; error says what happened and how to recover.
- **Error messages say what happened and what to do next**, in plain language, without blame.
- **Destructive actions confirm first or offer undo.**
- **Unsaved input is never lost silently.** Warn before navigating away, or save automatically.
- **One primary action per view.** Lesser actions use quieter treatments.
- **One blocking overlay at a time.** No modal on top of a modal.
- **Labels sit outside the input and stay visible.** Placeholder text is never the label.
- **Long operations show progress** and don't freeze the interface.
- **The same control lives in the same place on every screen.**
- **Navigation looks like navigation.** Controls that change the page are links; controls that act on the current page are buttons. (How each looks is a convention — see tier 3.)
- **Forms validate at a helpful moment** — on submit or on leaving a field, not on every keystroke.
- **Required and optional fields are stated explicitly.**

## Tier 3 — Conventions

Reasonable products differ on these. Ask, offering the options neutrally with no recommended default, and record only the choice. If undecided, use the marker.

| Convention | Typical options |
|---|---|
| Action order in bars and dialogs | Primary rightmost / primary leftmost / primary full-width at bottom on mobile |
| Text casing for UI copy | Sentence case / Title Case |
| Link vs button styling for navigation | Underlined text links / quiet text links with arrow or chevron / other |
| Destructive action placement | Separated from primary (far side or overflow menu) / beside primary with danger styling |
| Toast position | Top center / top right / bottom center / bottom right |
| Icon style | Outline / filled / duotone; icon set name |
| Status display | Tinted chips / solid chips / dot + text / text only |
| Table row treatment | Zebra stripes / hover only / plain |
| Date and number formats | Locale-driven / fixed format |
