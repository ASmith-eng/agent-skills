# Reading design from code and mockups

How to pull design decisions out of a reference view or a mockup file. Record only what is actually there.

## Contents

- [Reference view in the codebase](#reference-view-in-the-codebase)
- [Reference view at a running URL](#reference-view-at-a-running-url)
- [Mockup files](#mockup-files)
- [What to record](#what-to-record)

## Reference view in the codebase

Start from the route or component the user names. Read it, its child components, and its styles, then follow the imports to wherever values are defined. Typical locations:

| Stack | Where tokens live |
|---|---|
| Tailwind v3 | `tailwind.config.{js,ts,cjs}` → `theme` / `theme.extend` |
| Tailwind v4 | CSS file with `@theme { --color-*: …; }` |
| shadcn/ui | `components.json` → the CSS file it names; `:root` and `.dark` variables; `components/ui/*` for variants |
| Plain CSS | `:root { --*: … }` custom properties; global stylesheet |
| SCSS / Less | `_variables.scss`, `variables.less`, `_theme.scss`; `$` / `@` variables |
| Bootstrap | SCSS overrides before `@import "bootstrap"`; or `--bs-*` custom properties |
| MUI | `createTheme({ palette, typography, shape, spacing })` |
| Chakra | `extendTheme({ colors, fonts, radii, … })` or v3 `createSystem` |
| styled-components / Emotion | `ThemeProvider` theme object |
| Vue / Svelte / Angular | the same CSS/SCSS/Tailwind sources, plus `<style>` blocks in components |
| Design-token build | `tokens/*.json`, Style Dictionary config |

Resolve indirections to final values: a Tailwind class (`bg-primary`) → its CSS variable → its hex; `hsl()`/`oklch()` → hex. The spec records the resolved value.

**When values aren't centralised** (older codebases with colors inline in stylesheets), search the view's styles for color, font-size, spacing, radius and shadow values, and list what the view actually uses. If the same role appears with several values (four slightly different greys for secondary text), don't pick one — show the user the values and ask which is intended.

**Components:** note which components the view renders and their variants (e.g. three button styles, a table with a status column). Record how they look and behave in this view. Components the view doesn't render are not inferred from the component library — they go to the questions or get the marker.

## Reference view at a running URL

If Playwright (or another browser automation tool) is available, open the URL and read computed styles for representative elements — body, headings, primary and secondary buttons, inputs, links, cards, table cells, chips:

```js
const styles = await page.evaluate((selectors) =>
  selectors.map((selector) => {
    const element = document.querySelector(selector);
    if (!element) return { selector, missing: true };
    const s = getComputedStyle(element);
    return {
      selector,
      color: s.color,
      background: s.backgroundColor,
      font: `${s.fontWeight} ${s.fontSize}/${s.lineHeight} ${s.fontFamily}`,
      radius: s.borderRadius,
      border: `${s.borderWidth} ${s.borderStyle} ${s.borderColor}`,
      shadow: s.boxShadow,
      padding: s.padding,
    };
  }), selectorList);
```

Also check `:root` custom properties (`getComputedStyle(document.documentElement).getPropertyValue('--primary')`). Focus styles need the element focused first (`await locator.focus()`). Without a browser tool, ask for the route in the codebase instead.

## Mockup files

| Format | How to read it |
|---|---|
| **HTML/CSS prototype** | Read as a reference view: CSS custom properties, classes, inline styles. Values are exact. |
| **SVG export** | `fill`, `stroke`, `font-family`, `font-size`, `font-weight`, `rx` (radius) attributes and any `<style>` block. Group/layer `id`s often carry the designer's names — use them to work out roles ("Button/Primary"). Text converted to outlines carries no font info — ask. |
| **Design-token JSON — W3C DTCG** | Tokens have `$value` and `$type`; groups nest; `{group.token}` is an alias — resolve it. |
| **Design-token JSON — Tokens Studio** | Same idea with `value` / `type`; may contain several sets and themes — ask which set is current. |
| **Figma** | Through the Figma Dev Mode MCP server: read variables/styles and the selected frame's design context. If the server isn't connected, ask for an SVG or token-JSON export. A `.fig` file on disk can't be read. |

## What to record

- Roles, not just values: "secondary text is `#57534e`", not "a grey is used".
- Only roles the source actually shows. A token file that defines `--danger` tells you the value; whether and where it's used is a question if no view shows it.
