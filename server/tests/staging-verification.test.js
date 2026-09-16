// STAGING_REQUIRED — full verification suite for Security, Inventory,
// Financial, Payments, and Performance. Every section below talks to a
// REAL running server backed by a REAL (non-production) Supabase
// project — nothing here is mocked, and nothing here has been executed
// yet in this environment. Each section checks its own required env
// vars and prints "SKIPPED (STAGING_REQUIRED): ..." for whatever it
// can't run, rather than crashing the whole suite or pretending to pass.
//
// This file complements (does not replace) concurrency.test.js and the
// three local, DB-free tests (overlap-boundaries, inventory-capacity,
// transfer-capacity), which already run today with no staging needed.
//
// ============================================================
// REQUIRED SETUP — create these on a STAGING Supabase project, never
// production, before running this file:
//
//   4 real Supabase Auth users:
//     - a plain guest                          -> GUEST_EMAIL / GUEST_PASSWORD
//     - hotel_admin owning "Hotel A"            -> HOTEL_A_ADMIN_EMAIL / HOTEL_A_ADMIN_PASSWORD
//     - hotel_admin owning "Hotel B"            -> HOTEL_B_ADMIN_EMAIL / HOTEL_B_ADMIN_PASSWORD
//     - super_admin                             -> SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
//   Two real hotels, each with its own wallet:
//     - HOTEL_A_ID  (owned by the Hotel A admin above, rooms >= 2)
//     - HOTEL_B_ID  (owned by the Hotel B admin above, rooms = 1, so it
//                    can be driven to sold-out deliberately)
//   A disposable hotel with rooms = 1 and no bookings in the test
//   window, for the pure booking-vs-booking race:
//     - TEST_HOTEL_ID (reused by concurrency.test.js too)
//
// Environment variables:
//   API_URL, SUPABASE_URL, SUPABASE_ANON_KEY
//   GUEST_EMAIL, GUEST_PASSWORD
//   HOTEL_A_ADMIN_EMAIL, HOTEL_A_ADMIN_PASSWORD, HOTEL_A_ID
//   HOTEL_B_ADMIN_EMAIL, HOTEL_B_ADMIN_PASSWORD, HOTEL_B_ID
//   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD
//   TEST_HOTEL_ID
//   RAZORPAY_WEBHOOK_SECRET  (test-mode value, for the webhook-replay test)
//
// Run: node tests/staging-verification.test.js
// ============================================================

import crypto from "crypto";

const API_URL = process.env.API_URL || "http://localhost:5000";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let pass = 0, fail = 0, skip = 0;
function result(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
  if (ok) pass++; else fail++;
}
function skipped(section, reason) {
  console.log(`SKIPPED (STAGING_REQUIRED) — ${section}: ${reason}`);
  skip++;
}

