// Mirrors server/utils/gst.js — kept in sync manually. Used here only for
// the live price breakdown before checkout; the server remains the source
// of truth for what's actually stored and charged.
export function getGstRate(nightlyRate) {
  const rate = Number(nightlyRate) || 0;
  if (rate <= 1000) return 0;
  if (rate <= 7500) return 5;
  return 18;
}

export function calculateGst(nightlyRate, subtotal) {
  const gstRate = getGstRate(nightlyRate);
  const gstAmount = +(Number(subtotal) * gstRate / 100).toFixed(2);
  const grandTotal = +(Number(subtotal) + gstAmount).toFixed(2);
  return { gstRate, gstAmount, grandTotal };
}