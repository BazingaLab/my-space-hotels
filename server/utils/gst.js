// India GST slabs for hotel accommodation (SAC 9963), effective from the
// 22 Sept 2025 GST 2.0 reform. Rate is determined by the room's nightly
// tariff, then applied uniformly across the whole stay.
//   <= ₹1,000/night     -> 0%  (Nil)
//   ₹1,001-₹7,500/night -> 5%  (no ITC)
//   > ₹7,500/night      -> 18% (with ITC)
// If the GST Council revises these slabs again, this is the one place to update.
export function getGstRate(nightlyRate) {
  const rate = Number(nightlyRate) || 0;
  if (rate <= 1000) return 0;
  if (rate <= 7500) return 5;
  return 18;
}

// subtotal: pre-tax room charge for the whole stay (nightlyRate * nights).
// Returns the rate applied and rounded rupee amounts. grandTotal is what
// the guest actually pays; subtotal stays the commission/wallet base.
export function calculateGst(nightlyRate, subtotal) {
  const gstRate = getGstRate(nightlyRate);
  const gstAmount = +(Number(subtotal) * gstRate / 100).toFixed(2);
  const grandTotal = +(Number(subtotal) + gstAmount).toFixed(2);
  return { gstRate, gstAmount, grandTotal };
}