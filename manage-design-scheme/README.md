# Manage Design Scheme (DESIGN.md)

[![Node.js: required](https://img.shields.io/badge/Node.js-required-5FA04E?logo=nodedotjs&logoColor=white)](#requirements)
[![npx: network access](https://img.shields.io/badge/npx-network_access-CB3837?logo=npm&logoColor=white)](#requirements)
[![Playwright: optional](https://img.shields.io/badge/Playwright-optional-lightgrey)](#requirements)
[![Figma MCP: optional](https://img.shields.io/badge/Figma_MCP-optional-lightgrey?logo=figma&logoColor=white)](#requirements)

An AI agent skill that writes and maintains a project's `DESIGN.md`: one file that says how the product looks and behaves (colors, typography, layout, components, interaction, accessibility and voice), so every developer and agent building UI makes the same choices.

You decide the design once, this skill documents it in a Google Labs DESIGN format compatible specification. This saves time, effort, and tokens when you build new frontend features, as the generated spec helps you get things right first time.

## What it's for

- **Creating a `DESIGN.md`** for any HTML/CSS/JavaScript project, in any framework: React, Vue, Svelte, Angular, plain HTML, Bootstrap, Tailwind, MUI and others.
- **Keeping it up to date** as the design changes. The skill compares the spec against the current design, shows each difference, and changes only what you approve.

It builds the spec from whatever you have, in any mix:

- **A reference screen**: a route or component in your codebase, or a running URL
- **A mockup file**: an HTML/CSS prototype, an SVG export, design-token JSON (W3C DTCG or Tokens Studio), or Figma via the Figma Dev Mode MCP server
- **Questions**: the skill asks, you answer, and "Undecided" is always a valid answer

## What it's not for

- **Designing your product.** The skill describes design decisions you've made; it never invents colors, fonts or layouts for you. Anything you haven't decided is marked `Not yet defined — ask before inventing.`, so agents ask instead of guessing.
- **Auditing or fixing code.** It only writes `DESIGN.md`. Checking that the code follows the spec is a separate job.

## Why use it

**It follows an open standard.** The output uses [Google Labs' DESIGN.md format](https://github.com/google-labs-code/design.md): their front-matter token schema and their section names and order, plus sections for Interaction & Motion, Iconography, Accessibility and Voice & Tone. Every draft is validated with Google's own linter, so other tools that read DESIGN.md can read yours, and you can export it to Tailwind or W3C design tokens.

**It's accurate.** I ran five scenarios with the skill and without it, using the same prompts and the same scripted answers:

| Scenario | With skill | Without skill |
|---|---|---|
| Reference screen in an older Bootstrap/SCSS app | 11/11 checks | 4/11 |
| New project, questions only, with gaps and a contrast failure | 12/12 | 6/12 |
| Prototype and token file that disagree | 10/10 | 4/10 |
| Only a screenshot available | 4/4 | 2/4 |
| Updating an existing spec after the design changed | 6/6 | 6/6 |

Without the skill, the agent:
- invented colors that appeared nowhere in the code
- suggested a replacement color and wrote it into the spec
- read colors off a screenshot's pixels and wrote a spec from them
- filled the spec with notes on where each value came from

With the skill, every value in the spec came from the sources or the user's answers, and nothing else.

**It's repeatable.** The same template, section order, undecided marker and validation steps run every time, so specs come out with the same shape whichever project or agent produced them.

**Accessibility is built in.** WCAG 2.2 AA requirements go into every spec, citing each criterion. A bundled script checks every color pair defined in the spec. If a color fails, the skill reports the ratio and lets you decide. It never swaps in a color you didn't choose.

## Example use cases

- *"Write a DESIGN.md for our app — `src/pages/dashboard.tsx` is the screen that best shows how we want things to look."*
- *"Our designer sent `prototype.html` and `tokens.json`. Turn them into our design spec."*
- *"We're starting a new booking app and there's no code yet. Help me put together design rules for the devs and agents."*
- *"Our DESIGN.md is a few months old and the brand color has changed. Bring it up to date with the current styles."*
- *"Document our Figma design system as a DESIGN.md so Claude stops guessing at spacing and colors."*

Once the spec is written, the skill can add a path-scoped Claude Code rule, plus an `AGENTS.md` pointer for other agents, so agents read `DESIGN.md` without you having to ask, and only when they touch UI files.

## Requirements

- **Node.js**, for the contrast check.
- **npx with network access**, for Google's linter (`@google/design.md`, pinned to a tested version). If it's unavailable, the skill says the lint step was skipped.
- **Optional:** Playwright, to read styles from a running URL; the Figma Dev Mode MCP server, for Figma files.
