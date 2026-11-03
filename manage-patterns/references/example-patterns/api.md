# API (Node, Express)

## Validation and permissions
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| Validate request input | Zod schema, parsed in the controller | `src/orders/schemas.ts` | a second validation library | |
| Check whether a user may do something | Policy function, called from the service, not the controller | `src/orders/policies/canRefund.ts` | | |

## Background work
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| Run work in the background | Queued command, dispatched with `JobBus.dispatch()` (`src/queue/jobBus.ts`) | `src/queue/commands/SendVisitReminder.ts` | `setTimeout` or `setImmediate`, an event bus | Triggered by a request or an event. [Queued command](#queued-command) |
| Run work on a clock (nightly, weekly) | Scheduled command, registered in `src/queue/schedule.ts` | `src/queue/commands/CloseStaleFulfilments.ts` | | Recurring work with no trigger. Not for one-off delays: see the accepted variant below. |

### Queued command
Standard command pattern, but dispatched with `JobBus.dispatch()`, never the queue client directly. Commands hold IDs, not entities. `dispatch` is async, so await it: `await JobBus.dispatch(new SendVisitReminder({ visitId }))`.

**Accepted variant:** a one-off delayed command may be dispatched with `JobBus.schedule()` instead. Accepted 2026-10 as the trade-off for delayed reminders.

**Don't copy:** `setTimeout` or `setImmediate` in services (`src/checkout/confirmOrder.ts` and similar): the work is lost if the process restarts. Dispatch a queued command.

## External integrations
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| Call an external API | `HttpClient` wrapper (`src/lib/httpClient.ts`) | `src/integrations/stripe/client.ts` | direct `fetch` with manual retries | |
| Notify a partner system of a change | Transactional outbox (Planned) | None yet | an event bus | [Transactional outbox](#transactional-outbox) |

### Transactional outbox
**Planned:** nothing uses this yet. When a change must reach a partner system, write an outbox row in the same transaction as the change, and let a queued command deliver it. Never call the partner from inside the transaction. Reference: https://microservices.io/patterns/data/transactional-outbox.html. The first implementation becomes the exemplar.

**Don't copy:** direct `fetch` with manual retries (`src/services/mailer.ts` and similar): no tracing or shared retry policy. Use `HttpClient`.

## Schema changes
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| Change the database schema | Forward-only migration | `src/db/migrations/2026_09_add_visit_notes.ts` | | Shape only: tables, columns, indexes. |
| Fill or fix existing data | Batched backfill command | `src/queue/commands/BackfillFulfilmentState.ts` | data fixes in a migration | Data, not shape. |

**Don't copy:** data fixes inside migrations (`src/db/migrations/2025_03_fix_order_totals.ts` and similar): they aren't retried or traced, and they lock tables during deploys. Write a backfill command.

## Testing
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| Unit test a service | Service test with in-memory repositories from `makeTestRepos()` (`test/support/repos.ts`) | `src/fulfilment/services/scheduleVisit.test.ts` | | |
| Test an endpoint | Request test against the app, seeded through the factories in `test/support/factories.ts` | `test/api/orders.test.ts` | | |
| Test a queued command | `await runCommand()` (`src/queue/testing.ts`), asserting on the `JobBus` test double | `src/queue/commands/SendVisitReminder.test.ts` | | |
