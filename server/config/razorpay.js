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

