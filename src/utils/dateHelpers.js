const { ALERT_THRESHOLDS } = require('./constants');

const daysUntil = (date) => {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
};

const isOverdue = (date) => {
  if (!date) return false;
  return daysUntil(date) < 0;
};

const alertSeverity = (days) => {
  if (days === null) return null;
  if (days <= ALERT_THRESHOLDS.CRITICAL) return 'critical';
  if (days <= ALERT_THRESHOLDS.WARNING)  return 'warning';
  if (days <= ALERT_THRESHOLDS.NOTICE)   return 'notice';
  return null;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const calcNextPmi = (lastPmiDate, intervalWeeks) => {
  if (!lastPmiDate || !intervalWeeks) return null;
  const next = new Date(lastPmiDate);
  next.setDate(next.getDate() + intervalWeeks * 7);
  return next;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

module.exports = { daysUntil, isOverdue, alertSeverity, formatDate, calcNextPmi, addDays };
