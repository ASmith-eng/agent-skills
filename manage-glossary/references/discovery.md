# Discovery

Find the domain terms, how they map to code, and where the code disagrees with itself. Use the cheapest sources first, and stop once you have enough evidence to classify each finding.

## Sources, in order

1. **Existing docs.** Feature docs (especially Business Rules sections), README, CLAUDE.md/AGENTS.md, ADRs, API specs (OpenAPI, GraphQL schema) and any older glossary. These give domain terms and their meanings. Treat them as evidence, not settled fact, because docs go out of date. Where a doc disagrees with the code or another doc, note it and raise it as a question.
2. **Data model.** ORM models, migrations, schema files and core types. These give the entity list, code names and relationships. Most of the glossary comes from here.
3. **UI copy.** i18n and translation files, and user-facing strings. These show the business names, which often differ from the code names. "Business name" lines come from here.
4. **Identifier sampling.** Sample a spread of service, controller and module files to find verb and boolean conventions and synonyms in use. Count occurrences instead of reading everything.
5. **Recency.** For each conflict, check git history to see which variant newer code uses. Treat it as a hint only. Reformats, file moves and renames reset history, and file counts and call-site counts can disagree.

**Bounding:** the data model is the boundary. Entities outside it come only from docs or the user's answers. Don't record every local variable name, only domain terms and house rules.

## Where things live

Look in the places for the project's stack, and confirm by looking. Projects move things.

| Stack | Data model | Migrations / schema | UI copy |
|---|---|---|---|
| Rails | `app/models/` | `db/schema.rb`, `db/structure.sql`, `db/migrate/` | `config/locales/*.yml` |
| Django | `*/models.py`, `*/models/` | `*/migrations/` | `locale/*/LC_MESSAGES/*.po`, templates |
| Laravel | `app/Models/` | `database/migrations/` | `lang/`, `resources/lang/` |
| Symfony / Doctrine | `src/Entity/` | `migrations/` | `translations/` |
| Spring / JPA | `@Entity` classes | `db/migration/` (Flyway), `db/changelog/` (Liquibase) | `messages*.properties` |
| .NET / EF Core | `DbContext` and entity classes | `Migrations/` | `*.resx` |
| Prisma | `schema.prisma` | `prisma/migrations/` | (front end) |
| TypeORM / MikroORM / Sequelize | `@Entity` / `*.entity.ts` / `define()` | `migrations/` | (front end) |
| Drizzle | `schema.ts` (`pgTable`, `mysqlTable`) | `drizzle/` | (front end) |
| Go | structs with `gorm` or `db` tags, `sqlc` queries | `migrations/`, `*.sql` | templates |
| Elixir / Phoenix | `schema` blocks in `lib/*/` | `priv/repo/migrations/` | `priv/gettext/` |
| GraphQL / REST APIs | `*.graphql`, `openapi.{yaml,json}` | | |
| Front end | `types/`, `models/`, API clients, stores | | i18next / react-intl / vue-i18n `locales/*.json`, Angular `*.xlf` |

## Counting and recency

Counts back up every question, so get real numbers. Don't estimate.

```bash
git grep -c -w -i client -- ':!*.lock' | wc -l          # files mentioning the word
git grep -w -i -o client | wc -l                         # occurrences
git grep -l -w -i client | cut -d/ -f1-2 | sort | uniq -c | sort -rn   # where it lives
git log -1 --format='%as' -S'Client' -- src/             # when it was last added or removed
git log --since='12 months ago' --format= --name-only -S'Customer' | sort -u | wc -l  # recent activity
```

`-w` matches whole words, so it misses `activeClients`. For compound names, also search case-insensitively for the bare word and skim the hits. Exclude generated code, vendored code and fixtures when you report counts.

## Spotting families

Group entities into families as you go, because each family becomes one group file. Signs that entities belong together:

- they share a folder or module, or their files sit side by side in type-based folders (`Protocol.js` and `CustomerProtocol.js`)
- they reference each other by key (`protocolId` on an assignment, `templateIds` on a protocol)
- one is created from another, or they move through one workflow (definition → assignment → execution)
- the existing docs describe them together, in one architecture page or one docs section
- the same features change them together (`git log --format= --name-only` shows the files in the same commits)

## Spotting synonyms

These are guesses until the user confirms them:

- foreign keys that don't match their table (`client_id` → `customers`)
- models or types with near-identical fields
- the same entity under different names in the API, the database and the UI
- comments or docs that use two terms for one thing
- variables named after one term but typed as another (`client: Customer`)

## Spotting collisions

Collisions are where agents go wrong most, so the user confirms each one. Confirmed collisions are the first candidates for the watch list.

- **Near-synonyms in everyday English** that mean different things in the code. `Order` and `Fulfilment` could both describe "a service someone is getting"; `Account` and `User`; `Plan` and `Subscription`; `Item`, `Product` and `LineItem`; `Job` and `Task`.
- **Names holding another entity's data:** a variable named after one entity but filled from another's table or query (`activeOrders` filled from the `fulfilments` table). Look in the code that loads lists: queries, repository calls and API handlers.
- **Business names that are another entity's code name.** The UI calls a Fulfilment a "Job", but there's also a `Job` model for background work.
- **Generic words claimed by a domain:** "status", "type", "event", "session" or "account" might mean something specific in one part of the codebase.

## Naming rules

Look for house rules only where the codebase shows a deliberate pattern that goes beyond the usual defaults. Common places:

- **Read verbs:** `get` vs `fetch` vs `load` vs `find`, and whether they split by sync/async, cache/network, or nullable/throwing.
- **Write verbs:** `create`/`add`/`insert`, `update`/`save`/`patch`, `delete`/`remove`/`archive`.
- **Booleans:** `is`/`has`/`can`/`should` prefixes, or none.
- **Collections:** plurals vs `List`/`Array` suffixes; `byId` maps.
- **Events and handlers:** `onX` vs `handleX`; past-tense event names (`OrderPaid`).
- **IDs and keys:** `orderId` vs `order_id` vs `orderID` at each layer.

Count the variants for each. If one clearly wins and the losers are only in old code, it's a candidate rule to confirm. If they're split, it's a conflict to ask about.
