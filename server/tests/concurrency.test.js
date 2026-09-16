// Concurrency/idempotency smoke tests for the financial-integrity phase.
//
// These hit a RUNNING server (local or staging) over plain HTTP — they
// are not unit tests and don't mock anything, because the whole point
// is to prove real concurrent requests hitting the real database behave
// correctly. Requires a server pointed at a real Supabase project with
// the 21-financial-integrity.sql migration applied.
//
// Usage:
//   API_URL=http://localhost:5000 TEST_HOTEL_ID=<uuid of a hotel with rooms=1> node tests/concurrency.test.js
//
// TEST_HOTEL_ID should be a hotel with `rooms = 1` and no existing
// bookings in the test date range below, ideally a disposable/seed hotel
// on a staging project — never point this at production.

const API_URL = process.env.API_URL || "http://localhost:5000";
const HOTEL_ID = process.env.TEST_HOTEL_ID;

if (!HOTEL_ID) {
  console.error("Set TEST_HOTEL_ID to a real hotel id (rooms = 1, no bookings in the test window) before running.");
  process.exit(1);
}

function future(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

async function attemptBooking(n) {
  const res = await fetch(`${API_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hotel_id: HOTEL_ID,
      guest_name: `Concurrency Test ${n}`,
      guest_email: `concurrency-test-${n}@example.com`,
      check_in: future(30),
      check_out: future(32),
      guests: 2,
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, message: body.message };
}

// Test 1: N simultaneous booking attempts for a 1-room hotel, same
// dates. Exactly ONE should succeed; the rest should get a clean
// "sold out" response — never all N succeeding (double-booking) and
// never a 500 (an unhandled race).
async function testConcurrentBookingSameInventory() {
  const N = 8;
  console.log(`\n[1] Firing ${N} concurrent booking requests for hotel ${HOTEL_ID} (expect exactly 1 success)...`);
  const results = await Promise.all(Array.from({ length: N }, (_, i) => attemptBooking(i)));

  const succeeded = results.filter(r => r.ok);
  const soldOut = results.filter(r => !r.ok && /sold out/i.test(r.message || ""));
  const unexpected = results.filter(r => !r.ok && !/sold out/i.test(r.message || ""));

  console.log(`    succeeded=${succeeded.length} sold_out=${soldOut.length} unexpected_errors=${unexpected.length}`);
  if (unexpected.length) console.log("    unexpected:", unexpected);

  if (succeeded.length === 1 && soldOut.length === N - 1) {
    console.log("    PASS — exactly one booking won the race, everyone else cleanly told sold out.");
  } else if (succeeded.length > 1) {
    console.log("    FAIL — DOUBLE-BOOKING: more than one request succeeded for the same inventory.");
  } else {
    console.log("    FAIL — unexpected result shape, see above.");
  }
  return succeeded.length === 1 && unexpected.length === 0;
}

// Test 2: after the winning booking above, hit availability for the
// exact same window again — should now report no rooms free.
async function testAvailabilityReflectsBooking() {
  console.log(`\n[2] Checking /api/hotels/${HOTEL_ID} is now reported sold out for the same window via a fresh attempt...`);
  const r = await attemptBooking("followup");
  const soldOut = !r.ok && /sold out/i.test(r.message || "");
  console.log(soldOut ? "    PASS — still correctly sold out." : `    FAIL — expected sold out, got status=${r.status} message=${r.message}`);
  return soldOut;
}

(async () => {
  const results = [];
  results.push(await testConcurrentBookingSameInventory());
  results.push(await testAvailabilityReflectsBooking());

  const allPassed = results.every(Boolean);
  console.log(`\n${allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}`);
  process.exit(allPassed ? 0 : 1);
})();
