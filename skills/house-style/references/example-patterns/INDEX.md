---
schema: 1
reconciled_at: 3f2a91c
---
# Patterns

The team's decided patterns. This catalog isn't exhaustive: it covers scenarios where the codebase gives mixed or misleading signals, and patterns decided before anything uses them. If a scenario isn't listed, follow the placement table and the neighbouring code. Ask only if there's no clear precedent. Any rule here can be broken where following it would be awkward or inefficient: ask the user first.

## Architecture
**Paradigm:** services, policies, repositories and hooks are exported functions; controllers and commands are classes, one per file.

**Patterns:**
- MVC with a service layer (hybrid): business logic lives in services, not models or controllers. Code is grouped by feature first, then by layer.
- Repository: services reach the database only through their feature's repository, which returns plain typed objects.
- Command: background work is a queued command. See [Queued command](api.md#queued-command).
- Query hooks and mutation services: the web app reads through query hooks and writes through mutation services. See [Mutation service](web-app.md#mutation-service).

**Stance:** Web app: React conventions, with house variants linked above. API: Express conventions with a house service layer.

| Kind of code | Location | Example |
|---|---|---|
| Request handling | `src/<feature>/controllers/` | `src/orders/controllers/OrdersController.ts` |
| Business logic | `src/<feature>/services/` | `src/fulfilment/services/scheduleVisit.ts` |
| Permission checks | `src/<feature>/policies/` | `src/orders/policies/canRefund.ts` |
| Data access | `src/<feature>/repositories/` | `src/orders/repositories/orderRepository.ts` |
| Background commands | `src/queue/commands/` | `src/queue/commands/SendVisitReminder.ts` |
| Partner API clients | `src/integrations/<partner>/` | `src/integrations/stripe/client.ts` |
| Migrations | `src/db/migrations/` | `src/db/migrations/2026_09_add_visit_notes.ts` |
| Components and hooks | `src/web/<feature>/` | `src/web/visits/VisitList.tsx` |
| Mutation services | `src/web/services/` | `src/web/services/updateVisit.ts` |
| Shared helpers | `src/lib/` (only when used by two or more features) | `src/lib/money.ts` |

**Don't introduce:**
- **New layers or folder conventions:** if new code doesn't fit a placement row, ask.
- **Generic base classes** (`BaseService`, `BaseRepository`): they couple every feature to one hierarchy. Share code through helpers in `src/lib/`.
- **Active record or ORM entities with behaviour:** rules would split between entities and services. Repositories return plain objects; rules live in services.
- **An event bus or domain events:** side effects become invisible to the caller. Dispatch a queued command, or use the transactional outbox for partners.
- **A second validation library** alongside Zod: rules would be defined twice. Extend the feature's Zod schema.
- **(Web app) Class components and HOCs:** they can't use the house hooks (`useForm`, query hooks). Write function components and hooks.
- **(Web app) A form library called directly** (React Hook Form, Formik): forms would bypass the API's schema and the mutation services. Build forms with `useForm`; multi-step forms are an open decision.

## Capability map
### [Web app (React, TypeScript)](web-app.md) · `src/web/**`
- [Reading and changing data](web-app.md#reading-and-changing-data): query hooks for reads, mutation services for writes
- [Forms](web-app.md#forms): form state, validation and submit
- [Testing](web-app.md#testing): component and hook tests

### [API (Node, Express)](api.md) · `src/**`, except `src/web/**`
- [Validation and permissions](api.md#validation-and-permissions): checking request input and who may do what
- [Background work](api.md#background-work): queued commands and scheduling
- [External integrations](api.md#external-integrations): calling partner APIs, notifying partners of changes
- [Schema changes](api.md#schema-changes): migrations and data backfills
- [Testing](api.md#testing): service and endpoint tests

## Don't copy (area-wide)
- `src/legacy/**`: callback-style services from before the 2024 rewrite; error handling is inconsistent. Use the service layer in Architecture.
- Top-level `src/controllers/` and `src/services/`: the old layer-first structure, still holding the checkout code. Put new code in feature folders.

## Style (cross-cutting)
- **Errors:** throw typed errors from `src/lib/errors.ts`; don't return error objects. `throw new NotFoundError('order', id)`
- **Logging:** log through a child of `logger` (`src/lib/logger.ts`) carrying the entity ID, so lines can be traced per Order or Fulfilment. A command that handles many entities makes one child per entity, not one for the batch. `logger.child({ fulfilmentId }).info('visit booked')`
- **Money:** amounts are integer pence, handled with `src/lib/money.ts`. Never floats, never formatted outside the web app.
- Naming lives in the glossary: `documentation/conventions/glossary/INDEX.md`.

## Tooling
ESLint (`eslint.config.js`), Prettier (`.prettierrc`) and `tsconfig.json` are the authority for formatting and type rules.

## Open decisions
- [Forms](web-app.md#forms): form library for multi-step forms. Not yet defined — ask before inventing.
- [Reading and changing data](web-app.md#reading-and-changing-data): whether mutations update the screen optimistically. Not yet defined — ask before inventing.
