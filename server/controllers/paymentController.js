import { supabase } from "../config/supabase.js";
import { createOrder as createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } from "../config/razorpay.js";
import { syncCustomerFromBooking } from "./customerController.js";
import { creditBookingToWallet } from "./walletController.js";
import { calculateGst } from "../utils/gst.js";

// Shared with bookingController's pay-at-hotel flow — kept in sync manually
// since there isn't a common "bookings" service module yet.
async function priceBooking({ hotel_id, check_in, check_out }) {
  if (check_in < new Date().toISOString().slice(0, 10)) throw new Error("Check-in date cannot be in the past");

  const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
  if (nights < 1) throw new Error("Check-out must be after check-in");

  const { data: hotel, error } = await supabase.from("hotels").select("price, name").eq("id", hotel_id).single();
  if (error || !hotel) throw new Error("Hotel not found");

  const total_price = hotel.price * nights;
  // GST slab set by the hotel's nightly rate, applied to the whole stay.
  const { gstRate, gstAmount, grandTotal } = calculateGst(hotel.price, total_price);

  return { nights, total_price, gstRate, gstAmount, grandTotal };
}

// Runs the side effects a confirmed+paid booking needs. Safe to call more
// than once for the same booking — callers must only invoke it the first
// time a booking transitions into "confirmed" (checked by the caller).
async function onBookingConfirmed(booking) {
  try {
    const customer = await syncCustomerFromBooking(booking);
    if (customer) await supabase.from("bookings").update({ customer_id: customer.id }).eq("id", booking.id);
  } catch (e) { console.error("Customer sync failed:", e.message); }

  try { await creditBookingToWallet(booking); } // still keys off pre-tax total_price
  catch (e) { console.error("Wallet credit failed:", e.message); }
}

// POST /api/payments/create-order
// Creates a "pending" booking (not yet confirmed) + a matching Razorpay
// order. The booking is only confirmed once /verify or the webhook proves
// the payment actually went through. The Razorpay order is for grand_total
// (GST-inclusive) — that's the real amount charged to the guest's card.
export const createOrderHandler = async (req, res) => {
  try {
    const { hotel_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, user_id, special_request } = req.body;
    if (!hotel_id || !guest_name || !guest_email || !check_in || !check_out) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { nights, total_price, gstRate, gstAmount, grandTotal } = await priceBooking({ hotel_id, check_in, check_out });

    const { data: booking, error } = await supabase.from("bookings").insert([{
      hotel_id, guest_name, guest_email, guest_phone,
      check_in, check_out, guests: guests || 2, nights, total_price,
      gst_rate: gstRate, gst_amount: gstAmount, grand_total: grandTotal,
      status: "pending", payment_mode: "prepaid", payment_status: "pending",
      special_request: special_request || null, user_id: user_id || null,
    }]).select().single();
    if (error) throw error;

    const order = await createRazorpayOrder({
      amountRupees: grandTotal,
      receipt: booking.id,
      notes: { booking_id: booking.id, hotel_id },
    });

    await supabase.from("bookings").update({ razorpay_order_id: order.id }).eq("id", booking.id);

    res.status(201).json({
      key_id: process.env.RAZORPAY_KEY_ID,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      booking_id: booking.id,
      booking: { ...booking, razorpay_order_id: order.id },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/payments/verify
// Called by the browser right after Razorpay Checkout's success handler
// fires. This is the fast path; the webhook below is the backstop for the
// ~3-5% of cases where the browser closes before this call is made.
export const verifyPayment = async (req, res) => {
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", booking_id).single();
    if (error || !booking) return res.status(404).json({ message: "Booking not found" });

    // Already confirmed (e.g. webhook got there first) — idempotent no-op.
    if (booking.status === "confirmed" && booking.payment_status === "paid") {
      return res.json({ message: "Booking confirmed", booking });
    }

    // The order_id must match what we generated for this booking —
    // otherwise someone could try to attach an unrelated payment to it.
    if (booking.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({ message: "Order mismatch" });
    }

    const valid = verifyPaymentSignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
    if (!valid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const { data: updated, error: updateError } = await supabase.from("bookings").update({
      status: "confirmed", payment_status: "paid",
      razorpay_payment_id, razorpay_signature,
    }).eq("id", booking_id).select().single();
    if (updateError) throw updateError;

    await onBookingConfirmed(updated);

    res.json({ message: "Payment verified — booking confirmed", booking: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/webhook
// Mounted with express.raw() in index.js (NOT express.json()) — the
// signature is computed over the exact raw bytes Razorpay sent.
export const webhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body; // Buffer, thanks to express.raw()
    if (!signature || !rawBody) return res.status(400).json({ message: "Missing signature or body" });

    const valid = verifyWebhookSignature({ rawBody: rawBody.toString(), signature });
    if (!valid) return res.status(400).json({ message: "Invalid webhook signature" });

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
    if (!orderId) return res.json({ status: "ok" }); // nothing we can act on

    const { data: booking } = await supabase.from("bookings").select("*").eq("razorpay_order_id", orderId).single();
    if (!booking) return res.json({ status: "ok" }); // not one of ours (or already deleted)

    if (event === "payment.captured" && booking.status !== "confirmed") {
      const { data: updated } = await supabase.from("bookings").update({
        status: "confirmed", payment_status: "paid", razorpay_payment_id: paymentEntity?.id,
      }).eq("id", booking.id).select().single();
      if (updated) await onBookingConfirmed(updated);
    } else if (event === "payment.failed" && booking.status !== "confirmed") {
      await supabase.from("bookings").update({ payment_status: "failed" }).eq("id", booking.id);
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error.message);
    // Non-200 makes Razorpay retry with backoff — right call for a
    // transient failure (e.g. DB blip), which is the common case here.
    res.status(500).json({ message: "Webhook processing failed" });
  }
};