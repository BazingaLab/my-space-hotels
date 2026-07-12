import PolicyLayout from "../components/PolicyLayout.jsx";
import { theme } from "../lib/theme.js";

export default function Sustainability() {
  return (
    <PolicyLayout
      eyebrow="— Sustainability Commitment"
      title="Building hospitality"
      accent="with purpose."
      intro="At My Space Hotel & Resorts, we believe that true hospitality extends far beyond providing comfortable rooms — it means creating a positive impact on our guests, communities, environment, and future generations. As we expand our presence across India, sustainability remains a core pillar of our business philosophy. To strengthen this commitment, My Space Hotel & Resorts proudly collaborates with EDU – Educate Develop Unravel, a registered non-governmental organization dedicated to education, skill development, environmental conservation, and community empowerment."
      sections={[
        {
          heading: "Environmental responsibility",
          paragraphs: ["We recognize the hospitality industry's responsibility to reduce its environmental impact. Through our partnership with EDU, we are committed to initiatives that help restore ecological balance and reduce our carbon footprint. Our key environmental initiatives include:"],
          list: [
            "Tree plantation drives across communities and hotel locations.",
            "Promoting green landscapes around our hotels and resorts.",
            "Encouraging responsible water and energy consumption.",
            "Gradual adoption of energy-efficient lighting and equipment.",
            "Reducing single-use plastics wherever practical.",
            "Improving waste segregation and responsible disposal practices.",
            "Supporting environmentally conscious procurement and sustainable sourcing.",
          ],
          sub: [{ paragraphs: ["Our long-term goal is to build a hospitality network that grows responsibly while protecting the environment for future generations."] }],
        },
        {
          heading: "Reducing our carbon footprint",
          paragraphs: ["As part of our sustainability roadmap, My Space Hotel & Resorts is committed to lowering greenhouse gas emissions by improving operational efficiency across all our properties. Our focus areas include:"],
          list: [
            "Energy conservation through efficient infrastructure.",
            "Digital documentation to reduce paper consumption.",
            "Responsible linen and towel management programs.",
            "Water-saving housekeeping practices.",
            "Encouraging guests and employees to participate in sustainable initiatives.",
            "Measuring and continuously improving environmental performance.",
          ],
          sub: [{ paragraphs: ["Every small step contributes towards creating cleaner, healthier communities."] }],
        },
        {
          heading: "Empowering youth through hospitality",
          paragraphs: ["Sustainability is not only about protecting the environment — it is equally about creating opportunities for people. In collaboration with EDU – Educate Develop Unravel, we are committed to empowering young individuals by providing access to hospitality education, skill development, practical training, and employment opportunities. Our initiatives include:"],
          list: [
            "Hospitality skill development programs.",
            "Internship and apprenticeship opportunities.",
            "Hotel operations training.",
            "Front office and guest service development.",
            "Housekeeping and food & beverage service training.",
            "Career guidance and employability workshops.",
            "Employment opportunities within the My Space Hotel & Resorts network and partner properties.",
          ],
          sub: [{ paragraphs: ["We believe that investing in people creates stronger businesses and stronger communities."] }],
        },
        {
          heading: "Supporting local communities",
          paragraphs: ["As we expand into new destinations, we aim to become active contributors to local economic development by:"],
          list: [
            "Creating employment opportunities.",
            "Supporting local suppliers and small businesses.",
            "Promoting regional tourism.",
            "Encouraging community participation in sustainability initiatives.",
            "Partnering with local organizations for social impact programs.",
          ],
          sub: [{ paragraphs: ["Our growth is meaningful only when the communities around us grow together."] }],
        },
        {
          heading: "Responsible growth",
          paragraphs: ["Every hotel that joins the My Space Hotel & Resorts network is encouraged to adopt responsible operational practices that align with our sustainability values. Through standardized operating procedures, staff awareness, and continuous improvement, we aim to build a hospitality ecosystem where business success goes hand in hand with environmental responsibility and social progress."],
        },
        {
          heading: "Looking ahead",
          paragraphs: [
            "Our vision is to become one of India's most trusted hospitality brands — not only for exceptional guest experiences but also for our commitment to sustainable development.",
            "Together with EDU – Educate Develop Unravel, we aspire to plant thousands of trees, reduce environmental impact, educate and train the next generation of hospitality professionals, and create meaningful employment opportunities across the country.",
            "Because sustainability is not a one-time initiative — it is a long-term commitment to building a better future.",
          ],
        },
      ]}
      footer={
        <>
          <div className="serif" style={{ fontSize: 20, color: theme.INK, marginBottom: 6 }}>My Space Hotel & Resorts</div>
          <div style={{ fontSize: 13, color: theme.MUTED, marginBottom: 14 }}>In Collaboration with EDU – Educate Develop Unravel</div>
          <div style={{ fontStyle: "italic", color: theme.MUTED, fontSize: 14 }}>Growing Hospitality. Growing Communities. Growing a Greener Future.</div>
        </>
      }
    />
  );
}