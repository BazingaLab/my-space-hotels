// Small, shared, deliberately permissive format checks — used both as an
// early client-side hint and mirrored server-side (server/utils/validation.js)
// as the actual authoritative check. Not a full phone/email verification
// (no OTP/confirmation), just catching obviously-malformed input before
// it's saved.

export function isValidEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Accepts an optional leading + and 10-15 digits, allowing spaces/dashes
// in the input (stripped before checking) — permissive enough for Indian
// numbers with or without a +91 country code, without hard-coding India
// as the only valid country.
export function isValidPhone(value) {
  if (!value) return false;
  const stripped = value.replace(/[\s-]/g, "");
  return /^\+?[0-9]{10,15}$/.test(stripped);
}
