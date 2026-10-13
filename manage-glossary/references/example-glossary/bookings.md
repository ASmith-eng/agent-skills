---
schema: 1
group: Bookings
paths: [src/orders/**, src/checkout/**]
code: [Order, orders, orderId, OrderLineItem, paymentState, Refund, refunds]
avoid:
  - term: booking
    reason: "website name only; the bookings table was renamed to orders in 2022"
  - term: purchase
    reason: "lost to Order (6 files vs 48), only in src/checkout/legacy/"
  - term: fulfilment
    reserved_by: Service delivery
  - term: visit
    reserved_by: Service delivery
---
# Bookings

How a customer buys services: an Order with its line items, paid once up front, and any refunds against it. Paying an Order creates the Fulfilments in [Service delivery](service-delivery.md).

## Order

A purchase made on the website or by phone, and its payment state.

- **Business name:** "Booking" on the website and in confirmation emails
- **Relationships:** belongs to one `Customer`; has many `OrderLineItem`; has many `Refund`; has many `Fulfilment`
- **Vocabulary:** payment states `pending`, `paid`, `part_refunded`, `refunded`; actions pay, refund

An Order is paid once, up front, even when its Fulfilments run for months. Anything about whether the work has been done belongs to Service delivery.

## OrderLineItem

One service on an Order, with its price, such as "Hedge trimming, front and back".

- **Relationships:** belongs to one `Order`; becomes one `Fulfilment` when the Order is paid

## Refund

Money returned against an Order, in full or in part.

- **Relationships:** belongs to one `Order`
- **Vocabulary:** reasons `cancelled_by_customer`, `missed_visit`, `goodwill`