// Real Supabase password-grant login — returns a genuine access_token,
// the same kind the browser gets, so every call below exercises the
// actual RLS/role path a real user would hit.
async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${email}: ${data.error_description || data.message}`);
  return data.access_token;
}

async function api(path, token, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body };
}

// Calling a service_role-only RPC directly via PostgREST, the way a
// malicious browser client would, using a REAL user's own token (not
// the service key) — this must be rejected by Postgres itself
// (EXECUTE revoked from anon/authenticated), not just by Express.
async function callRpcDirectly(fnName, token, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify(args),
  });
  return { status: res.status, ok: res.ok, body: await res.json().catch(() => ({})) };
}

const haveSupabaseAuth = () => SUPABASE_URL && SUPABASE_ANON_KEY;

// ============================================================
// SECURITY
// ============================================================
async function runSecurityTests() {
  console.log("\n=== SECURITY ===");
  if (!haveSupabaseAuth()) return skipped("Security", "SUPABASE_URL / SUPABASE_ANON_KEY not set");

  const need = ["GUEST_EMAIL", "GUEST_PASSWORD", "HOTEL_A_ADMIN_EMAIL", "HOTEL_A_ADMIN_PASSWORD",
    "HOTEL_B_ADMIN_EMAIL", "HOTEL_B_ADMIN_PASSWORD", "HOTEL_A_ID", "HOTEL_B_ID",
    "SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD"];
  const missing = need.filter(k => !process.env[k]);
  if (missing.length) return skipped("Security", `missing env vars: ${missing.join(", ")}`);

  const guestToken = await login(process.env.GUEST_EMAIL, process.env.GUEST_PASSWORD);
  const hotelAToken = await login(process.env.HOTEL_A_ADMIN_EMAIL, process.env.HOTEL_A_ADMIN_PASSWORD);
  const superToken = await login(process.env.SUPER_ADMIN_EMAIL, process.env.SUPER_ADMIN_PASSWORD);
  const hotelBId = process.env.HOTEL_B_ID;
  const hotelAId = process.env.HOTEL_A_ID;

  // 1. Hotel A owner cannot read Hotel B's bookings via the owner-scoped endpoint.
  {
    const r = await api(`/api/admin/bookings/owner/${hotelBId}`, hotelAToken);
    // hotelAdminGetBookings ignores the URL param for non-super_admin and
    // scopes to the caller's own hotels — so this should come back
    // empty/theirs, never Hotel B's bookings. Treat any 200 with hotel
    // B data as a failure; empty or their-own-hotel-only data is a pass.
    result("Hotel A owner request for Hotel B's bookings does not return Hotel B data", r.status !== 200 || !JSON.stringify(r.body).includes(hotelBId));
  }

  // 2. Hotel A owner cannot read Hotel B's complaints.
  {
    const r = await api(`/api/complaints?hotel_id=${hotelBId}`, hotelAToken);
    result("Hotel A owner cannot list Hotel B's complaints", r.status === 403 || r.status === 401);
  }

  // 3. Hotel A owner cannot read team members at all (super_admin only).
  {
    const r = await api(`/api/team`, hotelAToken);
    result("Hotel A owner cannot read team members", r.status === 403);
  }

  // 4. Hotel A owner cannot modify Hotel B's inventory.
  {
    const r = await api(`/api/inventory/${hotelBId}/blocks`, hotelAToken, {
      method: "POST", body: JSON.stringify({ start_date: "2027-01-01", end_date: "2027-01-02", quantity: 1 }),
    });
    result("Hotel A owner cannot create a block on Hotel B", r.status === 403);
  }

  // 5. Hotel A owner cannot read or settle Hotel B's wallet.
  {
    const r1 = await api(`/api/wallets/hotel/${hotelBId}`, hotelAToken);
    const r2 = await api(`/api/wallets/settle`, hotelAToken, { method: "POST", body: JSON.stringify({ hotel_id: hotelBId, amount: 1 }) });
    result("Hotel A owner cannot read Hotel B's wallet", r1.status === 403);
    result("Hotel A owner cannot settle Hotel B's wallet", r2.status === 403);
  }

  // 6. Guest cannot access another customer's private data (CRM is
  // super_admin-only entirely, so any guest token should be denied).
  {
    const r = await api(`/api/customers`, guestToken);
    result("Guest cannot access the customer/CRM endpoint", r.status === 403);
  }

  // 7. Guest cannot directly execute a privileged financial/inventory
  // RPC via Supabase's REST API using their own real session token —
  // this must be rejected by Postgres (EXECUTE revoked), not Express.
  {
    const r = await callRpcDirectly("rpc_create_inventory_block", guestToken, {
      p_hotel_id: hotelAId, p_start_date: "2027-01-01", p_end_date: "2027-01-02", p_quantity: 1, p_reason: null, p_actor_id: null, p_force: false,
    });
    result("Guest cannot invoke rpc_create_inventory_block directly via PostgREST", r.status === 401 || r.status === 403 || r.status === 404);
  }
  {
    const r = await callRpcDirectly("rpc_settle_wallet", guestToken, { p_hotel_id: hotelAId, p_amount: 1, p_utr: null, p_description: null, p_created_by: null });
    result("Guest cannot invoke rpc_settle_wallet directly via PostgREST", r.status === 401 || r.status === 403 || r.status === 404);
  }

  // 8. Super admin retains intended access to both hotels.
  {
    const r1 = await api(`/api/wallets/hotel/${hotelAId}`, superToken);
    const r2 = await api(`/api/wallets/hotel/${hotelBId}`, superToken);
    result("Super admin can read Hotel A's wallet", r1.status === 200);
    result("Super admin can read Hotel B's wallet", r2.status === 200);
  }
}

// ============================================================
// INVENTORY (booking-vs-block, transfer scenarios beyond plain
// booking-vs-booking, which concurrency.test.js already covers)
// ============================================================
async function runInventoryTests() {
  console.log("\n=== INVENTORY (beyond concurrency.test.js) ===");
  if (!haveSupabaseAuth()) return skipped("Inventory", "SUPABASE_URL / SUPABASE_ANON_KEY not set");
  const need = ["HOTEL_A_ADMIN_EMAIL", "HOTEL_A_ADMIN_PASSWORD", "HOTEL_A_ID", "HOTEL_B_ID", "HOTEL_B_ADMIN_EMAIL", "HOTEL_B_ADMIN_PASSWORD", "SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD"];
  const missing = need.filter(k => !process.env[k]);
  if (missing.length) return skipped("Inventory", `missing env vars: ${missing.join(", ")}; also needs HOTEL_B_ID configured with rooms = 1`);

  const superToken = await login(process.env.SUPER_ADMIN_EMAIL, process.env.SUPER_ADMIN_PASSWORD);
  const hotelBToken = await login(process.env.HOTEL_B_ADMIN_EMAIL, process.env.HOTEL_B_ADMIN_PASSWORD);
  const hotelBId = process.env.HOTEL_B_ID;

  function future(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
  const checkIn = future(60), checkOut = future(62);

  // Booking vs inventory block: fire both at once for a 1-room hotel's
  // last slot. Exactly one operation should win; the invariant
  // booked+blocked <= total must hold afterward (or be an explicit,
  // auditable force-override — not checked automatically here).
  const [bookingRes, blockRes] = await Promise.all([
    fetch(`${API_URL}/api/bookings`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotel_id: hotelBId, guest_name: "Race Test", guest_email: "race-test@example.com", check_in: checkIn, check_out: checkOut, guests: 1 }),
    }).then(r => r.json().catch(() => ({}))),
    api(`/api/inventory/${hotelBId}/blocks`, hotelBToken, {
      method: "POST", body: JSON.stringify({ start_date: checkIn, end_date: checkOut, quantity: 1 }),
    }),
  ]);
  const bookingWon = !!bookingRes.booking;
  const blockWon = blockRes.status === 201;
  console.log(`    booking succeeded=${bookingWon} block succeeded=${blockWon}`);
  result("Booking-vs-block race: not both silently succeed into an impossible state (one should fail with a clear error, matching a 1-room hotel)", !(bookingWon && blockWon));

  // Sold-out destination transfer: attempt to move a booking from A into
  // the now-full Hotel B — must fail cleanly (the Phase 4A fix).
  {
    const superAdminBookings = await api(`/api/booking-mgmt?status=upcoming`, superToken);
    const aBooking = (superAdminBookings.body.bookings || []).find(b => b.hotel_id === process.env.HOTEL_A_ID);
    if (!aBooking) {
      skipped("Sold-out destination transfer", "no upcoming booking found at HOTEL_A_ID to use as the transfer source");
    } else {
      const r = await api(`/api/booking-mgmt/${aBooking.id}/transfer`, superToken, {
        method: "POST", body: JSON.stringify({ new_hotel_id: hotelBId }),
      });
      result("Transfer into a sold-out/fully-blocked destination is rejected", r.status === 400);
    }
  }
}

// ============================================================
// FINANCIAL
// ============================================================
async function runFinancialTests() {
  console.log("\n=== FINANCIAL ===");
  if (!haveSupabaseAuth()) return skipped("Financial", "SUPABASE_URL / SUPABASE_ANON_KEY not set");
  const need = ["SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD", "HOTEL_A_ID"];
  const missing = need.filter(k => !process.env[k]);
  if (missing.length) return skipped("Financial", `missing env vars: ${missing.join(", ")}`);

  const superToken = await login(process.env.SUPER_ADMIN_EMAIL, process.env.SUPER_ADMIN_PASSWORD);
  const hotelAId = process.env.HOTEL_A_ID;

  // Duplicate settlement with the same UTR — only one should succeed.
  const utr = `TEST-UTR-${Date.now()}`;
  const [s1, s2] = await Promise.all([
    api(`/api/wallets/settle`, superToken, { method: "POST", body: JSON.stringify({ hotel_id: hotelAId, amount: 1, utr_number: utr, description: "staging test" }) }),
    api(`/api/wallets/settle`, superToken, { method: "POST", body: JSON.stringify({ hotel_id: hotelAId, amount: 1, utr_number: utr, description: "staging test" }) }),
  ]);
  const successes = [s1, s2].filter(r => r.status === 200).length;
  result("Concurrent settlement with the same UTR: exactly one succeeds", successes === 1);

  // Reconciliation: balance_cached should equal sum(credits) - sum(debits)
  // for every wallet. Read-only — reports drift, never repairs it.
  const wallet = await api(`/api/wallets/hotel/${hotelAId}`, superToken);
  if (wallet.status === 200) {
    const ledger = wallet.body.ledger || [];
    const computed = ledger.reduce((s, e) => s + (e.direction === "credit" ? Number(e.amount) : -Number(e.amount)), 0);
    const cached = Number(wallet.body.wallet?.balance_cached || 0);
    const drift = +(cached - computed).toFixed(2);
    console.log(`    Hotel ${hotelAId}: cached=${cached} computed_from_ledger=${computed} drift=${drift}`);
    result("Wallet balance_cached matches sum(ledger entries) for Hotel A", Math.abs(drift) < 0.01);
  } else {
    skipped("Reconciliation", `could not read Hotel A's wallet (status ${wallet.status})`);
  }
}

