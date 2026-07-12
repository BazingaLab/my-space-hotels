import PolicyLayout from "../components/PolicyLayout.jsx";
import { theme } from "../lib/theme.js";

export default function OurStory() {
  return (
    <PolicyLayout
      eyebrow="— Our Story"
      title="Every great journey"
      accent="begins with a purpose."
      intro="At My Space Hotel & Resorts, our story began with a simple yet powerful vision — to make quality hospitality accessible to everyone without compromising on comfort, cleanliness, or trust."
      sections={[
        {
          heading: "Where it started",
          paragraphs: [
            "As passionate travelers and hospitality professionals, we observed a recurring challenge in the budget hotel industry. Families, business travelers, and tourists were often disappointed by the gap between what was promised online and what was actually delivered upon arrival. Attractive photographs, unrealistic promises, poor hygiene, inconsistent service standards, and a lack of accountability had slowly transformed hotel booking from an exciting experience into a stressful uncertainty.",
            "We believed travelers deserved better.",
            "In 2025, from the vibrant city of Palwal, Haryana, we set out to build a hospitality brand that would redefine affordable accommodation by placing consistency, transparency, and guest satisfaction at the heart of everything we do.",
            "Our mission is not merely to provide rooms — it is to create memorable stays where every guest feels welcomed, respected, safe, and valued. Whether you're traveling for business, leisure, family vacations, medical visits, or special occasions, we strive to ensure that every stay exceeds expectations.",
          ],
        },
        {
          heading: "From hotel booking craze to hotel booking confidence",
          paragraphs: [
            "Booking a hotel should be exciting, not stressful. Unfortunately, many travelers have experienced:",
          ],
          list: [
            "Rooms that don't match the online pictures.",
            "Hidden charges and unexpected surprises.",
            "Poor cleanliness and hygiene.",
            "Inconsistent customer service.",
            "Lack of safety and professionalism.",
          ],
          sub: [{
            paragraphs: [
              "At My Space Hotel & Resorts, we challenge this reality by focusing on the details that others often overlook. Our dedicated team continuously improves every stage of the guest journey — from discovering a property online to the moment guests check out with a smile.",
              "We don't believe hospitality begins at check-in. It begins with trust.",
            ],
          }],
        },
        {
          heading: "Our foundation",
          paragraphs: ["Every decision we make is guided by five core values that define who we are and how we serve."],
          sub: [
            { heading: "Commitment", paragraphs: ["Our promise is simple: we deliver what we commit. We believe trust is earned through actions, not advertisements. Every property associated with My Space Hotel & Resorts is expected to maintain the standards we promise to our guests."] },
            { heading: "Safety", paragraphs: ["The comfort of our guests begins with their safety. We follow carefully designed Standard Operating Procedures (SOPs) covering guest verification, property security, hygiene practices, emergency preparedness, and staff training to create a secure environment for every traveler."] },
            { heading: "Priority", paragraphs: ["Every guest matters. From easy booking and quick confirmations to responsive customer support and smooth check-in experiences, we work to remove unnecessary hassles so that our guests can focus on enjoying their journey."] },
            { heading: "Hygiene", paragraphs: ["Cleanliness is not a luxury — it is a necessity. Our properties are maintained through standardized housekeeping procedures to ensure clean rooms, sanitized bathrooms, fresh linen, and hygienic common areas because we believe affordability should never come at the cost of cleanliness."] },
            { heading: "Reliability", paragraphs: ["A brand becomes successful when people trust it repeatedly. Our goal is to build a hospitality network where guests can confidently choose My Space Hotel & Resorts anywhere they travel, knowing they will receive the same dependable service and quality standards every time."] },
          ],
        },
        {
          heading: "More than just hotels",
          paragraphs: ["Today, My Space Hotel & Resorts is evolving into a complete hospitality ecosystem. Our business model includes:"],
          list: [
            "Company-owned hotels and resorts.",
            "Carefully curated partner hotels through our aggregation network.",
            "Technology-driven hotel management solutions.",
            "Hospitality investment opportunities for individuals seeking professionally managed hotel assets.",
            "Standardized operating systems that help independent hotels improve occupancy, service quality, and profitability.",
          ],
          sub: [{ paragraphs: ["By combining hospitality expertise, technology, and operational excellence, we aim to create value for guests, hotel owners, employees, and investors alike."] }],
        },
        {
          heading: "Our vision",
          paragraphs: [
            "Our vision is to become India's most trusted and consistent budget and mid-scale hospitality brand by building a nationwide network of professionally managed hotels that deliver exceptional guest experiences at affordable prices.",
            "We aspire to expand across Tier-1, Tier-2, and Tier-3 cities while preserving the values that shaped our journey from the very beginning.",
          ],
        },
        {
          heading: "Our mission",
          paragraphs: ["To provide safe, hygienic, reliable, and affordable hospitality experiences while creating long-term value for guests, hotel partners, investors, and communities through operational excellence, innovation, and unwavering consistency."],
        },
        {
          heading: "Looking ahead",
          paragraphs: [
            "Our journey has only just begun. With every new hotel, every satisfied guest, and every trusted partnership, we move one step closer to our dream of building a hospitality brand that India can rely on.",
            "Because for us, hospitality is not simply about offering a room — it is about creating a place where people feel comfortable, cared for, and truly at home.",
          ],
        },
      ]}
      footer={
        <>
          <div className="serif" style={{ fontSize: 20, color: theme.INK, marginBottom: 6 }}>My Space Hotel & Resorts</div>
          <div style={{ fontStyle: "italic", color: theme.MUTED, fontSize: 14 }}>"A Place Where Consistency Remains the Same Everywhere."</div>
        </>
      }
    />
  );
}