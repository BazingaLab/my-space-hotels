// Logic-level test of rpc_transfer_booking's new destination-capacity
// check (25-transfer-capacity-fix.sql). This validates the DECISION
// formula the fix uses — `available <= 0 -> reject` — against every
// scenario Phase 4A Section 1.12 asks for, using the same
// total/booked/blocked arithmetic already proven correct in
// inventory-capacity.test.js.
//
// What this DOES verify (genuinely, by execution): the decision logic
// produces the right accept/reject outcome for each scenario, and that
// the "exclude the booking being transferred" and "cancelled bookings
// don't count" rules are arithmetically sound.
//
// What this does NOT verify (needs real Postgres — see
// concurrency.test.js's testTransferIntoLimitedHotel, currently
// blocked): that the actual SQL transaction really leaves the source
// booking and both wallets completely untouched when it rejects. That
// requires executing the real RPC against a real database and
// inspecting the resulting rows, which this environment still cannot do.
//
// Run: node tests/transfer-capacity.test.js

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"} — ${label} (expected ${expected}, got ${actual})`);
  if (ok) pass++; else fail++;
}

// Mirrors fn_compute_availability's raw formula.
function available(total, booked, blocked) {
  return total - booked - blocked;
}
// Mirrors rpc_transfer_booking's new gate: reject if <= 0.
function transferWouldSucceed(total, booked, blocked) {
  return available(total, booked, blocked) > 0;
}

console.log("=== Phase 4A Section 1.12: transfer destination-capacity scenarios ===");

// destination has availability -> succeeds
check("destination: 5 rooms, 3 booked, 0 blocked -> transfer succeeds", transferWouldSucceed(5, 3, 0), true);

// destination is sold out -> fails
check("destination: 5 rooms, 5 booked, 0 blocked (sold out) -> transfer fails", transferWouldSucceed(5, 5, 0), false);

// destination is blocked -> fails
check("destination: 5 rooms, 2 booked, 3 blocked (fully committed) -> transfer fails", transferWouldSucceed(5, 2, 3), false);

// destination has exactly enough inventory -> succeeds (the transferred
// booking would be the LAST one to fit)
check("destination: 5 rooms, 4 booked, 0 blocked (exactly 1 free) -> transfer succeeds", transferWouldSucceed(5, 4, 0), true);
check("destination: 5 rooms, 4 booked, 1 blocked (exactly 0 free) -> transfer fails", transferWouldSucceed(5, 4, 1), false);

// cancelled/inactive bookings are not counted — fn_compute_availability
// filters `status <> 'cancelled'` before counting `booked`, so a
// cancelled booking never contributes to the total in the first place;
// modelled here as simply not being in the `booked` count at all.
{
  const totalRoomsAtDest = 5;
  const nonCancelledBookings = 4; // one more booking exists but is cancelled, so it's excluded upstream
  check("destination: cancelled booking excluded from booked count -> 1 free, transfer succeeds", transferWouldSucceed(totalRoomsAtDest, nonCancelledBookings, 0), true);
}

// the booking being transferred must not count against its own
// destination — modelled as: the destination's booked count is
// computed BEFORE the transfer lands, exactly as rpc_transfer_booking
// checks availability before updating bookings.hotel_id.
{
  const bookedAtDestBeforeTransfer = 4; // does NOT include the incoming booking
  check("destination: incoming booking excluded from its own capacity check -> succeeds", transferWouldSucceed(5, bookedAtDestBeforeTransfer, 0), true);
}

console.log(`\n${fail === 0 ? "ALL" : `${fail} of ${pass + fail}`} ${fail === 0 ? "TESTS PASSED" : "TESTS FAILED"}`);
process.exit(fail === 0 ? 0 : 1);
