# Stack checks

How to scope a page and which mechanical checks to run, by stack. A project often uses more than one styling system (for example Tailwind with a few SCSS modules). Run the checks for each system the page's files use.

All patterns use ripgrep. Patterns that use lookahead need `--pcre2`, as shown. Replace `<files>` with the file set from step 1.

## Contents

- [Scoping the page](#scoping-the-page)
- [Checks for every stack](#checks-for-every-stack)
- [Tailwind](#tailwind)
- [CSS, SCSS, Less and CSS-in-JS](#css-scss-less-and-css-in-js)
- [Bootstrap](#bootstrap)
- [MUI](#mui)
- [Chakra UI](#chakra-ui)

## Scoping the page

| Stack | Files the page renders | Shared layer (stop here) |
|---|---|---|
| React / Next.js | the route file and its relative imports, plus CSS modules and stylesheets they import | the UI primitives folder (`components/ui/` for shadcn, or a design-system package), the theme, global CSS |
| Vue / Nuxt | the `.vue` file and its imports: `<template>`, `<script>` and `<style>` blocks | shared component library, global styles, theme |
| Svelte / SvelteKit | `+page.svelte` (or the component) and its imports, including `<style>` blocks | `$lib` UI components shared across features, global CSS |
| Angular | the component's `.ts`, its `templateUrl`/`template` and `styleUrls`/`styles`, plus child components used in the template | shared module or library components, `styles.scss`, theme |
| Plain HTML | the HTML file, its linked stylesheets and inline `<style>` and `style=""` | site-wide stylesheets used by every page |

Theme and token files (`tailwind.config.*`, `@theme` blocks, `createTheme`, `extendTheme`, `_variables.scss`, `:root` variables) are always shared layer. Read them to resolve values, but don't scope findings to them unless the defect is in the theme itself.

## Checks for every stack

```bash
# hard-coded colors
rg -n '#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(' <files>

# inline styles: JSX, Vue, Angular, HTML
rg -n 'style=\{\{|:style=|\[style|\[ngStyle\]|style="' <files>
```

## Tailwind

```bash
# arbitrary values: one-off sizing outside the scale
rg -n '\b[a-z-]+-\[[^\]]+\]' <files>

# raw palette classes where a semantic token exists
rg -n '\b(?:text|bg|border|ring|fill|stroke|divide)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b' <files>

# radius and shadow
rg -n '\brounded(?:-[a-z0-9]+)?\b|\bshadow(?:-[a-z0-9]+)?\b' <files>

# scroll regions and width constraints
rg -n '\boverflow(?:-[xy])?-(?:auto|scroll|hidden|visible)\b|\b(?:min|max)-w-' <files>

# action bar and footer alignment
rg -n '\bjustify-(?:end|between|start|center)\b' <files>

# icon sizes
rg -n '\b(?:h-[0-9.]+ w-[0-9.]+|size-[0-9.]+)\b' <files>

# components without an explicit variant (shadcn-style primitives)
rg -n --pcre2 '<(?:Badge|Button)\b(?![^>]*\bvariant=)' <files>
```

## CSS, SCSS, Less and CSS-in-JS

This covers plain stylesheets, CSS modules, Vue/Svelte/Angular style blocks, styled-components and Emotion (their template literals are CSS).

```bash
# design properties set to literal values instead of variables or theme tokens
rg -n --pcre2 '\b(?:color|background(?:-color)?|border(?:-[a-z]+)?(?:-color)?|outline(?:-color)?|fill|stroke|box-shadow|border-radius|font-(?:size|weight|family)|line-height|letter-spacing|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|row-gap|column-gap)\s*:(?![^;]*(?:var\(|\$|@|theme))' <files>

# scroll regions and width constraints
rg -n '\boverflow(?:-[xy])?\s*:|\b(?:min|max)-width\s*:' <files>

# action bar and footer alignment
rg -n '\bjustify-content\s*:' <files>
```

Values such as `0`, `none`, `inherit` and `transparent` are fine. Check the remaining hits against the allowlist.

## Bootstrap

Run the CSS/SCSS checks on the project's own stylesheets, plus:

```bash
# buttons and badges with no style variant
rg -n --pcre2 'class(?:Name)?="[^"]*\bbtn\b(?![^"]*\bbtn-(?:outline-)?[a-z]+)' <files>
rg -n --pcre2 'class(?:Name)?="[^"]*\bbadge\b(?![^"]*\b(?:text-)?bg-[a-z]+)' <files>

# scroll regions and width constraints
rg -n '\boverflow-(?:auto|scroll|hidden|visible)\b|\b(?:mw|vw|mh)-[0-9]+\b' <files>

# action bar and footer alignment
rg -n '\bjustify-content(?:-[a-z]+)?-(?:end|between|start|center)\b' <files>
```

Contextual classes (`text-primary`, `bg-success`) are semantic tokens. Check that the meaning matches the state shown.

## MUI

```bash
# sx and style props with literal values
rg -n --pcre2 '\b(?:color|bgcolor|backgroundColor|borderColor|borderRadius|boxShadow|fontSize|fontWeight|m|p|[mp][trblxy]|margin|padding|gap)\s*:\s*["'"'"'][0-9#]' <files>

# components without an explicit variant
rg -n --pcre2 '<(?:Button|Chip|TextField|Typography)\b(?![^>]*\bvariant=)' <files>

# scroll regions and width constraints
rg -n '\boverflow[XY]?\s*:|\b(?:min|max)Width\s*[:=]' <files>

# action bar and footer alignment
rg -n '\bjustifyContent\s*[:=]' <files>
```

Numbers for spacing props (`p: 2`) are theme spacing units and are fine. Strings (`p: '12px'`) bypass the scale. Resolve defaults from the theme's `components.<Name>.defaultProps` before falling back to MUI's own defaults.

## Chakra UI

```bash
# style props with literal or raw palette values
rg -n '\b(?:color|bg|bgColor|borderColor)="(?:#|[a-z]+\.[0-9]{2,3}")' <files>

# components without an explicit variant or color scheme
rg -n --pcre2 '<(?:Button|Badge|Tag)\b(?![^>]*\b(?:variant|colorScheme|colorPalette)=)' <files>

# scroll regions and width constraints
rg -n '\boverflow[XY]?=|\b(?:minW|maxW|minWidth|maxWidth)=' <files>

# action bar and footer alignment
rg -n '\bjustify(?:Content)?="' <files>
```

Resolve defaults from the theme's component config (`extendTheme` `components`, or v3 recipes) before falling back to Chakra's own defaults.
