import { supabase } from "../config/supabase.js";

const hotels = [
  {
    name: "The Heritage Verandah",
    city: "Udaipur",
    state: "Rajasthan",
    description: "An 18th-century haveli reimagined as a 12-suite hideaway overlooking Lake Pichola. Hand-painted frescoes, antique brass, and a courtyard pool that mirrors the night sky.",
    short_description: "Lakefront heritage haveli with 12 curated suites.",
    cover_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
    ],
    price: 18500,
    rating: 4.9,
    review_count: 312,
    tag: "Heritage",
    amenities: ["Pool", "Spa", "Restaurant", "WiFi", "Lake View", "Heritage Tours"],
    rooms: 12,
    featured: true,
  },
  {
    name: "Casa de Mar",
    city: "Goa",
    state: "Goa",
    description: "A whitewashed Portuguese villa steps from Anjuna's quieter cove. Sunset cocktails on the verandah, fresh catch dinners, and a garden that smells of frangipani.",
    short_description: "Whitewashed beachfront villa in Anjuna.",
    cover_image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80",
    ],
    price: 12400,
    rating: 4.8,
    review_count: 248,
    tag: "Beachfront",
    amenities: ["Beach Access", "Pool", "Bar", "WiFi", "Yoga Deck"],
    rooms: 8,
    featured: true,
  },
  {
    name: "Backwater Reserve",
    city: "Alleppey",
    state: "Kerala",
    description: "Six floating suites on Vembanad Lake, each with a private deck. Mornings are kingfishers and toddy-tappers; evenings are lantern light on still water.",
    short_description: "Floating luxury suites on Kerala's backwaters.",
    cover_image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80",
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80",
    ],
    price: 21800,
    rating: 4.9,
    review_count: 187,
    tag: "Luxury",
    amenities: ["Private Deck", "Ayurveda Spa", "Restaurant", "Boat Tours", "WiFi"],
    rooms: 6,
    featured: true,
  },
  {
    name: "The Pink Courtyard",
    city: "Jaipur",
    state: "Rajasthan",
    description: "A boutique stay tucked behind Hawa Mahal — terracotta floors, jharokha windows, and a rooftop where breakfast comes with a view of the old city waking up.",
    short_description: "Boutique stay behind Hawa Mahal.",
    cover_image: "https://images.unsplash.com/photo-1599661046827-dacde6976549?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1599661046827-dacde6976549?w=1200&q=80"],
    price: 9800,
    rating: 4.7,
    review_count: 421,
    tag: "Boutique",
    amenities: ["Rooftop", "Restaurant", "WiFi", "City Tours"],
    rooms: 14,
    featured: true,
  },
  {
    name: "Pine & Pinecone Lodge",
    city: "Manali",
    state: "Himachal Pradesh",
    description: "A timber lodge at 7,200 ft, wood-fire stoves, hand-knotted rugs, and a library stocked with paperbacks for the longer evenings.",
    short_description: "Mountain timber lodge above the apple orchards.",
    cover_image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80"],
    price: 14200,
    rating: 4.8,
    review_count: 156,
    tag: "Mountain",
    amenities: ["Fireplace", "Library", "Restaurant", "WiFi", "Trekking"],
    rooms: 10,
    featured: false,
  },
  {
    name: "The Marigold House",
    city: "Pondicherry",
    state: "Tamil Nadu",
    description: "A French Quarter mansion painted the colour of marigold petals. Bicycles at the door, a courtyard café, and the sea five minutes away.",
    short_description: "French Quarter mansion with courtyard café.",
    cover_image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80"],
    price: 8600,
    rating: 4.7,
    review_count: 298,
    tag: "Boutique",
    amenities: ["Café", "Bicycles", "WiFi", "Garden"],
    rooms: 9,
    featured: false,
  },
];

const seed = async () => {
  console.log("✦ Seeding hotels...");

  const { error: deleteError } = await supabase.from("hotels").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) console.warn("Delete warning:", deleteError.message);

  const { data, error } = await supabase.from("hotels").insert(hotels).select();

  if (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`✓ Inserted ${data.length} hotels`);
  process.exit(0);
};

seed();
