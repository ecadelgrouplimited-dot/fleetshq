/**
 * FLEET.HQ subscription tier catalogue.
 *
 * Single source of truth for tiers shown on the public registration flow and
 * used by provisioning. Prices are annual (prepaid licence, per the business
 * model). `priceAnnualPence: null` means pricing is not yet published — the UI
 * shows the tier without a figure and activation is confirmed by the team.
 * Fill in real prices once commercial terms are agreed (see
 * docs/ONBOARDING_AND_BILLING_PLAN.md §5 / §10).
 */

const PLANS = {
  starter: {
    key: 'starter',
    label: 'Starter',
    fleetBand: '1-5',
    fleetLabel: '1–5 vehicles',
    priceAnnualPence: null,
    blurb: 'Compliance, drivers and vehicles for small operators.',
    features: ['Full compliance hub', 'Driver & vehicle records', 'Daily walk-around checks', 'Email alerts & digests'],
  },
  growth: {
    key: 'growth',
    label: 'Growth',
    fleetBand: '6-20',
    fleetLabel: '6–20 vehicles',
    priceAnnualPence: null,
    blurb: 'For growing fleets that need dispatch and finance too.',
    features: ['Everything in Starter', 'Dispatch & shipments', 'Invoicing & finance', 'Learning management'],
  },
  scale: {
    key: 'scale',
    label: 'Scale',
    fleetBand: '21-50',
    fleetLabel: '21–50 vehicles',
    priceAnnualPence: null,
    blurb: 'Multi-branch operations with full analytics.',
    features: ['Everything in Growth', 'Multi-branch support', 'Executive analytics', 'Priority support'],
  },
  enterprise: {
    key: 'enterprise',
    label: 'Enterprise',
    fleetBand: '50+',
    fleetLabel: '50+ vehicles',
    priceAnnualPence: null,
    blurb: 'Custom terms, onboarding assistance and SLAs.',
    features: ['Everything in Scale', 'Custom onboarding', 'Contractual SLA', 'Dedicated account manager'],
  },
};

const FLEET_BANDS = ['1-5', '6-20', '21-50', '50+'];

/** Suggested tier for a fleet-size band (registration pre-selects it). */
const planForFleetBand = (band) => Object.values(PLANS).find((p) => p.fleetBand === band) || PLANS.starter;

const getPlan = (key) => PLANS[key] || null;

const formatPrice = (pence) => (pence == null ? null : `£${(pence / 100).toLocaleString('en-GB')}`);

module.exports = { PLANS, FLEET_BANDS, planForFleetBand, getPlan, formatPrice };
