---
schema: 1
group: Service delivery
paths: [src/fulfilment/**, src/staff-app/**]
code: [Fulfilment, fulfilments, fulfilmentId, activeFulfilments, fulfilmentState, Visit, visits, visitId]
avoid:
  - term: job
    reason: "UI-only name (Job in the staff app); code has used Fulfilment since the 2024 rename"
    allow: [Job, JobRunner, enqueueJob]
  - term: task
    reason: "legacy name, only in src/legacy/, last touched 2023"
  - term: order
    reserved_by: Bookings
    allow: [sortOrder, orderBy, displayOrder]
  - term: booking
    reserved_by: Bookings
---
# Service delivery

Doing the work a customer paid for: one Fulfilment per service bought, carried out over one or more Visits by a crew. It starts when an Order in [Bookings](bookings.md) is paid.

## Fulfilment

The delivery of one service that was ordered, such as hedge trimming or lawn care, and its progress.

- **Business name:** "Job" in the staff app and on crew schedules
- **Relationships:** created from one `OrderLineItem`; belongs to one `Order`; has many `Visit`
- **Vocabulary:** states `scheduled`, `in_progress`, `completed`, `cancelled`; actions schedule, start, complete

A Fulfilment is complete when its last Visit is complete.

## Visit

One trip by a crew to the property to do some or all of a Fulfilment.

- **Relationships:** belongs to one `Fulfilment`
- **Vocabulary:** states `booked`, `done`, `missed`, `cancelled`; actions book, complete, cancel

Cancelling a Visit doesn't cancel the Fulfilment.
