import crypto from "crypto";

// Talks to Razorpay's plain REST API with fetch + Basic Auth, so we don't

// need the `razorpay` npm package as a dependency. Same API the SDK wraps.

const BASE_URL = "https://api.razorpay.com/v1";

function authHeader() {

  const keyId = process.env.RAZORPAY_KEY_ID;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) throw new Error("Razorpay keys not configured");

  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

}

// amountRupees: e.g. 4500 for ₹4,500 — Razorpay wants the smallest currency

// unit (paise), so we *100 here, not at the call site.

export async function createOrder({ amountRupees, receipt, notes = {} }) {

  const res = await fetch(`${BASE_URL}/orders`, {

    method: "POST",

    headers: { "Content-Type": "application/json", Authorization: authHeader() },

    body: JSON.stringify({

      amount: Math.round(Number(amountRupees) * 100),

      currency: "INR",

      receipt,

      notes,

    }),

  });

  const data = await res.json();

  if (!res.ok) throw new Error(data?.error?.description || "Razorpay order creation failed");

  return data;

}

// order_id + payment_id signed with the KEY SECRET — this is what the

// Checkout success handler returns to the browser, and what we re-verify here.

export function verifyPaymentSignature({ orderId, paymentId, signature }) {

  const expected = crypto

    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)

    .update(`${orderId}|${paymentId}`)

    .digest("hex");

  return expected === signature;

}

// Webhook payloads are signed with a SEPARATE webhook secret (set in the

// Razorpay dashboard, not the same as key_secret) over the raw request body.

export function verifyWebhookSignature({ rawBody, signature }) {

  const expected = crypto

    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)

    .update(rawBody)

    .digest("hex");

  return expected === signature;

}

// Issues a real refund against an actual captured payment (not the
// order) — Razorpay refunds are always addressed by payment id.
// amountRupees may be less than the full captured amount (Razorpay
// supports partial refunds natively); omitting it there would refund
// the full remaining captured amount, so this always sends an
// explicit amount. Razorpay itself rejects amounts exceeding what's
// still refundable on that payment, and rejects an unknown/invalid
// payment id — both surface here as a thrown Error the caller must
// handle without assuming the refund happened.
export async function createRefund({ paymentId, amountRupees, reference, reason }) {
  const res = await fetch(`${BASE_URL}/payments/${paymentId}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify({
      amount: Math.round(Number(amountRupees) * 100),
      speed: "normal",
      notes: { reference, reason: reason || "" },
    }),
  });
  // Some rejections (e.g. a payment id that doesn't even match Razorpay's
  // id format) come back with an empty body rather than JSON — guard the
  // parse so that still surfaces as a clean handled error, not a crash.
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* leave null — status text below still explains what failed */ }
  if (!res.ok) {
    // Razorpay's error shape is usually {error: {description, code}}, but
    // some rejections (e.g. a payment id that doesn't match their id
    // format at all) come back as a flat {message} instead — check both
    // so the real reason surfaces instead of a generic fallback.
    const err = new Error(data?.error?.description || data?.message || `Razorpay refund failed (HTTP ${res.status})`);
    err.razorpayError = data?.error || data;
    throw err;
  }
  return data;
}

// Lists refunds Razorpay already has on record for a payment — used as
// a defense-in-depth check independent of our own local bookkeeping.
export async function getPaymentRefunds({ paymentId }) {
  const res = await fetch(`${BASE_URL}/payments/${paymentId}/refunds`, {
    method: "GET",
    headers: { Authorization: authHeader() },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* leave null */ }
  if (!res.ok) throw new Error(data?.error?.description || data?.message || `Failed to fetch existing refunds (HTTP ${res.status})`);
  return data;
}

