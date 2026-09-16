// Pure arithmetic test of the availability formula
// (available = total - booked - blocked) against the exact scenarios
// in Phase 3.5 Section 5. This is the same formula
// fn_compute_availability implements after it counts booked/blocked —
// the counting logic itself is exercised by overlap-boundaries.test.js.
// No database required.
//
// Run: node tests/inventory-capacity.test.js

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"} — ${label} (expected ${expected}, got ${actual})`);
  if (ok) pass++; else fail++;
}

function computeAvailable(total, booked, blocked) {
  return total - booked - blocked; // fn_compute_availability's raw (unclamped) value
}
function guestFacing(rawAvailable) {
  return Math.max(rawAvailable, 0); // computeAvailability()'s JS clamp for guest-safe display
}

console.log("=== Section 5: capacity scenarios (hotel capacity = 5) ===");

// Case 1
{
  const avail = computeAvailable(5, 0, 2);
  check("Case 1: booked=0 blocked=2 -> available", avail, 3);
}
// Case 2
{
  const avail = computeAvailable(5, 3, 2);
  check("Case 2: booked=3 blocked=2 -> available", avail, 0);
}
// Case 3 — the over-capacity case
{
  const raw = computeAvailable(5, 4, 2);
  check("Case 3: booked=4 blocked=2 -> raw available (owner/admin calendar shows this)", raw, -1);
  check("Case 3: guest-facing available (clamped)", guestFacing(raw), 0);
}
// Case 4 — force-required rejection: attempting to block 6 rooms when 5 are free
{
  const wouldBeAvailableAfterBlock = computeAvailable(5, 0, 0) - 6; // no existing booked/blocked yet, blocking 6
  check("Case 4: blocking 6 rooms in a 5-room hotel goes negative -> requires force", wouldBeAvailableAfterBlock < 0, true);
}

// Section 8: cancellation must not touch blocks
{
  // Before: capacity 5, booked 3, blocked 2 -> available 0
  const before = computeAvailable(5, 3, 2);
  check("Section 8 setup: booked=3 blocked=2 -> available", before, 0);
  // Cancel one booking: booked drops to 2, blocked MUST remain 2 (cancellation
  // never touches inventory_blocks — verified by code inspection: neither
  // rpc_cancel_booking nor rpc_transfer_booking references inventory_blocks
  // at all, only fn_compute_availability reads it, live, on every call).
  const after = computeAvailable(5, 2, 2);
  check("Section 8: after cancelling one booking -> booked=2 blocked=2 available", after, 1);
}

console.log(`\n${fail === 0 ? "ALL" : `${fail} of ${pass + fail}`} ${fail === 0 ? "TESTS PASSED" : "TESTS FAILED"}`);
process.exit(fail === 0 ? 0 : 1);
