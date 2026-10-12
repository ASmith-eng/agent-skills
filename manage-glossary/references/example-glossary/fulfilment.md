---
schema: 1
group: Fulfilment
paths: [src/fulfilment/**, src/staff-app/**]
code: [Fulfilment, fulfilments, fulfilmentId, activeFulfilments, fulfilmentState, Visit, visits]
avoid:
  - term: job
    reason: "UI-only name (Job in the staff app); code has used Fulfilment since the 2024 rename"
    allow: [Job, JobRunner, enqueueJob]
  - term: task
    reason: "legacy name, only in src/legacy/, last touched 2023"
  - term: order
    reserved_by: Order
    allow: [sortOrder, orderBy, displayOrder]
  - term: booking
    reserved_by: Order
---
# Fulfilment

The delivery of a service that was ordered, such as hedge trimming or lawn care, and its progress.

- **Business name:** "Job" in the staff app and on crew schedules
- **Relationships:** belongs to one `Order`; has many `Visit`
- **Vocabulary:** states `scheduled`, `in_progress`, `completed`, `cancelled`; actions schedule, start, complete, cancel

A `Visit` is one trip by a crew to the property. A Fulfilment is complete when its last Visit is complete. Cancelling a Visit doesn't cancel the Fulfilment.
