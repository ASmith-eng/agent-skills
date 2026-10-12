---
schema: 1
group: Order
paths: [src/orders/**, src/checkout/**]
code: [Order, orders, orderId, OrderLineItem, paymentState]
avoid:
  - term: booking
    reason: "website name only; the bookings table was renamed to orders in 2022"
  - term: purchase
    reason: "lost to Order (6 files vs 48), only in src/checkout/legacy/"
  - term: fulfilment
    reserved_by: Fulfilment
  - term: visit
    reserved_by: Fulfilment
---
# Order

A purchase made on the website or by phone, its line items and its payment state.

- **Business name:** "Booking" on the website and in confirmation emails
- **Relationships:** belongs to one `Customer`; has many `OrderLineItem`; has many `Fulfilment`
- **Vocabulary:** payment states `pending`, `paid`, `part_refunded`, `refunded`; actions pay, refund

An Order is paid once, up front, even when its Fulfilments run for months. Anything about whether the work has been done belongs to Fulfilment.