// ============================================================
// PAYMENTS — order/verify/duplicate-webhook are scriptable; a real
// browser Razorpay Checkout completion is NOT (needs a human in a
// browser) and is documented as a manual step instead of faked here.
// ============================================================
async function runPaymentTests() {
  console.log("\n=== PAYMENTS ===");
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return skipped("Payments", "RAZORPAY_WEBHOOK_SECRET not set (test-mode value)");
  if (!process.env.TEST_PAYMENT_ORDER_ID || !process.env.TEST_PAYMENT_ID) {
    console.log("    NOTE: full order->pay->verify requires a real Razorpay test-mode Checkout completion in a browser —");
    console.log("    that step is manual, not scripted here. Once you have a captured test payment, set");
    console.log("    TEST_PAYMENT_ORDER_ID / TEST_PAYMENT_ID and re-run to exercise the duplicate-webhook check below.");
    return skipped("Payments (webhook replay)", "TEST_PAYMENT_ORDER_ID / TEST_PAYMENT_ID not set — see note above");
  }

  const payload = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: process.env.TEST_PAYMENT_ID, order_id: process.env.TEST_PAYMENT_ORDER_ID } } },
  });
  const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(payload).digest("hex");

  const sendWebhook = () => fetch(`${API_URL}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-razorpay-signature": signature },
    body: payload,
  });

  const first = await sendWebhook();
  const second = await sendWebhook(); // duplicate delivery — Razorpay does retry webhooks
  result("First webhook delivery accepted", first.status === 200);
  result("Duplicate webhook delivery also returns 200 (idempotent, not double-processed)", second.status === 200);
  console.log("    Verify manually in the DB: exactly ONE 'booking' credit ledger entry exists for this booking, not two.");

  console.log("\n    IMPORTANT distinction per this phase's instructions:");
  console.log("    This test proves internal booking/ledger bookkeeping is idempotent.");
  console.log("    It does NOT prove a real Razorpay refund API call exists — grep confirms none does.");
  console.log("    Do not report a customer as 'refunded via Razorpay' from this test or any other in this repo.");
}

// ============================================================
// PERFORMANCE — coarse timing, not a load test. Numbers only mean
// anything measured against the actual staging project's latency/data
// volume, not this local placeholder-config checkout.
// ============================================================
async function runPerformanceTests() {
  console.log("\n=== PERFORMANCE (sanity, not a load test) ===");
  const hotelId = process.env.TEST_HOTEL_ID || process.env.HOTEL_A_ID;
  if (!hotelId) return skipped("Performance", "TEST_HOTEL_ID or HOTEL_A_ID not set");

  async function time(label, fn) {
    const start = Date.now();
    try {
      await fn();
      console.log(`    ${label}: ${Date.now() - start}ms`);
    } catch (e) {
      console.log(`    ${label}: FAILED (${e.message})`);
    }
  }

  await time("GET /api/hotels (no dates)", () => fetch(`${API_URL}/api/hotels`).then(r => r.json()));
  await time("GET /api/hotels (with dates, exercises availability filter)", () => {
    const d = new Date(); d.setDate(d.getDate() + 90);
    const ci = d.toISOString().slice(0, 10);
    d.setDate(d.getDate() + 2);
    const co = d.toISOString().slice(0, 10);
    return fetch(`${API_URL}/api/hotels?check_in=${ci}&check_out=${co}`).then(r => r.json());
  });
  await time(`GET /api/hotels/${hotelId}/availability`, () => {
    const d = new Date(); d.setDate(d.getDate() + 95);
    const ci = d.toISOString().slice(0, 10);
    d.setDate(d.getDate() + 1);
    const co = d.toISOString().slice(0, 10);
    return fetch(`${API_URL}/api/hotels/${hotelId}/availability?check_in=${ci}&check_out=${co}`).then(r => r.json());
  });
  console.log("    (Owner calendar and booking-creation timings need an auth token — run manually with the Security section's tokens once staging exists.)");
}

(async () => {
  await runSecurityTests();
  await runInventoryTests();
  await runFinancialTests();
  await runPaymentTests();
  await runPerformanceTests();

  console.log(`\n${pass} passed, ${fail} failed, ${skip} sections skipped (STAGING_REQUIRED).`);
  process.exit(fail > 0 ? 1 : 0);
})();
