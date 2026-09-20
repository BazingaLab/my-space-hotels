// Minimal transactional-email abstraction — no SDK dependency, same
// pattern as config/razorpay.js's plain-fetch approach. Uses Resend's
// HTTP API (https://resend.com) since it's a simple, single REST call;
// swapping providers later only means changing sendViaProvider().
//
// NEVER throws into a caller's booking flow — sendEmail() always resolves
// with a { sent, reason } result. Callers (paymentController etc.) treat
// email exactly like the existing best-effort side effects (customer
// sync, wallet credit): logged on failure, never blocking the booking
// itself. This also means we never fake success — if RESEND_API_KEY
// isn't set, sendEmail() reports sent:false with reason:"not_configured"
// and logs it, rather than pretending an email went out.
const RESEND_API_URL = "https://api.resend.com/emails";

function isConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function sendViaProvider({ to, subject, html }) {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* leave null */ }
  if (!res.ok) throw new Error(data?.message || `Email provider rejected the request (HTTP ${res.status})`);
  return data;
}

export async function sendEmail({ to, subject, html }) {
  if (!isConfigured()) {
    console.warn(`Email not sent (no provider configured): "${subject}" to ${to}`);
    return { sent: false, reason: "not_configured" };
  }
  try {
    const result = await sendViaProvider({ to, subject, html });
    return { sent: true, id: result?.id };
  } catch (e) {
    console.error(`Email send failed: "${subject}" to ${to}:`, e.message);
    return { sent: false, reason: e.message };
  }
}

export function bookingConfirmationEmail(booking, hotel) {
  const checkIn = new Date(booking.check_in).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const checkOut = new Date(booking.check_out).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return {
    subject: `Booking confirmed — ${hotel?.name || "My Space Hotels"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Your stay is confirmed</h2>
        <p>Hi ${booking.guest_name || "there"},</p>
        <p>Your booking at <strong>${hotel?.name || "your hotel"}</strong> is confirmed.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:6px 0; color:#666;">Reservation ID</td><td style="padding:6px 0;">${String(booking.id).slice(0, 8).toUpperCase()}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Check-in</td><td style="padding:6px 0;">${checkIn}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Check-out</td><td style="padding:6px 0;">${checkOut}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Guests</td><td style="padding:6px 0;">${booking.guests}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Amount</td><td style="padding:6px 0;">₹${Number(booking.grand_total || booking.total_price).toLocaleString("en-IN")}</td></tr>
          ${booking.checkin_token ? `<tr><td style="padding:6px 0; color:#666;">Check-in code</td><td style="padding:6px 0; font-weight:bold;">${booking.checkin_token}</td></tr>` : ""}
        </table>
        <p>See you soon!</p>
      </div>
    `,
  };
}
