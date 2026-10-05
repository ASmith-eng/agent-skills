# Structured questions

Ask only what the reference view or mockup didn't already settle. Work in batches of up to four related questions, so the user isn't faced with a wall of them.

## How to ask

- **Every question accepts "Undecided".** For choice questions, make it one of the options. For free-text questions, say it's a fine answer.
- **Stay neutral.** Don't suggest values, palettes, fonts or defaults, and don't mark any aesthetic option as recommended. "What color is the primary action?" — not "How about a deep blue?" The user may have no answer yet; that's what "Undecided" is for.
- **Choice questions** (a short list of mutually exclusive options) suit a multiple-choice prompt such as `AskUserQuestion`. **Value questions** (hex codes, font names, pixel sizes) are asked in plain text.
- **Accept answers in any form.** "Same blue as our logo, #2563eb" is an answer. A link to a brand guide is an answer — read it if you can. If an answer is vague ("something warm"), record the user's words in the personality, but don't turn them into a color.
- If the user asks for a suggestion, that's their call to make — offer options then. Until they ask, don't.

## Groups

Each group lists what it fills in the spec.

### 1. Product → front matter `name`, `description`; Overview

- What is the product, in a sentence?
- Who uses it, and in what setting?
- How do people use it — long working sessions, or brief visits?
- Primary device: desktop, mobile, or both equally? (choice)

### 2. Personality → Overview, Voice & Tone

- Three or four words for how the product should feel.
- Is there a concrete thing it should feel like — an object, a publication, a place, another product? (A specific reference tells a reader more than adjectives do. If the user has none, that's fine; don't offer one.)
- Anything it should never feel like?

### 3. Color → front matter `colors`; Colors

- Light theme, dark theme, or both? (choice)
- Primary/brand color, and its hover/pressed shade if defined.
- Text color on the primary color.
- Page background, card/surface color, main text color, secondary text color, border color.
- Which status meanings does the product need (e.g. success, warning, error, info, in progress, inactive)? What does each mean in this product, and what are its colors?
- Focus indicator color and style.

### 4. Typography → front matter `typography`; Typography

- Font family for UI text; a monospace family if any.
- Base body text size.
- Heading sizes and weights, or a named type scale.
- Font weights in use.

### 5. Layout → front matter `spacing`; Layout (breakpoints go in its prose)

- Page shell: how is navigation laid out (top bar, sidebar, bottom tabs, none)? (choice)
- Density: compact, comfortable, or spacious? (choice)
- Spacing base unit and scale, if defined.
- Breakpoints, if defined.
- Maximum content width, if any.

### 6. Shape & depth → front matter `rounded`; Shapes, Elevation & Depth (shadows go in its prose)

- Corner radius for controls, cards and overlays.
- Are surfaces separated mainly by borders, shadows, or background tone? (choice)
- Shadow values, if any.

### 7. Components → front matter `components`; Components

- Which of these exist in the product: buttons, text inputs, selects, checkboxes/radios/switches, cards, data tables, dialogs, side sheets, popovers, toasts, tabs, steppers/wizards, status chips, breadcrumbs, pagination? (multi-select)
- For each that exists and isn't already described by a source: its variants and how they look.

### 8. Conventions → the relevant sections

Ask each convention from `core-practices.md` tier 3 as a choice question, listing its options without a recommendation.

### 9. Voice → Voice & Tone

- How should microcopy sound? (e.g. formal, plain, friendly — in the user's words)
- Any words or phrasings to always use or avoid?

### 10. Departures → the relevant sections

Last, list the tier 2 UX practices (`core-practices.md`) briefly and ask: "Does the product deliberately do any of these differently?" Record each departure as a plain rule.
