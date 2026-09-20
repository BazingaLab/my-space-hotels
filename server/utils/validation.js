// Server-side mirror of client/src/lib/validation.js — the client check is
// only a UX hint; this is the actual authoritative validation, since a
// client-side-only check can always be bypassed by calling the API directly.

export function isValidEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function isValidPhone(value) {
  if (!value) return false;
  const stripped = String(value).replace(/[\s-]/g, "");
  return /^\+?[0-9]{10,15}$/.test(stripped);
}
