---
schema: 1
reconciled_at: 3f2a91c
---
# Glossary

The domain vocabulary for the booking site and staff app, and the names to use in code. Read this file before naming new entities, variables or functions, then read the group files for the area you're working in.

## Watch list
- **order** means the purchase and its payment status only. Service progress is a [Fulfilment](fulfilment.md), so jobs in progress are `activeFulfilments`, never `activeOrders`.
- **job** is the staff app's name for a Fulfilment. Don't use it in code. `Job` (in `src/queue/`) is the background-job runner and has nothing to do with customers.
- **booking** is the website's name for an Order. Don't use it in code.
- **status** on its own is ambiguous. Write `paymentState` for an Order and `fulfilmentState` for a Fulfilment.

## Term index
| Term | Belongs to |
|---|---|
| booking | [Order](order.md) (business name) |
| fulfilment | [Fulfilment](fulfilment.md) |
| fulfilment state | [Fulfilment](fulfilment.md) |
| job | [Fulfilment](fulfilment.md) (business name), not the `Job` queue runner |
| line item | [Order](order.md) |
| order | [Order](order.md), not service progress |
| payment state | [Order](order.md) |
| refund | [Order](order.md) |
| visit | [Fulfilment](fulfilment.md) |

## Naming rules
- **Reading data:** `get` for synchronous or cached reads, `fetch` for network calls. `getCurrentOrder()`, `fetchFulfilments()`
- **Booleans:** `is`/`has` prefix, never `can` (permissions use `allows`). `isPaid`, `hasOpenVisit`, `allowsRefund()`
- **States:** a concept's state field is `<concept>State`, never `status`. `paymentState`, `fulfilmentState`
- **Events:** past tense, named after the concept that changed. `OrderPaid`, `VisitCompleted`

## Open decisions
- `Account` vs `Customer` for the person who logs in and pays. Ask before using either.
- Whether a cancelled Visit is rescheduled (`reschedule`) or replaced by a new Visit. Ask before adding either.
