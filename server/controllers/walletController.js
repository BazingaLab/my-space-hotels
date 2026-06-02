import { supabase } from "../config/supabase.js";
import { audit } from "../audit.js";

// Core ledger primitive: post an entry and update cached balance atomically-ish.
// direction: 'credit' (money INTO hotel wallet) | 'debit' (money OUT / settled)
export async function postLedgerEntry({ walletId, amount, direction, refType, refId = null, utr = null, description = "", createdBy = null }) {
  const { data: wallet, error: wErr } = await supabase
    .from("wallet_accounts").select("*").eq("id", walletId).single();
  if (wErr) throw wErr;

  const current = Number(wallet.balance_cached || 0);
  const delta = direction === "credit" ? Number(amount) : -Number(amount);
  const balanceAfter = current + delta;

  const { data: entry, error: eErr } = await supabase.from("ledger_entries").insert([{
    wallet_id: walletId, amount: Number(amount), direction,
    ref_type: refType, ref_id: refId, utr_number: utr,
    description, balance_after: balanceAfter, created_by: createdBy,
  }]).select().single();
  if (eErr) throw eErr;

  await supabase.from("wallet_accounts").update({ balance_cached: balanceAfter }).eq("id", walletId);
  return entry;
}

// Ensure a hotel has a wallet; create if missing. Returns wallet.
export async function ensureWallet(hotelId) {
  const { data: existing } = await supabase
    .from("wallet_accounts").select("*").eq("hotel_id", hotelId).single();
  if (existing) return existing;
  const { data, error } = await supabase.from("wallet_accounts")
    .insert([{ hotel_id: hotelId, balance_cached: 0, initial_balance: 0 }])
    .select().single();
  if (error) throw error;
  // link wallet_id back to hotel
  await supabase.from("hotels").update({ wallet_id: data.id }).eq("id", hotelId);
  return data;
}

// Called when a booking is confirmed: credit hotel wallet with (total - commission)
export async function creditBookingToWallet(booking) {
  if (!booking?.hotel_id) return;
  const { data: hotel } = await supabase.from("hotels").select("commission_percent").eq("id", booking.hotel_id).single();
  const commissionPct = Number(hotel?.commission_percent || 0);
  const gross = Number(booking.total_price || 0);
  const commission = +(gross * commissionPct / 100).toFixed(2);
  const net = +(gross - commission).toFixed(2);

  const wallet = await ensureWallet(booking.hotel_id);
  await postLedgerEntry({
    walletId: wallet.id, amount: net, direction: "credit",
    refType: "booking", refId: booking.id,
    description: `Booking ${booking.id?.slice(0,8)} — gross ₹${gross}, commission ₹${commission} (${commissionPct}%)`,
  });
  return { gross, commission, net };
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

// POST /api/wallets/settle — record a payout (debit) with UTR
export const settle = async (req, res) => {
  try {
    const { hotel_id, amount, utr_number, description } = req.body;
    if (!hotel_id || !amount) return res.status(400).json({ message: "hotel_id and amount required" });
    const wallet = await ensureWallet(hotel_id);
    if (Number(amount) > Number(wallet.balance_cached)) {
      return res.status(400).json({ message: "Settlement exceeds available balance" });
    }
    const entry = await postLedgerEntry({
      walletId: wallet.id, amount, direction: "debit",
      refType: "settlement", utr: utr_number,
      description: description || "Settlement payout",
    });
    await audit({ action: "settle", entityType: "wallet", entityId: wallet.id, metadata: { amount, utr_number } });
    res.json({ message: "Settlement recorded", entry });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/wallets/summary — totals for admin KPIs
export const summary = async (req, res) => {
  try {
    const { data: wallets } = await supabase.from("wallet_accounts").select("balance_cached");
    const { data: commissionEntries } = await supabase
      .from("ledger_entries").select("description, ref_type").eq("ref_type", "booking");
    const totalPayable = (wallets || []).reduce((s, w) => s + Number(w.balance_cached || 0), 0);
    res.json({ totalPayable, walletCount: (wallets || []).length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
