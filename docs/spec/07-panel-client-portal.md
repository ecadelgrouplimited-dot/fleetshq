# 07 — Client Portal

> **Purpose:** the customer's self-service front door — book shipments, get quotes, track parcels,
> manage addresses, pay invoices, and get support. This is where the **shipment spine** begins.
> **Primary users:** Client / Customer (external). **Status overall:** 🔴 New (net-new domain).

---

## 1. Navigation & screens

| Section | Screens | Status |
|---------|---------|--------|
| **Dashboard** | Active shipments, recent activity, spend snapshot, quick book | 🔴 |
| **Booking** | New shipment, **multi-shipment**, **scheduled**, **returns** | 🔴 |
| **Quotes** | Get quote, saved quotes, accept→book | 🔴 |
| **Tracking** | Live shipment tracking, history, POD download | 🔴 |
| **Address Book** | Saved pickup/delivery addresses, contacts | 🔴 |
| **Invoices & Payments** | Invoices, pay, statements, payment methods | 🔴 |
| **Support Centre** | Tickets, live chat, complaints, claims | 🔴 |
| **Reports** | Shipment, spending, delivery-performance reports | 🔴 |

---

## 2. Key views

### 2.1 Client dashboard
Tiles: active shipments (with live status), out-for-delivery today, recent deliveries, outstanding
invoices, this-month spend; **Book a shipment** primary CTA; recent activity feed.

### 2.2 Booking flow (the core)
A **stepper**: ① service type (from pricing) → ② pickup (address book / new) → ③ delivery → ④ parcels
(count, weight, dims, value, fragile/hazmat) → ⑤ date/time window → ⑥ **live quote** (pricing engine) →
⑦ confirm + pay/account. On confirm: creates **Shipment**, fires `booked` tracking event, enters the
dispatch queue (`09`).
- **Multi-shipment:** repeat parcels/destinations in one order (CSV upload or repeat rows).
- **Scheduled:** recurring/forward-dated bookings.
- **Returns:** book a return against an existing shipment (reverse pickup/delivery).

### 2.3 Quotes
Quote without committing; quote is saved, has an expiry, converts to a booking in one click. Uses the
same pricing engine as Super Admin config (`05`).

### 2.4 Tracking
Per-shipment **timeline** (booked → allocated → collected → in-transit → out-for-delivery → delivered/
exception) with map, ETA, driver first name, and **POD** (signature/photo/OTP) once delivered.
Shareable public-track link (`04 §3.7`).

### 2.5 Address book
Saved addresses with labels, contacts, default pickup, geocoded for routing.

### 2.6 Invoices & payments
List + detail of invoices (from Finance `11`), download PDF, **pay online** (gateway), statements,
saved payment methods, account-terms balance.

### 2.7 Support centre
Raise **tickets**, **complaints**, and **claims** (e.g. damaged/missing parcel — links the shipment +
incident); **live chat** (later); status tracking; SLA on responses.

### 2.8 Reports
Shipment history, spend over time, delivery performance (on-time %, exceptions) — export.

---

## 3. Data
`Customer/ClientOrg, Address, Quote, Shipment, Parcel, TrackingEvent, POD, ReturnBooking, Invoice,
Payment, Ticket/Complaint/Claim`. See `02`.

## 4. Workflows
Quote→accept→book→track→deliver→invoice→pay; raise return; raise claim→incident→resolution.

## 5. Alerts (to the client)
Booking confirmed, collected, out-for-delivery, delivered (+POD), exception/delay, invoice issued,
payment received, ticket updated. Channel per preference (email/SMS/in-app).

## 6. Permissions
Client sees **only their own** org's bookings/shipments/invoices/addresses/tickets. Multi-user client
orgs: admin booker vs. viewer (later). (`01`)

## 7. MVP vs later
- **MVP (P1):** single booking + quote, tracking, address book, view invoices, basic tickets.
- **Later:** multi/scheduled/returns bookings, online card payment, live chat, claims workflow, client
  sub-accounts, spend analytics.

## 8. Open questions
- **Account customers (invoiced monthly)** vs. **pay-per-booking** — both, or one for MVP?
- Card payments live in MVP or invoice-only first? (ties to Finance `11` + Super Admin gateways `05`)
- Self-serve sign-up for new clients, or sales-created accounts only? *(Assume sales-created for MVP.)*

*Next: [08 — Driver Panel](08-panel-driver.md)*
