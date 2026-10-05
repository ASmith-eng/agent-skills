# DESIGN.md template

The skeleton every spec follows. It follows the Google DESIGN.md format (https://github.com/google-labs-code/design.md, version `alpha`) and adds sections of our own. `{braces}` are placeholders. Text in *italics* says what belongs in a section — it is guidance for you, not text for the spec. See `example-DESIGN.md` for a finished one.

## Front matter

YAML, between lines of exactly `---`. Only the top-level keys below are recognised; anything else (`radius`, `elevation`, `breakpoints`, `theme`…) is ignored by tools, so those values go in the prose instead.

```yaml
---
version: alpha
name: {product name}
description: {one sentence — what it is and who uses it}

omitted:                      # only when a token group is undecided
  - section: {colors | typography | rounded | spacing | components}
    reason: "Not yet defined — ask before inventing."

colors:
  # Flat map of kebab-case names to CSS colors (hex preferred). No nested objects.
  primary: "{hex}"            # {role} — required whenever colors exist
  primary-hover: "{hex}"
  on-primary: "{hex}"         # text/icons on primary
  background: "{hex}"
  surface: "{hex}"
  foreground: "{hex}"
  muted-foreground: "{hex}"
  {role}: "{hex}"             # add or rename roles to match the product
  {meaning}-bg: "{hex}"       # one set per status meaning the product uses
  {meaning}-text: "{hex}"
  {meaning}-border: "{hex}"

typography:
  # One token per text level. Each level carries its full style.
  {level}:                    # e.g. h1, h2, body, body-sm, label, caption
    fontFamily: "{family}"
    fontSize: {px | rem}
    fontWeight: {number}
    lineHeight: {unitless | px}
    letterSpacing: {em}       # only when decided

rounded:
  {level}: {px}               # {what uses it}

spacing:
  {level}: {px}

components:
  # Map of component (and variant) names to properties. Allowed properties:
  # backgroundColor, textColor, typography, rounded, padding, size, height, width.
  # Prefer references to tokens above: "{colors.primary}", "{typography.label}", "{rounded.md}".
  {component}:
    backgroundColor: "{colors.…}"
    textColor: "{colors.…}"
    typography: "{typography.…}"
    rounded: "{rounded.…}"
    padding: {px}
    height: {px}
  {component}-{state}:        # variants are separate entries: -hover, -active, -disabled
    backgroundColor: "{colors.…}"
---
```

**Token names:** use the names the user's own sources use (`brand-600`, `text-subtle`) converted to kebab-case; otherwise use the role names above.

**Components need both colors.** Give every component with text a `backgroundColor` and a `textColor`, so the linter can check the pair's contrast. A text-only component (a link, helper text) takes the color of the surface it sits on as its background.

**Colors only used for borders and focus** (`divider`, `input-border`, `focus-ring`, `{meaning}-border`) can't be referenced by components, because the schema has no border property. Keep them as color tokens and describe their use in prose. The linter's `orphaned-tokens` warning on them is expected.

**What stays out of the front matter:** shadows (→ Elevation & Depth), breakpoints (→ Layout), motion durations (→ Interaction & Motion), dark-theme values unless they're defined as their own named tokens.

## Body

Start with `# {name} — Design system` and a short paragraph saying this document is the source of truth for how {name} looks and behaves, and is a living document. Then the `##` sections below, with exactly these names, in this order. Google's sections are marked G and ours +; that marking is for you, not the spec. A section with nothing decided keeps its heading and gets the marker. Never repeat a heading; the linter rejects duplicate sections. `example-DESIGN.md` shows every section written out.

| Section | | What belongs in it |
|---|---|---|
| Overview | G | What the product is, who uses it and how (session length, device, setting); the personality in the user's words, plus their concrete reference if they gave one. Subsection **Design principles**: 3–5 numbered principles drawn from what the user said matters. |
| Colors | G | The palette's character in a sentence, then each color's role. Subsection **Status**: table of meaning, what it applies to (product-specific examples) and color family, then how status is displayed. Subsection **Dark theme** when it's in scope. |
| Typography | G | Families with fallbacks and where each is used; how hierarchy works (size vs weight); which levels appear where. |
| Layout | G | Subsections **Page structure** (shell, navigation, what never changes), **Rhythm** (concrete spacing: padding, gaps, row heights) and **Responsive behavior** (breakpoint values, mobile- or desktop-first, what changes, what may scroll horizontally). |
| Elevation & Depth | G | How surfaces are separated (shadow, tone, border), and each shadow value with what uses it. |
| Shapes | G | Corner radius approach and what uses each level. |
| Components | G | One subsection per component the product has, in this order where present: Buttons, Links & navigation, Action placement, Inputs & forms, Selections, Cards, Data tables, Status chips, Overlays, Steppers, Feedback. Each covers how it looks, its variants, and when to use which. A component known to exist but not yet described gets a heading and the marker. |
| Interaction & Motion | + | States every interactive element has, focus style, motion duration and easing, reduced-motion handling. |
| Iconography | + | Icon set, style, sizes, when icons may stand alone. |
| Accessibility | + | Tier 1 requirements from `core-practices.md`, phrased for this product, with WCAG criterion numbers. |
| Voice & Tone | + | How microcopy sounds; casing; how errors are written; words to use or avoid. |
| Do's and Don'ts | G | A quick-reference list of the most important rules above. Always last. |

## The undecided marker

When a section or subsection has nothing decided, its whole body is:

```markdown
Not yet defined — ask before inventing.
```

Use exactly this wording, so agents and the audit skill can find it. Put it at the smallest level that's undecided: if typography families are decided but the sizes aren't, the marker goes under a "Sizes" line, not over the whole Typography section.

When a whole token group is undecided (no colors, typography, rounding, spacing or components decided), leave the group out of the front matter **and** list it under `omitted:` with the marker as the reason. Without that entry, tools tell agents the values "will fall back to agent defaults" — which is the guessing the marker is there to stop. Prose-only sections (Iconography, Dark theme…) take the marker in the body only; `omitted:` only accepts token group names.

## Writing rules

- **Decisions only.** No history, sources, dates, "we chose", "based on the mockup", or change notes.
- **Departures are plain rules.** "Clearing the signature pad does not ask for confirmation." No justification, no "unlike usual practice".
- **Concrete over vague.** "Card padding: 24px" beats "generous padding". A concrete reference ("like a set of hand tools on a van shelf") says more than a stack of adjectives — but only when the user gave it.
- **Prose carries the design; tokens support it.** Every token group should be explained in its prose section. Agents read the prose to understand intent.
- **Describe, don't implement.** No class names, component file paths or framework code in the body — the spec should still hold if the stack changes.
- **Keep it under ~350 lines of prose.** The front matter can run longer, since every component lists its properties.
