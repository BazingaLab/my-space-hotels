import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowRight, Quote, Building2, CheckCircle2, MapPin, Calendar, Shield } from "lucide-react";
import { theme } from "../lib/theme.js";
import { api } from "../lib/api.js";
import SearchBar from "../components/SearchBar.jsx";
import HotelCard from "../components/HotelCard.jsx";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getFeaturedHotels(), api.getPopularDestinations()])
      .then(([f, d]) => { setFeatured(f.hotels || []); setDestinations(d.destinations || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const testimonials = [
    { name: "Ananya Kapoor", role: "Architect, Mumbai", text: "My Space curated a stay so thoughtful, every detail felt designed for me. The kind of trip you remember in fragments — golden hour, the smell of jasmine, perfect quiet.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" },
    { name: "Rohan Mehta", role: "Filmmaker, Bengaluru", text: "Booking was seamless and the property exceeded every expectation. This isn't aggregation — it's curation. There's a difference, and you feel it instantly.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" },
  ];

  return (
    <main style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── HERO ── */}
      <section style={{ padding: "80px 6vw 60px", background: theme.CREAM }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 60, alignItems: "center", maxWidth: 1280, margin: "0 auto" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 1, background: theme.SEA }} />
              <span style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, textTransform: "uppercase" }}>India's Curated Hotel Collection</span>
            </div>
            <h1 className="serif" style={{ fontSize: "clamp(44px, 6vw, 88px)", lineHeight: 1.02, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 24, color: theme.INK }}>
              Stays with<br />
              <em style={{ color: theme.SEA }}>soul</em>, not<br />just a bed.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "#4A5856", maxWidth: 460, marginBottom: 36, fontWeight: 300 }}>
              Heritage havelis, beachfront hideaways, mountain retreats — hand-picked for character, not just comfort.
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <Link to="/hotels" style={{ padding: "16px 32px", background: theme.SEA, color: theme.CREAM, textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10 }}>
                Explore Hotels <ArrowRight size={14} />
              </Link>
              <Link to="/login" style={{ fontSize: 13, color: theme.INK, textDecoration: "none", letterSpacing: "0.05em", borderBottom: `1px solid ${theme.INK}`, paddingBottom: 2 }}>
                Sign in to book →
              </Link>
            </div>

            {/* Trust strip */}
            <div style={{ display: "flex", gap: 32, marginTop: 48, paddingTop: 32, borderTop: `1px solid ${theme.SAND}` }}>
              {[
                { icon: Star, label: "4.9 / 5 rating", sub: "from 12,400+ guests" },
                { icon: Shield, label: "Verified stays", sub: "every property reviewed" },
                { icon: Calendar, label: "Free cancellation", sub: "on most bookings" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Icon size={16} color={theme.SEA} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.INK }}>{label}</div>
                    <div style={{ fontSize: 11, color: theme.MUTED, marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image collage */}
          <div style={{ position: "relative", height: 540 }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "70%", height: "62%", overflow: "hidden" }}>
              <img src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&q=80" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "52%", height: "52%", overflow: "hidden", border: `8px solid ${theme.CREAM}` }}>
              <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=700&q=80" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="serif" style={{ position: "absolute", bottom: "22%", right: "-2%", fontSize: 13, fontStyle: "italic", color: theme.SEA_DARK, background: theme.CREAM, padding: "10px 18px", border: `1px solid ${theme.SEA}33` }}>
              ✦ 240+ properties across India
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: "48px auto 0" }}>
          <SearchBar />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 6vw", background: "#fff", borderTop: `1px solid ${theme.SAND}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 12, textTransform: "uppercase" }}>Simple & Fast</div>
            <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 400, color: theme.INK }}>Book a stay in 3 steps</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }}>
            {[
              { step: "01", icon: MapPin, title: "Find your stay", desc: "Search by city or browse our curated collection — filter by type, price, and amenities.", link: "/hotels", cta: "Browse hotels" },
              { step: "02", icon: Calendar, title: "Pick your dates", desc: "Choose check-in and check-out dates. Most properties offer free cancellation up to 24 hours before arrival.", link: "/hotels", cta: "Check availability" },
              { step: "03", icon: Shield, title: "Book securely", desc: "Sign in, confirm your details, and book instantly. Your booking is confirmed immediately.", link: "/signup", cta: "Create account" },
            ].map(s => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA, marginBottom: 16, textTransform: "uppercase" }}>{s.step}</div>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${theme.SEA}15`, display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                  <s.icon size={22} color={theme.SEA} />
                </div>
                <h3 className="serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 12, color: theme.INK }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: theme.MUTED, lineHeight: 1.7, marginBottom: 16 }}>{s.desc}</p>
                <Link to={s.link} style={{ fontSize: 13, color: theme.SEA_DARK, textDecoration: "none", borderBottom: `1px solid ${theme.SEA_DARK}`, paddingBottom: 2 }}>{s.cta} →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section style={{ padding: "100px 6vw", background: theme.CREAM }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>Popular Destinations</div>
              <h2 className="serif" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 400, lineHeight: 1, color: theme.INK }}>
                Cities <em style={{ color: theme.SEA }}>worth</em><br />wandering.
              </h2>
            </div>
            <Link to="/hotels" style={{ fontSize: 13, color: theme.INK, textDecoration: "none", letterSpacing: "0.1em", borderBottom: `1px solid ${theme.INK}`, paddingBottom: 2 }}>View all destinations →</Link>
          </div>
          {!loading && destinations.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
              {destinations.map((d, i) => (
                <Link key={d.name} to={`/hotels?city=${d.name}`} style={{ textDecoration: "none", color: theme.INK, display: "block", marginTop: i % 2 ? 32 : 0 }}>
                  <div style={{ width: "100%", height: 360, overflow: "hidden", position: "relative" }}>
                    <img src={d.image} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                      onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
                      onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 45%, ${theme.INK}cc 100%)` }} />
                    <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, color: theme.CREAM }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.25em", opacity: 0.75, textTransform: "uppercase", marginBottom: 6 }}>{d.state}</div>
                      <div className="serif" style={{ fontSize: 28, fontWeight: 400 }}>{d.name}</div>
                      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>{d.count} properties</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!loading && destinations.length === 0 && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Link to="/hotels" style={{ background: theme.SEA, color: theme.CREAM, padding: "16px 32px", textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10 }}>
                Browse All Hotels <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURED STAYS ── */}
      <section style={{ padding: "80px 6vw 100px", background: theme.SAND }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>Hand-Picked</div>
              <h2 className="serif" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 400, lineHeight: 1, color: theme.INK }}>
                This month's<br /><em style={{ color: theme.SEA }}>quiet favourites.</em>
              </h2>
            </div>
            <Link to="/hotels" style={{ fontSize: 13, color: theme.INK, textDecoration: "none", letterSpacing: "0.1em", borderBottom: `1px solid ${theme.INK}`, paddingBottom: 2 }}>Browse all stays →</Link>
          </div>
          {loading ? (
            <div style={{ color: theme.MUTED, textAlign: "center", padding: 40 }}>Loading stays…</div>
          ) : featured.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
              {featured.slice(0, 3).map(h => <HotelCard key={h.id} hotel={h} />)}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 60 }}>
              <p style={{ color: theme.MUTED, marginBottom: 24 }}>Explore our full collection of curated stays.</p>
              <Link to="/hotels" style={{ background: theme.SEA, color: theme.CREAM, padding: "16px 32px", textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10 }}>
                View All Hotels <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "100px 6vw", background: theme.CREAM }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA_DARK, marginBottom: 14, textTransform: "uppercase" }}>Guest Stories</div>
            <h2 className="serif" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 400, lineHeight: 1, color: theme.INK }}>
              Words from <em style={{ color: theme.SEA }}>those</em><br />who stayed with us.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            {testimonials.map((t, i) => (
              <div key={t.name} style={{ background: "#fff", padding: 40, border: `1px solid ${theme.SAND}`, marginTop: i % 2 ? 40 : 0 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 20 }}>
                  {[...Array(5)].map((_,j) => <Star key={j} size={14} fill={theme.SEA} stroke={theme.SEA} />)}
                </div>
                <Quote size={28} color={theme.SEA} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p className="serif" style={{ fontSize: 20, lineHeight: 1.6, fontStyle: "italic", marginBottom: 28, color: theme.INK, fontWeight: 400 }}>
                  "{t.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 20, borderTop: `1px solid ${theme.SAND}` }}>
                  <img src={t.img} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.INK }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: theme.MUTED, marginTop: 1 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER CTA ── */}
      <section style={{ padding: "100px 6vw", background: theme.INK, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -80, top: -80, width: 400, height: 400, border: "1px solid rgba(255,255,255,0.04)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: -60, bottom: -60, width: 300, height: 300, border: "1px solid rgba(255,255,255,0.04)", borderRadius: "50%" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", position: "relative" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", color: theme.SEA, marginBottom: 20, textTransform: "uppercase" }}>✦ Hotel Partners</div>
            <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 400, color: theme.CREAM, lineHeight: 1.1, marginBottom: 20 }}>
              Own a property?<br /><em style={{ color: theme.SEA }}>List it with us.</em>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, marginBottom: 36, maxWidth: 400 }}>
              Join our curated collection of independent hotels, resorts and BnBs across India. We handle the bookings — you focus on the experience.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
              {["Free to list — no setup cost", "Your own dashboard for bookings, photos & revenue", "Wallet settlements with UTR tracking", "24-hour review — go live fast"].map(b => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                  <CheckCircle2 size={15} color={theme.SEA} style={{ flexShrink: 0 }} /> {b}
                </div>
              ))}
            </div>
            <Link to="/hotel-portal/signup" style={{ background: theme.SEA, color: theme.CREAM, padding: "16px 32px", textDecoration: "none", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <Building2 size={15} /> Register as Partner
            </Link>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 14 }}>
              Already a partner?{" "}
              <Link to="/hotel-portal/login" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "underline" }}>Sign in →</Link>
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { number: "7+", label: "Partner Hotels", sub: "and growing" },
              { number: "₹0", label: "Setup Fee", sub: "free to list" },
              { number: "24h", label: "Review Time", sub: "fast onboarding" },
              { number: "100%", label: "Online", sub: "manage from anywhere" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: 24 }}>
                <div className="serif" style={{ fontSize: 34, color: theme.CREAM, fontWeight: 400, lineHeight: 1 }}>{s.number}</div>
                <div style={{ fontSize: 12, color: theme.SEA, marginTop: 8, fontWeight: 600, letterSpacing: "0.05em" }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}