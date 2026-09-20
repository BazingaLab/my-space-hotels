// Regression test for the transfer-commission accounting defect (Phase 8A).
//
// rpc_transfer_booking's wallet math already correctly credited the
// destination hotel net of ITS OWN commission rate, but never updated
// bookings.commission_percent_applied/commission_amount to match — so
// walletController.commissionReport (which reads those columns directly,
// not the ledger) kept showing a transferred booking under the stale
// SOURCE hotel's rate even though the money moved correctly. Fixed by
// also updating those two columns to the destination's rate as part of
// the same transfer, inside the same "if found" block that only applies
// when the booking was already credited before the transfer.
//
// Requires a real hotel to transfer FROM (defaults to PHASE7 TEST HOTEL A,
// commission_percent = 0). Creates and cleans up a disposable destination
// hotel with a different (10%) commission rate itself.
//
// Usage: node tests/transfer-commission.test.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const API_URL = process.env.API_URL || "http://localhost:5000";
const SOURCE_HOTEL_ID = process.env.TRANSFER_TEST_SOURCE_HOTEL_ID || "26e66bd1-cc24-4e93-aa00-19d8f2ff99ae";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

let failures = 0;
function check(name, pass, detail) {
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
  if (!pass) failures++;
}

async function main() {
  const { data: sourceHotel } = await supabase.from("hotels").select("commission_percent").eq("id", SOURCE_HOTEL_ID).single();
  if (!sourceHotel) { console.error(`Source hotel ${SOURCE_HOTEL_ID} not found — set TRANSFER_TEST_SOURCE_HOTEL_ID.`); process.exit(1); }
  const sourceCommission = Number(sourceHotel.commission_percent || 0);
  const destCommission = sourceCommission === 10 ? 20 : 10; // guaranteed different from source

  const stamp = Date.now();
  const { data: destHotel, error: destErr } = await supabase.from("hotels").insert([{
    name: "PHASE8 TRANSFER-COMMISSION TEST HOTEL (safe to delete)", city: "Staging City", state: "Staging State", country: "India",
    price: 1000, max_guests: 2, checkin_time: "14:00:00", checkout_time: "11:00:00", breakfast_available: false, hourly_available: false,
    hotel_status: "active", available: true, rooms: 5, commission_percent: destCommission,
  }]).select().single();
  if (destErr) { console.error("Could not create destination test hotel:", destErr.message); process.exit(1); }

  const checkIn = new Date(Date.now() + 430 * 86400000).toISOString().slice(0, 10);
  const checkOut = new Date(Date.now() + 432 * 86400000).toISOString().slice(0, 10);
  const orderRes = await fetch(`${API_URL}/api/payments/create-order`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hotel_id: SOURCE_HOTEL_ID, guest_name: "Transfer Commission Test", guest_email: `transfer-commission-test-${stamp}@example.com`, guest_phone: "9999999999", check_in: checkIn, check_out: checkOut, guests: 2 }),
  });
  const order = await orderRes.json();
  if (!order.booking_id) { console.error("Could not create test booking:", JSON.stringify(order)); process.exit(1); }
  const bookingId = order.booking_id;

  const paymentId = `pay_TRANSFERCOMMTEST${stamp}`;
  const rawBody = JSON.stringify({ entity: "event", event: "payment.captured", contains: ["payment"], payload: { payment: { entity: { id: paymentId, order_id: order.order_id, amount: order.amount, currency: "INR", status: "captured", captured: true } } } });
  const sig = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  await fetch(`${API_URL}/api/payments/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "x-razorpay-signature": sig }, body: rawBody });

  const { data: beforeBooking } = await supabase.from("bookings").select("commission_percent_applied, commission_amount").eq("id", bookingId).single();
  check("booking initially credited at source hotel's rate", Number(beforeBooking.commission_percent_applied) === sourceCommission, `got ${beforeBooking.commission_percent_applied}%, expected ${sourceCommission}%`);

  const { data: transferred, error: transferErr } = await supabase.rpc("rpc_transfer_booking", {
    p_booking_id: bookingId, p_new_hotel_id: destHotel.id, p_actor_id: null,
  });
  if (transferErr) { console.error("Transfer failed:", transferErr.message); process.exit(1); }

  check("booking.commission_percent_applied updated to DESTINATION's rate", Number(transferred.commission_percent_applied) === destCommission, `got ${transferred.commission_percent_applied}%, expected ${destCommission}%`);
  const expectedCommissionAmount = Number(order.booking.total_price) * (destCommission / 100);
  check("booking.commission_amount recomputed at destination's rate", Number(transferred.commission_amount) === expectedCommissionAmount, `got ${transferred.commission_amount}, expected ${expectedCommissionAmount}`);

  const { data: newWallet } = await supabase.from("wallet_accounts").select("id").eq("hotel_id", destHotel.id).single();
  const { data: transferInEntry } = await supabase.from("ledger_entries").select("amount").eq("wallet_id", newWallet.id).eq("ref_type", "transfer_in").eq("ref_id", bookingId).single();
  const expectedNet = Number(order.booking.total_price) * (1 - destCommission / 100);
  check("wallet transfer_in credit correctly net of destination's commission", Number(transferInEntry.amount) === expectedNet, `got ${transferInEntry.amount}, expected ${expectedNet}`);

  // Cleanup
  await supabase.from("ledger_entries").delete().eq("ref_id", bookingId);
  await supabase.from("bookings").delete().eq("id", bookingId);
  await supabase.from("wallet_accounts").delete().eq("hotel_id", destHotel.id);
  await supabase.from("hotels").delete().eq("id", destHotel.id);
  const { data: sourceWallet } = await supabase.from("wallet_accounts").select("id").eq("hotel_id", SOURCE_HOTEL_ID).single();
  if (sourceWallet) {
    const { data: remaining } = await supabase.from("ledger_entries").select("amount, direction").eq("wallet_id", sourceWallet.id);
    const recomputed = remaining.reduce((s, e) => s + (e.direction === "credit" ? Number(e.amount) : -Number(e.amount)), 0);
    await supabase.from("wallet_accounts").update({ balance_cached: recomputed }).eq("id", sourceWallet.id);
  }

  console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
