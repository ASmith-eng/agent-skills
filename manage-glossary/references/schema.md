# Frontmatter schema (v1)

The frontmatter holds the decisions the script checks. It's kept deliberately small: every field is something the script uses or that people must read. Don't add fields just in case.

## Fields

| Field | Where | Meaning |
|---|---|---|
| `schema` | every file | Format version. Currently `1`. Update migrates older versions. |
| `reconciled_at` | INDEX.md | Short commit hash the glossary was last reconciled against. Set by Create and Update. |
| `group` | group file | Group name, exactly as the term index links it (`[Fulfilment](fulfilment.md)`). |
| `paths` | group file | Globs for the code that belongs to this group (`*`, `**` and `?`). A path with no wildcards covers everything under it. Optional: shared concepts can have none. |
| `code` | group file | The concept's code identifiers: model, table, key, and the main collection and variable names. Integrity checks that each still exists. |
| `avoid` | group file | Block list of Avoid entries (below). |
| `avoid[].term` | group file | A word not to use in code. Write it in the singular; plurals are matched automatically. Multi-word terms are space-separated (`payment status`). |
| `avoid[].reason` | group file | Why, in one short clause. Required for lost variants. Reserved terms don't need one, because the linked group is the reason. |
| `avoid[].reserved_by` | group file | The term belongs to that group. Flag it only inside this group's `paths`. |
| `avoid[].allow` | group file | Identifiers that contain the term but are fine (`sortOrder`, `orderBy`). Exact, case-sensitive identifiers. |

Two kinds of Avoid entry:

- **Lost variants** (no `reserved_by`) are names that lost a decision, or business names that don't belong in code. They're flagged anywhere in new code.
- **Reserved terms** (`reserved_by`) are words that belong to another group. They're flagged only inside this group's `paths`, because outside them the word may be right. A reserved term in a group with no `paths` is never flagged by the script; Check's semantic pass still looks for it.

Inside a reserving group's paths, the owning group's own `code` identifiers are always allowed. Referring to the real Order as `Order` or `orderId` from Fulfilment code is correct, so those aren't flagged. A bare `order` variable, or `activeOrders`, still is.

## Matching

How a term matches an identifier, for the script and for running Check by hand:

- Split identifiers and file names into words at camelCase, PascalCase, snake_case, kebab-case and SCREAMING_CASE boundaries, and compare in lowercase. `activeJobs` → `active jobs`; `HTTPJobQueue` → `http job queue`.
- A term matches when its words appear consecutively among the identifier's words, and the last word may be plural (`job` → `jobs`; `entity` → `entities`; `payment status` → `paymentStatuses`). A term doesn't match part of a word: `job` doesn't match `jobber`, and `order` doesn't match `ordered`.
- Skip identifiers in `allow`.
- Skip string literals and comments (quotes, `//`, `/* */`, `#` and `--` comments), because UI copy may rightly use the business name. This is best effort; judge the result.
- Check only files git tracks or would track (`.gitignore` is respected). Never check the glossary itself, prose files (`.md`, `.mdx`, `.txt`, `.rst`, `.adoc`) or lockfiles.

**Mentions** (`--diff` only) use the same word matching against each group's vocabulary: its `group` name, plus every term the term index links to it. Parenthetical notes in the term cell are ignored. A mention is an identifier in the added lines or new file names that matches a group's vocabulary and:
- isn't already a candidate
- isn't in any `code` or `allow` list
- didn't exist at the base commit

So the term index decides what counts as a group's word. That's why it lists concept terms, not generic verbs (`template.md`).

## The YAML subset

Node has no built-in YAML parser and the script has no dependencies, so frontmatter uses a subset it parses itself. Always write frontmatter in this form. Everything in the subset is also valid YAML, so other tools can read it.

Allowed:

- The block between the first two `---` lines. The file must start with `---`.
- Top-level `key: value` pairs. Values are plain scalars (`group: Fulfilment`, `schema: 1`) or double-quoted strings, with `\"` and `\\` as the only escapes.
- Flow lists of plain scalars or double-quoted strings: `paths: [src/fulfilment/**, src/web/fulfilment/**]`.
- One block list of mappings per key, as used by `avoid`. Each item starts with `  - key: value`, and its other keys are indented to line up under the first. Item values are scalars, quoted strings or flow lists.
- Whole-line `#` comments and blank lines.

Not allowed: anchors and aliases, multi-line strings, nested mappings beyond the `avoid` items, block lists of scalars, inline comments after values, tabs for indentation, single-quoted strings.

**Quote a value** (double quotes) when it contains `: `, ` #` or, inside a flow list, a comma. Also quote it when it starts with any of these: `[ { " ' * & ! | > % @ # ` or a backtick, or with `- `, `? ` or `:`. A glob that starts with `*` must be quoted: `paths: ["**/billing/**"]`. Always quote `reason` values.

```yaml
---
schema: 1
group: Fulfilment
paths: [src/fulfilment/**, "**/fulfilment-*.ts"]
code: [Fulfilment, fulfilments, fulfilmentId, activeFulfilments]
avoid:
  - term: job
    reason: "UI-only name (Job in the staff app); code has used Fulfilment since the 2024 rename"
  - term: order
    reserved_by: Order
    allow: [sortOrder, orderBy]
---
```

A file whose frontmatter breaks these rules is reported by the integrity check with its file and line, and skipped. Every other file is still checked. Fix the frontmatter by hand, or in Update.

## Versioning

- Every file carries `schema`. The script understands version `1`.
- **Newer than the script:** the script warns that the skill may be out of date, and checks the fields it knows. Unknown keys are ignored.
- **Older than the script:** the script suggests running Update, which migrates the files (`references/update.md`).
- **Missing keys** produce warnings, not failures.
- When the format changes, bump the version, describe the change and its migration below, and teach the script the new version.

## Migration notes

| From | To | Change |
|---|---|---|
| none | 1 | First version. No migration. |
