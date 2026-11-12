# Document Feature

An AI agent skill that writes and refactors feature documentation in `documentation/` using one standard template. Each doc is written for two audiences: technical readers (developers and AI agents) and business readers (product managers and system admins).

## What it's for

- **Documenting a new feature** from scratch, using the codebase as the starting point.
- **Refactoring an existing doc** to fit the template. The skill keeps content that's still accurate and flags anything that looks outdated rather than silently changing it.

Every doc follows the same structure:

- **What does this feature do?** A plain-language summary with no implementation details.
- **Business Rules:** a numbered list of testable statements. This is the authoritative source for how the feature should behave.
- **Technical Implementation:** key files, process flow, and optional subsections such as data model, API surface and scheduled jobs.
- **Known Risks / Weaknesses:** fragile points, edge cases and tech debt.

## Why use it

**You stay in charge of business logic.** The tail doesn't wag the dog, and your current code shouldn't dictate the product/feature logic. This skill builds documentation section by section starting with the feature's intent, business logic, and finally describes how it's currently implemented - giving you a chance to review and clarify gaps during the process.

**Auditable.** It produces consistent documentation of product expectations - a spec you can compare the code against, alongside a record of known implementation weaknesses.

**It's consistent.** Every doc gets the same frontmatter, sections and order. Long docs can be split across several files, but Business Rules always stay in the main file. The skill also adds each new doc to `documentation/INDEX.md`. The index, fixed section order, and multi-file breakdown let agents find the right doc and section without reading everything.

## Example use cases

- *"Document how order fulfilment works."*
- *"Bring `documentation/billing/invoicing.md` up to the standard template."*
