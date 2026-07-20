import PolicyLayout from "../components/PolicyLayout.jsx";
import { theme } from "../lib/theme.js";

export default function HotelPartnerTerms() {
  return (
    <PolicyLayout
      eyebrow="— Last Updated: __________"
      title="Hotel Partner"
      accent="Terms & Conditions."
      intro='Welcome to Rooming Hospitality. By creating a hotel partner account, submitting your property details, or clicking "I Agree," you acknowledge that you have read, understood, and agreed to be legally bound by these Terms & Conditions. If you do not agree to these Terms, please do not register your property on our platform.'
      sections={[
        {
          heading: "1. About Rooming Hospitality",
          paragraphs: ["Rooming Hospitality is a hospitality technology and marketing platform that helps hotels generate bookings through various online and offline sales channels, including Online Travel Agencies (OTAs), corporate clients, travel agents, direct bookings, and other distribution partners."],
        },
        {
          heading: "2. Eligibility",
          paragraphs: ["By registering your property, you confirm that:"],
          list: [
            "You are the owner or an authorized representative of the property.",
            "You have the legal authority to enter into this agreement.",
            "All information submitted is accurate and complete.",
            "Your property possesses all necessary licenses, registrations, and government approvals required to operate legally.",
          ],
        },
        {
          heading: "3. Hotel Information",
          paragraphs: ["You agree that all information provided, including but not limited to:"],
          list: ["Property Name", "Address", "Contact Details", "GST Details", "Bank Details", "Room Inventory", "Room Rates", "Amenities", "Property Images", "Policies"],
          sub: [{ paragraphs: ["is true, accurate, and regularly updated. Rooming Hospitality reserves the right to remove or suspend listings containing false or misleading information."] }],
        },
        {
          heading: "4. Booking Services",
          paragraphs: ["Rooming Hospitality may promote and sell your rooms through one or more booking channels. We may:"],
          list: [
            "List your property on various booking platforms.",
            "Generate direct bookings.",
            "Manage OTA listings.",
            "Provide revenue management services.",
            "Promote your property through digital marketing campaigns.",
            "Provide booking support and customer service.",
          ],
          sub: [{ paragraphs: ["Rooming Hospitality does not guarantee any minimum number of bookings or revenue."] }],
        },
        {
          heading: "5. Rates & Inventory",
          paragraphs: ["You agree to:"],
          list: [
            "Maintain accurate room availability.",
            "Keep pricing updated.",
            "Honour all confirmed bookings.",
            "Avoid deliberate overbooking.",
            "Notify Rooming Hospitality immediately regarding any inventory changes.",
          ],
          sub: [{ paragraphs: ["Failure to honour confirmed bookings may result in penalties, suspension, or permanent removal from the platform."] }],
        },
        {
          heading: "6. Hotel Responsibilities",
          paragraphs: ["The Hotel is solely responsible for:"],
          list: [
            "Guest check-in and check-out.",
            "Room cleanliness.",
            "Staff behaviour.",
            "Safety and security.",
            "Food quality (if applicable).",
            "Legal compliance.",
            "Taxes and statutory obligations.",
            "Guest experience.",
          ],
          sub: [{ paragraphs: ["Rooming Hospitality is only a booking facilitator and shall not be responsible for day-to-day hotel operations."] }],
        },
        {
          heading: "7. Commission & Payments",
          paragraphs: [
            "Commission, service fees, payment cycles, and settlement timelines shall be communicated separately or through your Hotel Dashboard.",
            "Rooming Hospitality reserves the right to deduct applicable commissions, taxes, refunds, chargebacks, or other agreed charges before settlement.",
          ],
        },
        {
          heading: "8. Cancellation & Refunds",
          paragraphs: [
            "Bookings shall follow the cancellation policy displayed at the time of booking or agreed separately between the parties.",
            "Where refunds are applicable, they shall be processed according to the applicable booking policy.",
          ],
        },
        {
          heading: "9. Overbooking & Relocation",
          paragraphs: ["If your property cannot honour a confirmed reservation due to overbooking or operational issues, you agree to:"],
          list: [
            "Arrange equivalent or upgraded accommodation for the guest.",
            "Bear any additional costs arising from such relocation.",
            "Compensate the guest where applicable.",
          ],
        },
        {
          heading: "10. Marketing Authorization",
          paragraphs: ["You authorize Rooming Hospitality to use your:"],
          list: ["Property Name", "Logo", "Images", "Videos", "Room Details", "Amenities", "Promotional Content"],
          sub: [{ paragraphs: ["for listing, marketing, advertising, social media, digital campaigns, and partner distribution channels."] }],
        },
        {
          heading: "11. Intellectual Property",
          paragraphs: [
            "All software, website content, trademarks, branding, logos, and technology used by Rooming Hospitality remain the exclusive property of Rooming Hospitality.",
            "Hotels may not copy, reproduce, or misuse any part of the platform without prior written consent.",
          ],
        },
        {
          heading: "12. Prohibited Activities",
          paragraphs: ["Hotels shall not:"],
          list: [
            "Submit false information.",
            "Refuse confirmed bookings without valid reasons.",
            "Manipulate pricing after confirmation.",
            "Encourage guests to cancel platform bookings and book directly.",
            "Engage in fraudulent activities.",
            "Misrepresent property facilities.",
            "Upload copyrighted content without permission.",
          ],
          sub: [{ paragraphs: ["Violation of these Terms may result in immediate suspension or permanent termination."] }],
        },
        {
          heading: "13. Suspension & Termination",
          paragraphs: ["Rooming Hospitality may suspend or terminate any hotel account without prior notice if it finds:"],
          list: [
            "Fraudulent activities.",
            "Fake bookings.",
            "Guest safety concerns.",
            "Serious customer complaints.",
            "Non-payment of dues.",
            "Violation of these Terms.",
            "Illegal activities.",
          ],
        },
        {
          heading: "14. Limitation of Liability",
          paragraphs: ["Rooming Hospitality acts solely as a booking and marketing platform. We shall not be liable for:"],
          list: [
            "Property damage.",
            "Theft.",
            "Guest misconduct.",
            "Operational failures.",
            "Staff behaviour.",
            "Food quality.",
            "Force majeure events.",
            "Government actions.",
            "Technical failures beyond our reasonable control.",
          ],
          sub: [{ paragraphs: ["Our maximum liability shall not exceed the commission earned from the affected booking."] }],
        },
        {
          heading: "15. Privacy",
          paragraphs: ["By registering, you consent to the collection and use of your business information for onboarding, bookings, payment processing, customer support, legal compliance, and marketing activities in accordance with our Privacy Policy."],
        },
        {
          heading: "16. Changes to Terms",
          paragraphs: [
            "Rooming Hospitality may modify these Terms & Conditions at any time.",
            "Updated Terms become effective immediately upon publication on the website. Continued use of the platform constitutes acceptance of the revised Terms.",
          ],
        },
        {
          heading: "17. Governing Law",
          paragraphs: [
            "These Terms shall be governed by the laws of India.",
            "Any disputes shall be subject to the exclusive jurisdiction of the courts located in Faridabad, Haryana.",
          ],
        },
        {
          heading: "18. Electronic Acceptance",
          paragraphs: [
            'By selecting the checkbox "I have read, understood, and agree to the Hotel Partner Terms & Conditions and authorize Rooming Hospitality to market and distribute my property through its booking channels," you acknowledge that:',
          ],
          list: [
            "This electronic acceptance is legally valid and binding.",
            "It has the same legal effect as a handwritten signature.",
            "You are authorized to accept these Terms on behalf of the hotel or property.",
            "You consent to receive communications electronically regarding your partnership with Rooming Hospitality.",
          ],
          sub: [{ paragraphs: ['Once you select "Accept & Continue," these Terms become effective immediately.'] }],
        },
      ]}
      footer={
        <>
          <div className="serif" style={{ fontSize: 20, color: theme.INK, marginBottom: 6 }}>Rooming Hospitality</div>
          <div style={{ fontStyle: "italic", color: theme.MUTED, fontSize: 14 }}>Hotel Partner Terms & Conditions</div>
        </>
      }
    />
  );
}