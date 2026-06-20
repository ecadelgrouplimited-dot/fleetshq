// Shipment spine service — references, lifecycle, tracking, allocation, POD, invoicing.
const prisma = require('../config/database');
const pricing = require('./pricing.service');

// ── Status presentation ───────────────────────────────────────────────
const STATUS_LABEL = {
  quote: 'Quote', booked: 'Booked', allocated: 'Allocated', collected: 'Collected',
  in_transit: 'In transit', out_for_delivery: 'Out for delivery', delivered: 'Delivered',
  failed: 'Failed', cancelled: 'Cancelled',
};
const STATUS_BADGE = {
  quote: 'badge-slate', booked: 'badge-blue', allocated: 'badge-purple', collected: 'badge-blue',
  in_transit: 'badge-blue', out_for_delivery: 'badge-amber', delivered: 'badge-green',
  failed: 'badge-red', cancelled: 'badge-slate',
};
// Lifecycle order for the public timeline.
const LIFECYCLE = ['booked', 'allocated', 'collected', 'in_transit', 'out_for_delivery', 'delivered'];

const statusLabel = (s) => STATUS_LABEL[s] || s;
const statusBadge = (s) => STATUS_BADGE[s] || 'badge-slate';

// ── Reference / invoice number generators ─────────────────────────────
function makeReference() {
  const n = Math.floor(1000 + Math.random() * 9000);
  const tail = Date.now().toString(36).slice(-3).toUpperCase();
  return `256-${n}${tail}`;
}
function makeInvoiceNumber() {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const n = Math.floor(100 + Math.random() * 900);
  return `INV-${ym}-${n}`;
}

// ── Create a shipment from a booking ──────────────────────────────────
async function createShipment(data, actorId) {
  const svc = data.serviceTypeId
    ? await prisma.serviceType.findUnique({ where: { id: data.serviceTypeId } })
    : null;
  const priced = pricing.quote(svc, data.distanceMiles, data.weightKg);

  const reference = makeReference();
  const shipment = await prisma.shipment.create({
    data: {
      reference,
      customerId: data.customerId || null,
      serviceTypeId: svc?.id || null,
      serviceName: svc?.name || data.serviceName || 'Standard delivery',
      status: 'booked',
      pickupContact: data.pickupContact || null,
      pickupAddress: data.pickupAddress,
      pickupPostcode: data.pickupPostcode || null,
      deliveryContact: data.deliveryContact || null,
      deliveryAddress: data.deliveryAddress,
      deliveryPostcode: data.deliveryPostcode || null,
      parcelCount: data.parcelCount || 1,
      weightKg: data.weightKg || 0,
      distanceMiles: data.distanceMiles || 0,
      priceNet: priced.net,
      priceVat: priced.vat,
      priceTotal: priced.total,
      priceBreakdown: priced.lines,
      collectionDate: data.collectionDate || null,
      etaWindow: data.etaWindow || null,
      instructions: data.instructions || null,
      createdById: actorId || null,
    },
  });

  await addEvent(shipment.id, 'booked', 'Shipment booked', `Reference ${reference} created.`, null, actorId);
  return shipment;
}

async function addEvent(shipmentId, type, label, detail, location, actorId) {
  return prisma.trackingEvent.create({
    data: { shipmentId, type, label, detail: detail || null, location: location || null, actorId: actorId || null },
  });
}

// ── Dispatch allocation ───────────────────────────────────────────────
async function allocate(shipmentId, { driverId, vehicleId }, actorId) {
  const job = await prisma.job.upsert({
    where: { shipmentId },
    update: { driverId, vehicleId, status: 'offered', allocatedById: actorId || null, allocatedAt: new Date() },
    create: { shipmentId, driverId, vehicleId, status: 'offered', allocatedById: actorId || null, allocatedAt: new Date() },
  });
  await prisma.shipment.update({ where: { id: shipmentId }, data: { status: 'allocated' } });
  await addEvent(shipmentId, 'allocated', 'Allocated to driver', 'A driver and vehicle have been assigned.', null, actorId);
  return job;
}

// ── Status transitions (driver / dispatch) ────────────────────────────
const EVENT_FOR_STATUS = {
  collected: ['collected', 'Collected', 'Goods collected from pickup.'],
  in_transit: ['in_transit', 'In transit', 'Shipment is on the move.'],
  out_for_delivery: ['out_for_delivery', 'Out for delivery', 'Final leg to the delivery address.'],
  failed: ['exception', 'Delivery failed', 'Delivery could not be completed.'],
  cancelled: ['exception', 'Cancelled', 'Shipment cancelled.'],
};

async function setStatus(shipmentId, status, actorId, detail) {
  await prisma.shipment.update({ where: { id: shipmentId }, data: { status } });
  const ev = EVENT_FOR_STATUS[status];
  if (ev) await addEvent(shipmentId, ev[0], ev[1], detail || ev[2], null, actorId);
  if (status === 'collected') {
    await prisma.job.updateMany({ where: { shipmentId }, data: { status: 'en_route' } });
  }
}

// ── Proof of delivery ─────────────────────────────────────────────────
async function recordPod(shipmentId, { recipientName, signatureData, notes, otpVerified }, actorId) {
  await prisma.proofOfDelivery.upsert({
    where: { shipmentId },
    update: { recipientName, signatureData, notes, otpVerified: !!otpVerified, deliveredAt: new Date() },
    create: { shipmentId, recipientName, signatureData, notes, otpVerified: !!otpVerified },
  });
  await prisma.shipment.update({ where: { id: shipmentId }, data: { status: 'delivered' } });
  await prisma.job.updateMany({ where: { shipmentId }, data: { status: 'completed' } });
  await addEvent(shipmentId, 'delivered', 'Delivered', recipientName ? `Signed by ${recipientName}.` : 'Proof of delivery captured.', null, actorId);
}

// ── Invoicing (invoice-only MVP) ──────────────────────────────────────
async function generateInvoice(shipmentId, actorId) {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new Error('not_found');
  const existing = await prisma.invoice.findUnique({ where: { shipmentId } });
  if (existing) return existing;

  const due = new Date();
  due.setDate(due.getDate() + 14);
  return prisma.invoice.create({
    data: {
      number: makeInvoiceNumber(),
      customerId: shipment.customerId || null,
      shipmentId: shipment.id,
      status: 'issued',
      subtotal: shipment.priceNet,
      vat: shipment.priceVat,
      total: shipment.priceTotal,
      lines: shipment.priceBreakdown || [],
      dueDate: due,
      createdById: actorId || null,
    },
  });
}

// ── Public tracking timeline ──────────────────────────────────────────
function buildTimeline(shipment, events) {
  const reached = new Set(events.map((e) => e.type));
  const currentIdx = LIFECYCLE.indexOf(shipment.status);
  return LIFECYCLE.map((step, i) => {
    let state = 'pending';
    if (i < currentIdx || reached.has(step) || shipment.status === 'delivered') state = 'done';
    if (i === currentIdx) state = 'active';
    return { step, label: STATUS_LABEL[step], state };
  });
}

module.exports = {
  statusLabel, statusBadge, LIFECYCLE,
  makeReference, makeInvoiceNumber,
  createShipment, addEvent, allocate, setStatus, recordPod, generateInvoice, buildTimeline,
};
