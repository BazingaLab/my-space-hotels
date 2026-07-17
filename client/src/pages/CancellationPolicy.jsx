import PolicyLayout from "../components/PolicyLayout.jsx";
import { theme } from "../lib/theme.js";

export default function CancellationPolicy() {
  return (
    <PolicyLayout
      eyebrow="— Effective Date: ___________"
      title="Cancellation"
      accent="& Refund Policy."
      intro="At My Space Hotel & Resorts, we understand that travel plans may change. Our cancellation policy is designed to be fair to both our guests and our hotel partners while ensuring smooth operations."
      sections={[
        {
          heading: "1. Standard cancellation policy",
          list: [
            "Free Cancellation: Guests may cancel their reservation free of charge up to 24 hours before the scheduled check-in time unless otherwise specified at the time of booking.",
            "Late Cancellation: Cancellations made within 24 hours of the scheduled check-in will be subject to a charge equivalent to one night's room tariff or 100% of the booking amount for one-night stays.",
            "No Show: If a guest does not arrive at the hotel without prior cancellation, the booking will be treated as a No Show, and 100% of the booking amount will be forfeited.",
          ],
        },
        {
          heading: "1a. Hourly & short-stay bookings",
          paragraphs: [
            "Hourly and short-stay bookings (4-hour and 6-hour slots) are non-refundable once confirmed, given their short-notice nature. This applies regardless of how far in advance the booking was made.",
          ],
        },
        {
          heading: "2. Non-refundable bookings",
          paragraphs: ["Certain promotional offers, discounted rates, advance purchase deals, festival packages, and special event bookings may be marked as Non-Refundable. Such bookings cannot be cancelled, modified, or refunded unless required by applicable law."],
        },
        {
          heading: "3. Modification of booking",
          paragraphs: ["Requests to modify booking dates, guest names, or room categories are subject to:"],
          list: ["Room availability.", "Applicable rate differences.", "Approval by the hotel."],
          sub: [{ paragraphs: ["Additional charges may apply where applicable."] }],
        },
        {
          heading: "4. Refund process",
          paragraphs: ["Where a refund is applicable:"],
          list: [
            "Refunds will be processed through the original mode of payment.",
            "Refunds are generally initiated within 7–10 business days after cancellation approval.",
            "The actual credit timeline may vary depending on the guest's bank, payment gateway, or card issuer.",
          ],
        },
        {
          heading: "5. Early check-out",
          paragraphs: ["Guests choosing to check out before the confirmed departure date may be charged for one additional night's stay or as per the booking terms agreed at the time of reservation."],
        },
        {
          heading: "6. Group bookings",
          paragraphs: ["Bookings involving five (5) or more rooms may be subject to separate cancellation policies and payment schedules. Such terms will be communicated during the booking confirmation."],
        },
        {
          heading: "7. Peak season & special dates",
          paragraphs: ["Reservations made during:"],
          list: ["National holidays", "Festivals", "Long weekends", "Major local events", "Wedding season", "Special promotional periods"],
          sub: [{ paragraphs: ["may carry different cancellation terms, including partial or full advance payment and restricted refunds. These conditions will be clearly communicated before booking confirmation."] }],
        },
        {
          heading: "8. Force majeure",
          paragraphs: ["My Space Hotel & Resorts shall not be held responsible for cancellations or disruptions caused by circumstances beyond reasonable control, including but not limited to natural disasters, government restrictions, pandemics, civil disturbances, transportation disruptions, or other force majeure events. Refunds or rescheduling in such situations shall be considered in accordance with applicable laws and the booking conditions."],
        },
        {
          heading: "9. Third-party bookings",
          paragraphs: ["Reservations made through Online Travel Agencies (OTAs), travel agents, or other third-party booking platforms are governed by the cancellation and refund policies of the respective booking platform. Guests are advised to contact the platform through which the reservation was made."],
        },
        {
          heading: "10. Refund exceptions",
          paragraphs: ["Refunds will not be provided for:"],
          list: [
            "Voluntary early departure after check-in (except where specifically agreed).",
            "Unused hotel services or amenities.",
            "Guest dissatisfaction arising from circumstances beyond the hotel's control.",
            "Incorrect booking details provided by the guest.",
          ],
        },
        {
          heading: "11. Company's right to cancel",
          paragraphs: ["My Space Hotel & Resorts reserves the right to cancel or modify reservations due to:"],
          list: [
            "Technical or pricing errors.",
            "Duplicate or fraudulent bookings.",
            "Non-compliance with hotel policies.",
            "Force majeure events.",
            "Operational reasons affecting the property's ability to accommodate guests.",
          ],
          sub: [{ paragraphs: ["Where payment has already been received and the booking is cancelled by the company (other than due to guest default), an appropriate refund or suitable alternative accommodation, where feasible, will be offered."] }],
        },
      ]}
      footer={
        <>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 20 }}>
            For any cancellation, modification, or refund-related queries, please contact our Reservations Team.
          </div>
          <div className="serif" style={{ fontSize: 20, color: theme.INK, marginBottom: 6 }}>My Space Hotel & Resorts</div>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 4 }}>Email: reservations@myspacehotels.in</div>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 14 }}>Phone: +91-XXXXXXXXXX</div>
          <div style={{ fontStyle: "italic", color: theme.MUTED, fontSize: 14 }}>"A Place Where Consistency Remains the Same Everywhere."</div>
        </>
      }
    />
  );
}