# Discovery

Find the architecture and approach, the areas, and for each agreed scenario the variants in use and where the code disagrees with itself. Use the cheapest sources first, and stop once you have enough evidence to classify each finding.

**Bounding:** discovery covers only the agreed scenarios and a sample of each. Never sweep the whole codebase.

## Sources, in order

1. **Existing docs.** CLAUDE.md/AGENTS.md, README, contributing guides, ADRs and feature docs often state intended patterns, including ones not built yet. Treat them as evidence, not settled fact, because docs go out of date. Raise any disagreement with the code as a question, and offer patterns that docs decide but the code doesn't use as Planned candidates.
2. **Manifests and top-level folders.** These give the stack, the frameworks, the kind of application (an API, a SPA, a full-stack web app, a CLI, a library…) and the candidate areas.
3. **Folder names inside features.** These give the structural model and the placement table.
4. **Instances of each scenario.** Found by directory, naming or framework hooks, counted, and sampled.
5. **Recency.** For each conflict, git history shows which variant newer code uses.

## Architecture signals

- **Folder names** at the top level and inside features: `controllers/` + `services/` + `repositories/` (MVC with a service layer), `viewmodels/` (MVVM), `commands/` + `queries/` (CQRS), `domain/` + `adapters/` or `ports/` (hexagonal), one folder per feature holding every layer (feature folders).
- **Framework defaults.** Rails, Laravel, Django, Spring, Next.js and others have a default layout. Note where the project follows it and where it departs. A departure is often a deliberate house rule.
- **Where business logic actually ends up.** Sample three or four features and look at where the rules live: models, controllers, services, hooks or components. This often differs from what the folder names suggest, and it's what agents get wrong.
- **Competing structures.** An older layer-first tree beside newer feature folders, or a `v2/` beside the original. Check recency for each, then ask which one new code follows.

## Approach signals

The approach is recorded even when it's consistent, so gather it in every Create, across the areas in scope (excluding tests, generated and vendored code):

- **Paradigm:** count class declarations and inheritance (`extends`), factories and registries, dependency-injection containers or decorators, and module styles (exported functions, default-exported objects, classes). Say whether one paradigm dominates, with the counts.
- **Named patterns:** which well-known layers and patterns exist (controllers, services, repositories, view models, a BFF, a jobs framework, commands and queries, an event bus), and where the house version differs from the textbook. These become the Patterns line, structural model first.
- **Framework fit:** how closely the code follows its framework's conventions, from the architecture signals above. This is the draft Stance.
- **Exceptions:** files that break the dominant paradigm or a named pattern. List them for the draft review. They're never written into the Architecture lines: the user either leaves them alone or sends them through Don't copy as legacy.

```bash
git grep -lE '^\s*(export\s+)?(default\s+)?(abstract\s+)?class\s' -- <area paths> ':!*.test.*' | wc -l   # files declaring a class
git grep -lE '\bextends\s' -- <area paths> ':!*.test.*'                                                  # inheritance
git grep -liE 'factory|registry|container|@injectable' -- <area paths> ':!*.test.*'                      # factories, registries, DI
```

Adjust the patterns to the language. Read two or three hits to confirm before counting them.

## Commonly introduced patterns

A starter list for the Don't introduce question. It's a seed, not a limit: add stack-specific patterns it doesn't name, and never copy it wholesale into a catalog. Offer only patterns that aren't the dominant approach in the code, for the stack and kind of application found. A pattern with a few instances still qualifies.

- **Any backend:** class-based services, DI containers, repository layer, event bus or domain events, CQRS, a second ORM or query builder, a validation library alongside an existing one, microservice splits, generic base classes.
- **Node, Express or similar:** BFF layer or page-shaped endpoints, GraphQL layer, middleware-heavy request pipelines, decorators (NestJS style).
- **React SPA:** a global store alongside query hooks, class components, HOCs over hooks, CSS-in-JS alongside an existing styling system.
- **Rails, Django, Laravel:** service objects vs fat models, concerns or mixins, class-based vs function-based views, repositories over the ORM.
- **Spring, .NET:** anaemic vs rich domain models, MediatR-style pipelines, AutoMapper-style mapping layers.

## Areas

Start from the manifests and top-level folders. Candidate areas:

- separate apps or packages with their own manifest
- a frontend and a backend in one repo
- a schema or migrations folder with its own tooling
- a mobile app, CLI or worker that's built and deployed separately

Merge candidates that share a stack and are always changed together. In a monorepo, merge small packages with the same stack. A single-layer project (a library, CLI or API service) is one area named after the project. Name each area with its technology, and give it path globs that cover its code. Say what's excluded when globs overlap.

