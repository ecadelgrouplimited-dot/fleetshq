// Pricing engine — turns a service type + distance + weight into a quote.
// Shared by the booking flow (quote) and invoicing (so quote ≈ invoice).

const VAT_RATE = 0.20;
const WEIGHT_FREE_KG = 100;       // first 100kg included
const WEIGHT_RATE_PER_KG = 0.18;  // surcharge per kg above the free allowance

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * @param {object} svc  ServiceType { baseRate, perMileRate, name }
 * @param {number} distanceMiles
 * @param {number} weightKg
 * @returns {{ lines: Array, net: number, vat: number, total: number }}
 */
function quote(svc, distanceMiles = 0, weightKg = 0) {
  const base = round2(Number(svc?.baseRate) || 0);
  const perMile = Number(svc?.perMileRate) || 0;
  const miles = Math.max(0, Number(distanceMiles) || 0);
  const kg = Math.max(0, Number(weightKg) || 0);

  const mileage = round2(perMile * miles);
  const overweight = Math.max(0, kg - WEIGHT_FREE_KG);
  const weight = round2(overweight * WEIGHT_RATE_PER_KG);

  const lines = [
    { label: `${svc?.name || 'Service'} base rate`, amount: base },
    { label: `Mileage — ${miles.toFixed(0)} mi @ £${perMile.toFixed(2)}/mi`, amount: mileage },
  ];
  if (weight > 0) {
    lines.push({ label: `Weight surcharge — ${overweight.toFixed(0)}kg over ${WEIGHT_FREE_KG}kg`, amount: weight });
  }

  const net = round2(base + mileage + weight);
  const vat = round2(net * VAT_RATE);
  const total = round2(net + vat);

  return { lines, net, vat, total, vatRate: VAT_RATE };
}

module.exports = { quote, VAT_RATE, round2 };
