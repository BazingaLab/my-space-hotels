import { supabase } from "../config/supabase.js";
import { audit } from "../audit.js";

// Good-biz thresholds — used ONLY to flag eligibility for the admin to see.
// They no longer change the commission rate automatically; the admin's
// manually-set commission_percent always wins.
const GOOD_BIZ_TENURE_MONTHS = 6;
const GOOD_BIZ_BOOKING_THRESHOLD = 20;

// Ensure a hotel has a wallet; create if missing. Returns wallet.
// Backed by rpc_ensure_wallet (21-financial-integrity.sql) — an atomic
// upsert, so two concurrent first-ever financial events for a brand new
// hotel can't both try to insert its wallet row and hit the
// wallet_accounts.hotel_id unique constraint unhandled.
export async function ensureWallet(hotelId) {
  const { data, error } = await supabase.rpc("rpc_ensure_wallet", { p_hotel_id: hotelId });
  if (error) throw error;
  return data;
}

// Checks good-biz ELIGIBILITY (tenure or lifetime confirmed-booking volume) —
// informational only. Returns the raw numbers too, so the admin can see
// exactly why a hotel is/isn't flagged, not just a yes/no.
async function checkGoodBizEligibility(hotelId) {
  const { data: hotel } = await supabase.from("hotels").select("agreement_start_date, created_at").eq("id", hotelId).single();
  const tenureStart = new Date(hotel?.agreement_start_date || hotel?.created_at || Date.now());
  const monthsActive = Math.floor((Date.now() - tenureStart.getTime()) / (1000 * 60 * 60 * 24 * 30));

  const { count } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("hotel_id", hotelId).neq("status", "cancelled");
  const confirmedBookings = count || 0;

  let eligible = false, reason = null;
  if (monthsActive >= GOOD_BIZ_TENURE_MONTHS) { eligible = true; reason = `Tenure: ${monthsActive} months active`; }
  else if (confirmedBookings >= GOOD_BIZ_BOOKING_THRESHOLD) { eligible = true; reason = `Volume: ${confirmedBookings} confirmed bookings`; }

  return { eligible, reason, monthsActive, confirmedBookings };
}

