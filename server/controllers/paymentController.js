import { supabase } from "../config/supabase.js";
import { createOrder as createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } from "../config/razorpay.js";
import { syncCustomerFromBooking } from "./customerController.js";
import { creditBookingToWallet } from "./walletController.js";
import { priceBooking } from "../utils/pricing.js";

async function onBookingConfirmed(booking) {
  try {
    const customer = await syncCustomerFromBooking(booking);
    if (customer) await supabase.from("bookings").update({ customer_id: customer.id }).eq("id", booking.id);
  } catch (e) { console.error("Customer sync failed:", e.message); }

  try { await creditBookingToWallet(booking); }
  catch (e) { console.error("Wallet credit failed:", e.message); }
}

// POST /api/payments/create-order
export const createOrderHandler = async (req, res) => {
  try {
    const { hotel_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, user_id, special_request, meal_plan, booking_type, slot_hours, start_time } = req.body;
    if (!hotel_id || !guest_name || !guest_email || !check_in) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (booking_type !== "hourly" && !check_out) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const priced = await priceBooking({ hotel_id, check_in, check_out, meal_plan, booking_type, slot_hours, start_time });

    const { data: booking, error } = await supabase.from("bookings").insert([{
      hotel_id, guest_name, guest_email, guest_phone,
      check_in: priced.checkInDate, check_out: priced.checkOutDate,
      guests: guests || 2, nights: priced.nights, total_price: priced.total_price,
      gst_rate: priced.gstRate, gst_amount: priced.gstAmount, grand_total: priced.grandTotal,
      meal_plan: priced.mealPlan, breakfast_price_applied: priced.breakfastPricePerNight,
      booking_type: priced.bookingType, slot_hours: priced.slotHours,
      checkin_datetime: priced.checkinDatetime, checkout_datetime: priced.checkoutDatetime,
      status: "pending", payment_mode: "prepaid", payment_status: "pending",
      special_request: special_request || null, user_id: user_id || null,
    }]).select().single();
    if (error) throw error;

    const order = await createRazorpayOrder({
      amountRupees: priced.grandTotal,
      receipt: booking.id,
      notes: { booking_id: booking.id, hotel_id },
    });

    await supabase.from("bookings").update({ razorpay_order_id: order.id }).eq("id", booking.id);

    res.status(201).json({
      key_id: process.env.RAZORPAY_KEY_ID,
      order_id: order.id, amount: order.amount, currency: order.currency,
      booking_id: booking.id, booking: { ...booking, razorpay_order_id: order.id },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/payments/verify
export const verifyPayment = async (req, res) => {
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", booking_id).single();
    if (error || !booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "confirmed" && booking.payment_status === "paid") {
      return res.json({ message: "Booking confirmed", booking });
    }

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
export const webhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body;
    if (!signature || !rawBody) return res.status(400).json({ message: "Missing signature or body" });

    const valid = verifyWebhookSignature({ rawBody: rawBody.toString(), signature });
    if (!valid) return res.status(400).json({ message: "Invalid webhook signature" });

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
    if (!orderId) return res.json({ status: "ok" });

    const { data: booking } = await supabase.from("bookings").select("*").eq("razorpay_order_id", orderId).single();
    if (!booking) return res.json({ status: "ok" });

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
    res.status(500).json({ message: "Webhook processing failed" });
  }
};