## Capabilities

A technology-neutral starting list, to check against, not to copy:

- reading and changing data
- forms and input validation
- state management
- routing
- background work
- external integrations
- auth and permissions
- error handling
- caching
- configuration
- logging and observability
- migrations and schema changes
- testing

Name capabilities in the codebase's terms and paradigm. A CQRS codebase might have "Commands" and "Queries" where another has "Reading and changing data". A functional codebase might have "Effects" where another has "Services". Drop any capability with nothing to record.

## Scenarios

Scenarios are what an agent sets out to do: "Call an external API", "Run work in the background", "Test an endpoint". Find them from what the structure shows:

| Signal | Scenarios it suggests |
|---|---|
| Route files, controllers, handlers, resolvers | adding an endpoint, validating input, returning errors, checking permissions |
| Job, queue, worker, command or scheduler folders | background work, scheduled work, retries |
| HTTP clients, SDK wrappers, `integrations/`, webhooks | calling partners, receiving webhooks |
| Migrations, seeders, schema files | schema changes, backfills, seed data |
| Components, hooks, stores, view models | fetching data, changing data, forms, shared state |
| Middleware, guards, policies, decorators | auth, permissions, request context |
| Cache clients, memoisation helpers | caching reads, invalidating |
| Config loaders, env files, feature flags | reading config, adding a flag |
| Test folders and their helpers | each kind of test: unit, integration, endpoint, component, end-to-end |

For each agreed scenario:

1. **Find instances:** every place that does this job, by directory, naming or framework hooks. Count them.
2. **Group by approach:** cluster the instances into variants. Read two or three examples of each variant, not all of them.
3. **Name the pattern:** use the well-known name only if it really matches. Otherwise give it a short descriptive name and note how it differs from the textbook.
4. **Recency:** check git history for which variant newer code uses (below).
5. **Note the situations:** where two variants are both in active use, look at what distinguishes the places each is used (reads vs writes, one-off vs recurring, inside vs outside a transaction). That's a candidate "use when" rule to put to the user.
6. **Choose exemplar candidates:** prefer recent, small, idiomatic files with tests, outside legacy areas. A file that does the job and nothing else beats a large file that does it among other things.

## Counting and recency

Counts back up every question, so get real numbers. Don't estimate.

```bash
git grep -l 'HttpClient' -- 'src/**' ':!*.test.*' | wc -l          # files using a variant
git grep -l 'HttpClient' -- 'src/**' | cut -d/ -f1-3 | sort | uniq -c | sort -rn   # where it lives
git log -1 --format='%as' -S'HttpClient' -- src/                    # when it was last added or removed
git log --since='12 months ago' --diff-filter=A --format= --name-only -- 'src/**/commands/*' | wc -l   # new files of a kind
git log --format='%as' --follow -- <file> | tail -1                 # when a file was created
git log --diff-filter=A --format='@%as' --name-only -- '<glob>' \
  | awk '/^@/{d=substr($0,2); next} NF{print substr(d,1,4)}' | sort | uniq -c   # files of a kind created per year
```

The per-year line counts every add, so a file deleted and re-added counts twice, and a moved file counts in the year it moved. Use it for a tree's shape, not for one file's age.

Treat recency as a hint. Reformats, file moves and renames reset history, and file counts and call-site counts can disagree. Exclude generated code, vendored code and fixtures from counts.

## Legacy signals

- directories named `legacy`, `old`, `deprecated`, `v1` or `archive`
- `@deprecated` markers, and comments such as "TODO: migrate", "old way" or "don't use"
- lint rules or import restrictions that ban a path
- areas no one has touched in a long time while the same scenario is active elsewhere
- a variant that only appears in older files (by creation date, not last-touched date)

Each is a Don't copy candidate. Draft a reason from the evidence, decide which capability it belongs to (or area-wide, for a whole tree or structure), and confirm with the user.

## Tooling and style

- **Tool configs:** collect lint, format and type-check config paths (`eslint.config.*`, `.prettierrc*`, `tsconfig.json`, `pyproject.toml` sections, `phpstan.neon`, `.rubocop.yml`, `.editorconfig`, …) for the Tooling section. Rules they enforce stay out of the catalog.
- **Style sampling:** read a spread of recent files (different features, different authors) for error handling, logging, comment density, test layout, and when the code adds a module versus extending one. Note whether each convention holds everywhere or only in one area or capability. Leave out naming: that belongs to a glossary.