// GET /api/wallets/eligibility/:hotelId — surfaces good-biz status + the raw
// numbers behind it, so the admin can decide the commission rate themselves.
export const getGoodBizEligibility = async (req, res) => {
  try {
    const data = await checkGoodBizEligibility(req.params.hotelId);
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Called when a booking is confirmed: credit hotel wallet with (total - commission)
// at the hotel's manually-set rate — no automatic override. Good-biz eligibility
// is stamped onto the booking as a flag only, for reporting.
//
// The eligibility check is a pure read (no state changes, no race to
// worry about) and stays here in JS. The actual money-moving part —
// compute commission, insert the ledger credit, update the wallet
// balance, stamp the commission fields onto the booking — is ONE
// atomic call to rpc_credit_booking_to_wallet (21-financial-integrity.sql).
// That function is also idempotent: if this is called twice for the
// same booking (e.g. verifyPayment and the Razorpay webhook both firing
// for the same payment), the second call returns the original ledger
// entry instead of crediting the hotel twice.
export async function creditBookingToWallet(booking) {
  if (!booking?.hotel_id) return;
  const { data: hotel } = await supabase.from("hotels").select("commission_percent").eq("id", booking.hotel_id).single();
  const appliedPct = Number(hotel?.commission_percent || 0);

  const { eligible, reason } = await checkGoodBizEligibility(booking.hotel_id);

  const { data: entry, error } = await supabase.rpc("rpc_credit_booking_to_wallet", {
    p_booking_id: booking.id,
    p_commission_percent: appliedPct,
    p_eligible: eligible,
    p_reason: reason,
  });
  if (error) throw error;

  const gross = Number(booking.total_price || 0);
  const commission = +(gross * appliedPct / 100).toFixed(2);
  return { gross, commission, net: Number(entry.amount), eligible };
}

// GET /api/wallets — all wallets (admin)
export const listWallets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("wallet_accounts")
      .select("*, hotels(name, city, commission_percent)")
      .order("balance_cached", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, wallets: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/wallets/hotel/:hotelId — single hotel wallet + ledger
export const getHotelWallet = async (req, res) => {
  try {
    const wallet = await ensureWallet(req.params.hotelId);
    const { data: ledger } = await supabase
      .from("ledger_entries").select("*").eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false });
    res.json({ wallet, ledger: ledger || [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/wallets/settle — record a payout (debit) with UTR.
// The balance-sufficiency check and the UTR-dedup check both happen
// INSIDE rpc_settle_wallet, under a lock on the wallet row — the
// previous Node-level "check then insert" version of this check had
// the exact TOCTOU gap that let two concurrent settle requests both
// pass the check before either wrote (see 21-financial-integrity.sql).
export const settle = async (req, res) => {
  try {
    const { hotel_id, amount, utr_number, description } = req.body;
    if (!hotel_id || !amount) return res.status(400).json({ message: "hotel_id and amount required" });

    const { data: entry, error } = await supabase.rpc("rpc_settle_wallet", {
      p_hotel_id: hotel_id,
      p_amount: amount,
      p_utr: utr_number || null,
      p_description: description || null,
      p_created_by: req.user?.id || null,
    });
    if (error) {
      if (error.code === "MSH02") return res.status(400).json({ message: "Settlement exceeds available balance" });
      if (error.code === "MSH03") return res.status(409).json({ message: "A settlement with this UTR has already been recorded for this hotel" });
      if (error.code === "MSH01") return res.status(400).json({ message: error.message });
      throw error;
    }

    await audit({ userId: req.user?.id, userEmail: req.user?.email, action: "settle", entityType: "wallet", entityId: entry.wallet_id, metadata: { amount, utr_number } });
    res.json({ message: "Settlement recorded", entry });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/wallets/summary — totals for admin KPIs
export const summary = async (req, res) => {
  try {
    const { data: wallets } = await supabase.from("wallet_accounts").select("balance_cached");
    const totalPayable = (wallets || []).reduce((s, w) => s + Number(w.balance_cached || 0), 0);
    res.json({ totalPayable, walletCount: (wallets || []).length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/wallets/commissions — per-hotel commission actually collected,
// plus a good-biz eligibility flag (informational — doesn't affect the number).
export const commissionReport = async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("hotel_id, total_price, commission_percent_applied, commission_amount, commission_waived, hotels!hotel_id(name, city, commission_percent)")
      .neq("status", "cancelled");
    if (error) throw error;

    const byHotel = {};
    for (const b of bookings) {
      const hid = b.hotel_id;
      if (!byHotel[hid]) {
        byHotel[hid] = {
          hotel_id: hid,
          hotel_name: b.hotels?.name || "Unknown",
          city: b.hotels?.city || "",
          standard_rate: Number(b.hotels?.commission_percent || 0),
          bookings: 0, gross_revenue: 0, commission_collected: 0,
          good_biz_eligible: false,
        };
      }
      const row = byHotel[hid];
      row.bookings += 1;
      row.gross_revenue += Number(b.total_price || 0);
      row.commission_collected += Number(b.commission_amount || 0);
      if (b.commission_waived) row.good_biz_eligible = true;
    }

    const rows = Object.values(byHotel)
      .map(r => ({ ...r, gross_revenue: +r.gross_revenue.toFixed(2), commission_collected: +r.commission_collected.toFixed(2) }))
      .sort((a, b) => b.commission_collected - a.commission_collected);

    const totals = rows.reduce((acc, r) => ({
      bookings: acc.bookings + r.bookings,
      gross_revenue: +(acc.gross_revenue + r.gross_revenue).toFixed(2),
      commission_collected: +(acc.commission_collected + r.commission_collected).toFixed(2),
      eligible_hotels: acc.eligible_hotels + (r.good_biz_eligible ? 1 : 0),
    }), { bookings: 0, gross_revenue: 0, commission_collected: 0, eligible_hotels: 0 });

    res.json({ hotels: rows, totals });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
