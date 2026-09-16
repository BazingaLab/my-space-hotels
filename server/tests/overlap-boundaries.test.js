// Pure date-arithmetic tests for the overlap rule used by
// fn_compute_availability (SQL) and mirrored by computeBookingWindow
// (JS, server/utils/availability.js) — no database required, so these
// actually run in this environment, unlike anything that needs a live
// Supabase project. This checks the SAME [start, end) overlap predicate
// the SQL function uses: `a.start < b.end && a.end > b.start`.
//
// Run: node tests/overlap-boundaries.test.js

import { computeBookingWindow } from "../utils/availability.js";

const hotel = { checkin_time: "14:00", checkout_time: "11:00" };

function overlaps(a, b) {
  return a.start < b.end && a.end > b.start;
}

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"} — ${label} (expected overlap=${expected}, got ${actual})`);
  if (ok) pass++; else fail++;
}

console.log("=== Section 7: nightly boundary rules ===");
{
  const A = computeBookingWindow({ booking_type: "nightly", check_in: "2026-09-15", check_out: "2026-09-17" }, hotel);
  const B_boundary = computeBookingWindow({ booking_type: "nightly", check_in: "2026-09-17", check_out: "2026-09-20" }, hotel);
  const B_overlap = computeBookingWindow({ booking_type: "nightly", check_in: "2026-09-16", check_out: "2026-09-18" }, hotel);

  check("15→17 vs 17→20 (checkout day == checkin day)", overlaps(A, B_boundary), false);
  check("15→17 vs 16→18 (genuinely overlapping)", overlaps(A, B_overlap), true);
}

console.log("\n=== Section 8: hourly boundary rules ===");
{
  const H1 = computeBookingWindow({ booking_type: "hourly", checkin_datetime: "2026-09-15T10:00:00", checkout_datetime: "2026-09-15T12:00:00" }, hotel);
  const H2_boundary = computeBookingWindow({ booking_type: "hourly", checkin_datetime: "2026-09-15T12:00:00", checkout_datetime: "2026-09-15T14:00:00" }, hotel);
  const H3 = computeBookingWindow({ booking_type: "hourly", checkin_datetime: "2026-09-15T10:00:00", checkout_datetime: "2026-09-15T13:00:00" }, hotel);
  const H4_inside = computeBookingWindow({ booking_type: "hourly", checkin_datetime: "2026-09-15T11:00:00", checkout_datetime: "2026-09-15T12:00:00" }, hotel);

  check("10:00-12:00 vs 12:00-14:00 (touching boundary)", overlaps(H1, H2_boundary), false);
  check("10:00-13:00 vs 11:00-12:00 (fully inside)", overlaps(H3, H4_inside), true);
}

console.log("\n=== Additional capacity-matrix scenarios (pure overlap logic; DB-level room-count enforcement needs live Postgres — see report) ===");
{
  // 1/2/5/10-room scenarios from Section 7's testing list are really
  // "how many bookings overlap this window" questions, which this
  // script CAN verify precisely — the room-count threshold comparison
  // itself (`overlap_count >= rooms`) is a single integer comparison
  // and is exercised end-to-end by fn_compute_availability /
  // rpc_create_booking, not something with its own separate logic to
  // unit test here.
  const nights = [
    ["2026-10-01", "2026-10-03"],
    ["2026-10-02", "2026-10-04"], // overlaps night 1's 2nd night
    ["2026-10-03", "2026-10-05"], // boundary with night 1 — should NOT count as overlapping it
    ["2026-10-10", "2026-10-12"], // disjoint — different dates entirely
  ].map(([ci, co]) => computeBookingWindow({ booking_type: "nightly", check_in: ci, check_out: co }, hotel));

  const overlapCountWith = (target, all) => all.filter(w => w !== target && overlaps(target, w)).length;

  check("booking 1 overlaps exactly 1 other (booking 2)", overlapCountWith(nights[0], nights), 1);
  check("booking 3 (boundary with 1, overlaps 2) overlaps exactly 1", overlapCountWith(nights[2], nights), 1);
  check("booking 4 (disjoint dates) overlaps 0 others", overlapCountWith(nights[3], nights), 0);
}

console.log(`\n${fail === 0 ? "ALL" : `${fail} of ${pass + fail}`} ${fail === 0 ? "TESTS PASSED" : "TESTS FAILED"}`);
process.exit(fail === 0 ? 0 : 1);
