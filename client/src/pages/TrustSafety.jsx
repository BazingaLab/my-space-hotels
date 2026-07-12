import PolicyLayout from "../components/PolicyLayout.jsx";
import { theme } from "../lib/theme.js";

export default function TrustSafety() {
  return (
    <PolicyLayout
      eyebrow="— Trust & Safety"
      title="Your safety."
      accent="Our responsibility."
      intro="At My Space Hotel & Resorts, trust is the foundation of every guest experience. Whether you are booking a room for business, leisure, family travel, or a special occasion, we are committed to providing a safe, transparent, and reliable hospitality experience across every property in our network. Our promise goes beyond offering comfortable accommodations — we strive to create an environment where guests, hotel partners, employees, and communities can place their confidence in our brand."
      sections={[
        {
          heading: "Guest safety",
          paragraphs: ["The safety and well-being of our guests remain our highest priority. We encourage our partner hotels to implement:"],
          list: [
            "Guest identity verification during check-in in accordance with applicable laws.",
            "Secure access to hotel premises.",
            "Well-trained staff for guest assistance.",
            "Emergency response procedures.",
            "Fire safety equipment and evacuation plans.",
            "CCTV surveillance in designated public areas, where applicable.",
            "Compliance with local safety regulations.",
          ],
        },
        {
          heading: "Cleanliness & hygiene",
          paragraphs: ["Every guest deserves a clean and hygienic environment. Our partner hotels are expected to maintain:"],
          list: [
            "Regular room cleaning and sanitization.",
            "Fresh bed linen and towels.",
            "Clean bathrooms and common areas.",
            "Safe food preparation practices (where food services are offered).",
            "Routine housekeeping inspections.",
          ],
          sub: [{ paragraphs: ["We continuously encourage high standards of cleanliness throughout our hospitality network."] }],
        },
        {
          heading: "Verified hotel partners",
          paragraphs: ["We work towards building a trusted network of professionally managed hotel partners. Before onboarding, hotels may undergo evaluation based on factors such as:"],
          list: ["Business documentation.", "Property quality.", "Guest service standards.", "Hygiene practices.", "Operational readiness."],
          sub: [{ paragraphs: ["Our objective is to provide guests with dependable accommodation choices while supporting hotel owners in improving operational standards."] }],
        },
        {
          heading: "Transparent pricing",
          paragraphs: ["We believe guests should know exactly what they are paying for. Our booking platform is designed to promote:"],
          list: ["Clear room pricing.", "Transparent taxes and charges.", "No hidden costs at checkout.", "Honest property information.", "Accurate room descriptions and amenities."],
        },
        {
          heading: "Responsible booking experience",
          paragraphs: ["We aim to make every booking simple and secure by providing:"],
          list: ["Instant booking confirmation (where applicable).", "Clear cancellation policies.", "Secure payment options.", "Dedicated customer support.", "Transparent booking records."],
        },
        {
          heading: "Respect & inclusion",
          paragraphs: ["My Space Hotel & Resorts believes hospitality should be welcoming and respectful. We encourage all hotels within our network to foster an environment that promotes:"],
          list: ["Courtesy and professionalism.", "Respect for all guests.", "Equal service standards.", "A safe and welcoming atmosphere."],
          sub: [{ paragraphs: ["Guests are also expected to treat hotel staff, other guests, and property with respect."] }],
        },
        {
          heading: "Privacy & data protection",
          paragraphs: ["Protecting customer information is an important part of our responsibility. We are committed to handling personal information responsibly and in accordance with our Privacy Policy and applicable laws. Guest information is used only for legitimate booking, operational, and legal purposes."],
        },
        {
          heading: "Responsible hotel partnerships",
          paragraphs: ["Every partner hotel is encouraged to uphold our operational values, including:"],
          list: ["Ethical business practices.", "Compliance with applicable laws and regulations.", "Fair treatment of employees.", "Commitment to guest satisfaction.", "Continuous improvement in service quality."],
          sub: [{ paragraphs: ["Hotels that consistently fail to meet our operational standards may be subject to review, suspension, or removal from the My Space Hotel & Resorts network."] }],
        },
        {
          heading: "Building safer communities",
          paragraphs: ["Our commitment extends beyond hotel operations. In collaboration with EDU – Educate Develop Unravel, we support initiatives focused on:"],
          list: ["Youth skill development in hospitality.", "Employment generation.", "Environmental sustainability.", "Tree plantation drives.", "Community awareness programs.", "Responsible tourism."],
          sub: [{ paragraphs: ["We believe that strong communities create stronger hospitality experiences."] }],
        },
        {
          heading: "Our promise",
          paragraphs: ["Every booking made through My Space Hotel & Resorts represents our commitment to:"],
          list: ["Safety", "Cleanliness", "Transparency", "Professionalism", "Reliability", "Continuous Improvement"],
          sub: [{ paragraphs: ["While individual experiences may vary depending on property type and location, we continuously work with our hotel partners to maintain consistent quality standards across our growing network."] }],
        },
      ]}
      footer={
        <>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 20 }}>
            If you have any questions, safety concerns, or wish to report an issue related to your booking or stay, our support team is here to help.
          </div>
          <div className="serif" style={{ fontSize: 20, color: theme.INK, marginBottom: 6 }}>My Space Hotel & Resorts</div>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 4 }}>Email: support@myspacehotels.in</div>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 14 }}>Phone: +91-XXXXXXXXXX</div>
          <div style={{ fontStyle: "italic", color: theme.MUTED, fontSize: 14 }}>"A Place Where Consistency Remains the Same Everywhere."</div>
        </>
      }
    />
  );
}