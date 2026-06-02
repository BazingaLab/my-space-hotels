import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowRight, ArrowUpRight, Quote } from "lucide-react";
import { theme } from "../lib/theme.js";
import { api } from "../lib/api.js";
import SearchBar from "../components/SearchBar.jsx";
import HotelCard from "../components/HotelCard.jsx";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.getFeaturedHotels(), api.getPopularDestinations()])
      .then(([f, d]) => {
        setFeatured(f.hotels || []);
        setDestinations(d.destinations || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const testimonials = [
    { name: "Ananya Kapoor", role: "Architect, Mumbai", text: "My Space curated a stay so thoughtful, every detail felt designed for me. The kind of trip you remember in fragments — golden hour, the smell of jasmine, perfect quiet.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" },
    { name: "Rohan Mehta", role: "Filmmaker, Bengaluru", text: "Booking was seamless and the property exceeded every expectation. This isn't aggregation — it's curation. There's a difference, and you feel it instantly.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" },
  ];

  return (
    <main>
      {/* HERO */}
      <section style={{ padding: "80px 6vw 60px" }}>
        <div className="grid-2-mobile" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 1, background: theme.SEA }}></div>
              <span style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, textTransform: "uppercase" }}>Curated Since 2019</span>
            </div>
            <h1 className="serif fade-up-2" style={{ fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 1.02, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 28 }}>
              Where every<br />
              <em style={{ color: theme.SEA, fontWeight: 400 }}>stay</em> tells a<br />
              <span style={{ position: "relative" }}>
                story.
                <svg style={{ position: "absolute", left: 0, bottom: -8, width: "100%" }} viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M2 8 Q 50 2, 100 6 T 198 5" stroke={theme.SEA} strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="fade-up-3" style={{ fontSize: 17, lineHeight: 1.6, color: "#4A5856", maxWidth: 480, marginBottom: 40, fontWeight: 300 }}>
              Discover a hand-picked collection of heritage palaces, coastal hideaways, and mountain retreats — each one chosen for its character, not its category.
            </p>
            <div className="fade-up-4" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <Link to="/hotels" className="cta-btn" style={{ padding: "16px 32px", background: theme.SEA, color: theme.CREAM, textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10 }}>
                Explore Collection <ArrowRight size={14} />
              </Link>
              <a href="#" className="link-underline" style={{ fontSize: 13, color: theme.INK, textDecoration: "none", letterSpacing: "0.1em" }}>How we curate →</a>
            </div>
          </div>

          <div className="fade-up-3 hide-mobile" style={{ position: "relative", height: 560 }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "70%", height: "65%", overflow: "hidden", borderRadius: 2 }}>
              <img src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&q=80" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "55%", height: "55%", overflow: "hidden", borderRadius: 2, border: `8px solid ${theme.CREAM}` }}>
              <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=700&q=80" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", top: "8%", left: "8%", background: theme.CREAM, padding: "14px 18px", boxShadow: "0 12px 40px rgba(0,0,0,0.08)", border: `1px solid ${theme.SAND}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex" }}>
                  {[...Array(5)].map((_,i) => <Star key={i} size={11} fill={theme.SEA} stroke={theme.SEA} />)}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600 }}>4.9 / 5</span>
              </div>
              <div style={{ fontSize: 10, color: theme.MUTED, marginTop: 4, letterSpacing: "0.05em" }}>From 12,400+ guests</div>
            </div>
            <div className="serif" style={{ position: "absolute", bottom: "18%", right: "-2%", fontSize: 13, fontStyle: "italic", color: theme.SEA_DARK, background: theme.CREAM, padding: "10px 18px", border: `1px solid ${theme.SEA}33` }}>
              ✦ 240+ properties across India
            </div>
          </div>
        </div>

        <div className="fade-up-4" style={{ marginTop: 60 }}>
          <SearchBar />
        </div>
      </section>

      {/* OFFERS */}
      <section style={{ margin: "40px 6vw", background: theme.SEA_DEEP, color: theme.CREAM, padding: "48px 56px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden", flexWrap: "wrap", gap: 24 }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, border: `1px solid ${theme.SEA}66`, borderRadius: "50%" }}></div>
        <div style={{ position: "absolute", right: 60, bottom: -80, width: 280, height: 280, border: `1px solid ${theme.SEA}33`, borderRadius: "50%" }}></div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA, marginBottom: 12, textTransform: "uppercase" }}>✦ Limited Offer</div>
          <h3 className="serif" style={{ fontSize: 42, fontWeight: 400, lineHeight: 1.1, marginBottom: 12 }}>The Monsoon Edit — <em>up to 30% off</em></h3>
          <p style={{ fontSize: 14, color: "#C8D4D1", maxWidth: 460, fontWeight: 300 }}>Twelve hand-picked retreats, reimagined for the rains. Valid for stays through September.</p>
        </div>
        <Link to="/hotels" className="cta-btn" style={{ background: theme.CREAM, color: theme.SEA_DEEP, padding: "16px 28px", textDecoration: "none", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10, position: "relative", fontWeight: 500 }}>
          View Offers <ArrowUpRight size={14} />
        </Link>
      </section>

      {/* DESTINATIONS */}
      <section style={{ padding: "100px 6vw 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>— 02 / Destinations</div>
            <h2 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em" }}>Cities <em style={{ color: theme.SEA }}>worth</em><br />wandering.</h2>
          </div>
          <Link to="/hotels" className="link-underline" style={{ fontSize: 13, color: theme.INK, textDecoration: "none", letterSpacing: "0.1em", paddingBottom: 8 }}>View all destinations →</Link>
        </div>
        {loading ? <div style={{ color: theme.MUTED }}>Loading destinations…</div> : (
          <div className="grid-2-mobile" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {destinations.map((d, i) => (
              <Link key={d.name} to={`/hotels?city=${d.name}`} className="card hover-lift" style={{ textDecoration: "none", color: theme.INK, position: "relative", overflow: "hidden", display: "block", marginTop: i % 2 ? 32 : 0 }}>
                <div style={{ width: "100%", height: 380, overflow: "hidden", position: "relative" }}>
                  <img src={d.image} alt={d.name} className="img-zoom" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 50%, ${theme.INK}cc 100%)` }}></div>
                  <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, color: theme.CREAM }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.25em", opacity: 0.85, textTransform: "uppercase", marginBottom: 6 }}>{d.state}</div>
                    <div className="serif" style={{ fontSize: 30, fontWeight: 400 }}>{d.name}</div>
                  </div>
                  <div style={{ position: "absolute", top: 16, right: 16, background: theme.CREAM, padding: "6px 12px", fontSize: 11, fontWeight: 500, color: theme.SEA_DARK }}>{d.count} stays</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED */}
      <section style={{ padding: "80px 6vw 100px", background: theme.SAND }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>— 03 / Featured Stays</div>
            <h2 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em" }}>This month's<br /><em style={{ color: theme.SEA }}>quiet favourites.</em></h2>
          </div>
          <Link to="/hotels" className="link-underline" style={{ fontSize: 13, color: theme.INK, textDecoration: "none", letterSpacing: "0.1em", paddingBottom: 8 }}>Browse all stays →</Link>
        </div>
        {error && <div style={{ color: "#a33", padding: 20 }}>Unable to load hotels: {error}. Make sure your backend is running.</div>}
        {loading ? <div style={{ color: theme.MUTED }}>Loading featured stays…</div> : (
          <div className="grid-1-mobile" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {featured.slice(0, 3).map(h => <HotelCard key={h.id} hotel={h} />)}
          </div>
        )}
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "120px 6vw", background: theme.CREAM }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>— 04 / Guest Letters</div>
          <h2 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em" }}>Words from <em style={{ color: theme.SEA }}>those</em> who<br />stayed with us.</h2>
        </div>
        <div className="grid-1-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, maxWidth: 1200, margin: "0 auto" }}>
          {testimonials.map((t, i) => (
            <div key={t.name} style={{ background: "#fff", padding: 48, border: `1px solid ${theme.SAND}`, position: "relative", marginTop: i % 2 ? 40 : 0 }}>
              <Quote size={32} color={theme.SEA} style={{ marginBottom: 20, opacity: 0.4 }} />
              <p className="serif" style={{ fontSize: 22, lineHeight: 1.5, fontStyle: "italic", marginBottom: 32, color: theme.INK, fontWeight: 400 }}>
                "{t.text}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 24, borderTop: `1px solid ${theme.SAND}` }}>
                <img src={t.img} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: theme.MUTED, marginTop: 2 }}>{t.role}</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                  {[...Array(5)].map((_,i) => <Star key={i} size={11} fill={theme.SEA} stroke={theme.SEA} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
