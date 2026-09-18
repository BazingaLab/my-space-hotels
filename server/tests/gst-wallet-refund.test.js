// Regression test for the GST wallet-refund accounting bug (Phase 7C).
//
// rpc_credit_booking_to_wallet credits the wallet with total_price
// (GST-exclusive, net of commission) — by design, the wallet never
// holds the GST portion of a booking. rpc_refund_booking's wallet-debit
// used to compute its debit directly off the guest-facing refund amount
// (grand_total, GST-inclusive, per the Phase 6/7 fix), which meant a
// full refund reversed MORE than was ever credited whenever GST > 0.
//
// This test calls rpc_refund_booking directly via the service-role
// client — bypassing the two-phase Razorpay gateway wrapper — because
// the accounting bug lives entirely in this SQL function's own
// calculation, not in the gateway-call sequencing around it. That
// sequencing (reserve -> Razorpay -> commit) is exercised separately
// by the guest-bookings HTTP tests; this test isolates the arithmetic.
//
// Requires a real hotel with GST > 0 (so total_price != grand_total).
// Usage:
//   node tests/gst-wallet-refund.test.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const HOTEL_ID = process.env.GST_TEST_HOTEL_ID || "26e66bd1-cc24-4e93-aa00-19d8f2ff99ae"; // PHASE7 TEST HOTEL A
const API_URL = process.env.API_URL || "http://localhost:5000";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

let failures = 0;
function check(name, pass, detail) {
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
  if (!pass) failures++;
}

async function main() {
  // 1. Create a prepaid booking (unique dates so this is re-runnable).
  const stamp = Date.now();
  const checkIn = new Date(Date.now() + 400 * 86400000).toISOString().slice(0, 10);
  const checkOut = new Date(Date.now() + 402 * 86400000).toISOString().slice(0, 10);
  const orderRes = await fetch(`${API_URL}/api/payments/create-order`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hotel_id: HOTEL_ID, guest_name: "GST Test", guest_email: `gst-test-${stamp}@example.com`, guest_phone: "9999999999", check_in: checkIn, check_out: checkOut, guests: 2 }),
  });
  const order = await orderRes.json();
  if (!order.booking_id) { console.error("Could not create test booking:", JSON.stringify(order)); process.exit(1); }

  const { total_price, gst_amount, grand_total } = order.booking;
  check("test booking has GST > 0 (total_price != grand_total)", Number(gst_amount) > 0 && Number(total_price) !== Number(grand_total), `total_price=${total_price} gst_amount=${gst_amount} grand_total=${grand_total}`);

  // 2. Simulate payment.captured (wallet credit only needs a confirmed booking — signature/payment-id realism isn't relevant to the accounting math under test).
  const crypto = await import("crypto");
  const paymentId = `pay_GSTTEST${stamp}`;
  const rawBody = JSON.stringify({
    entity: "event", event: "payment.captured", contains: ["payment"],
    payload: { payment: { entity: { id: paymentId, order_id: order.order_id, amount: order.amount, currency: "INR", status: "captured", captured: true } } },
  });
  const sig = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  await fetch(`${API_URL}/api/payments/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "x-razorpay-signature": sig }, body: rawBody });

  // 3. Read the actual wallet credit that was posted.
  const { data: creditEntry } = await supabase.from("ledger_entries").select("amount").eq("ref_type", "booking").eq("ref_id", order.booking_id).eq("direction", "credit").single();
  check("wallet credited total_price basis (not grand_total)", Number(creditEntry?.amount) === Number(total_price), `credited=${creditEntry?.amount} expected=${total_price}`);

  const { data: walletBefore } = await supabase.from("wallet_accounts").select("balance_cached").eq("hotel_id", HOTEL_ID).single();

  // 4. Call rpc_refund_booking directly with the FULL grand_total (simulating a successful gateway refund having just happened).
  const { data: refunded, error: refundErr } = await supabase.rpc("rpc_refund_booking", {
    p_booking_id: order.booking_id, p_amount: Number(grand_total), p_reference: `gst-test-ref-${stamp}`, p_reason: "GST accounting regression test", p_actor_id: null,
  });
  if (refundErr) { console.error("rpc_refund_booking failed:", refundErr.message); process.exit(1); }
  check("booking marked fully refunded", refunded.payment_status === "refunded", `payment_status=${refunded.payment_status}`);
  check("reimbursement equals grand_total (guest actually paid this)", Number(refunded.reimbursement) === Number(grand_total), `reimbursement=${refunded.reimbursement} grand_total=${grand_total}`);

  // 5. THE CORE ASSERTION: wallet debit must equal the ORIGINAL CREDIT (total_price basis), not grand_total.
  const { data: debitEntry } = await supabase.from("ledger_entries").select("amount").eq("ref_type", "refund").eq("ref_id", order.booking_id).eq("direction", "debit").single();
  check("wallet debit equals ORIGINAL CREDIT, not grand_total (the bug this fixes)", Number(debitEntry?.amount) === Number(total_price), `debited=${debitEntry?.amount} expected=${total_price} (would have been ${grand_total} under the old bug)`);

  // walletBefore was captured AFTER the credit but BEFORE the refund debit,
  // so a correctly-sized (total_price) debit must bring the balance back
  // down by exactly total_price, netting this booking's total effect to zero.
  const { data: walletAfter } = await supabase.from("wallet_accounts").select("balance_cached").eq("hotel_id", HOTEL_ID).single();
  check("wallet balance nets back to pre-credit level after full refund (zero net effect)", Number(walletAfter.balance_cached) === Number(walletBefore.balance_cached) - Number(total_price), `before_refund=${walletBefore.balance_cached} after_refund=${walletAfter.balance_cached} total_price=${total_price}`);

  // Cleanup this disposable test booking.
  await supabase.from("razorpay_refund_attempts").delete().eq("booking_id", order.booking_id);
  await supabase.from("ledger_entries").delete().eq("ref_id", order.booking_id);
  await supabase.from("bookings").delete().eq("id", order.booking_id);
  const { data: remainingLedger } = await supabase.from("ledger_entries").select("amount, direction").eq("wallet_id", (await supabase.from("wallet_accounts").select("id").eq("hotel_id", HOTEL_ID).single()).data.id);
  const recomputed = remainingLedger.reduce((s, e) => s + (e.direction === "credit" ? Number(e.amount) : -Number(e.amount)), 0);
  await supabase.from("wallet_accounts").update({ balance_cached: recomputed }).eq("hotel_id", HOTEL_ID);

  console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
