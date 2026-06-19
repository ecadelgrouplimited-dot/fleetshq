# 11 — Finance Panel

> **Purpose:** the money side — turn delivered shipments into invoices, take payments, pay drivers,
> control costs, and keep the books (VAT, P&L, cash flow) for a UK operator.
> **Primary users:** Finance Officer (Director read; Client pays own invoices; Driver views own pay).
> **Status overall:** 🔴 New.

---

## 1. Navigation & screens

| Section | Screens | Status |
|---------|---------|--------|
| **Finance Dashboard** | Revenue, outstanding, cash position, margin | 🔴 |
| **Revenue Tracking** | By service/customer/period | 🔴 |
| **Expense Tracking** | Costs by category/vehicle/branch | 🔴 |
| **Invoicing** | Create, send, status, statements | 🔴 |
| **Payments** | Receipts, gateway, reconciliation | 🔴 |
| **Refunds** | Issue + track | 🔴 |
| **Driver Payments** | Earnings → pay runs | 🔴 |
| **Accounting** | VAT, P&L, cash flow | 🔴 |
| **Financial Reports & Audit** | Statements, exports, audit trail | 🔴 |

---

## 2. Key views

### 2.1 Finance dashboard
KPIs: revenue (period), outstanding receivables (aged), cash in, expenses, gross margin, top customers,
overdue invoices. Charts + drill-through.

### 2.2 Invoicing
- Generate an invoice from one or more **delivered shipments** (lines from the **pricing engine** used
  at quote time — so quote ≈ invoice). Manual line items + adjustments. VAT handling.
- States: draft → sent → part-paid → paid → overdue → cancelled. PDF + email to client. Statements per
  customer. Account customers (terms) vs. pay-per-booking.

### 2.3 Payments & refunds
Record/take payments (gateway or manual), reconcile against invoices, part-payments, receipts; issue
**refunds** against payments with reason + audit. Client pays from their portal (`07`).

### 2.4 Driver payments
Aggregate **driver earnings** from completed jobs (rate per job/mile/parcel), overtime/bonuses/
deductions → **pay runs** per period → export to payroll (HR `06`) or pay directly. Driver sees own
statement (`08`).

### 2.5 Expense tracking
Costs by category (fuel, maintenance, wages, insurance, overheads), by **vehicle**/**branch** — pulls
fuel + maintenance spend from Fleet (`10`). Supports cost-per-mile and per-shipment margin.

### 2.6 Accounting
VAT summary (returns-ready), **P&L** (revenue − expenses), **cash flow**; period close; export to
external accounting (Xero/QuickBooks/CSV) — full ledger is likely **export-first** for MVP, not a
double-entry engine in-house.

### 2.7 Reports & audit
Revenue, AR aging, payments, refunds, driver pay, VAT, P&L, cash flow; immutable **audit trail** of
financial actions; export CSV/PDF.

---

## 3. Data
`Invoice, Payment, Refund, DriverPayment, Expense, LedgerEntry/AccountingPeriod, Shipment(ref),
Customer(ref), Vehicle(ref for expense)`. See `02`.

## 4. Workflows
Delivered shipment→invoice→send→pay→reconcile (→refund); period→driver pay run→export; period close→VAT/
P&L. All audit-logged.

## 5. Alerts
Invoice overdue, payment failed/received, refund issued, low cash threshold, VAT period due, driver pay
run pending, large/anomalous expense.

## 6. Permissions
Finance full; Director read all; HR reads payroll inputs; Fleet reads its spend; Client pays/views own;
Driver views own pay. (`01`)

## 7. MVP vs later
- **MVP (P1 light → P4 full):** invoice a delivered shipment, view/pay invoice (client), record
  payments, basic revenue/outstanding dashboard. (Enough to close the shipment→cash loop.)
- **Later:** refunds workflow, full driver pay runs, expense tracking, VAT/P&L/cash-flow accounting,
  accounting-software integration, multi-currency.

## 8. Open questions
- **Card payments live** in MVP (gateway) or **invoice-only**? (ties to `05`,`07`)
- **In-app accounting vs. export** to Xero/QuickBooks — *(assume export for MVP)*.
- Driver pay model: per job / per mile / per parcel / salaried — likely a mix; needs client confirmation.

*Next: [12 — Compliance & Safety Panel](12-panel-compliance-safety.md)*
