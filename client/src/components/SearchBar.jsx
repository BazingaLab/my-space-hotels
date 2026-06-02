import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Search } from "lucide-react";
import { theme } from "../lib/theme.js";

export default function SearchBar() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 Guests");

  const inputBase = {
    width: "100%", background: "transparent", border: "none", outline: "none",
    fontSize: 14, color: theme.INK, paddingTop: 4,
  };
  const fieldLabel = {
    fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
    color: theme.SEA_DARK, fontWeight: 600, marginBottom: 2,
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div className="grid-1-mobile" style={{
      background: "#fff", boxShadow: "0 20px 60px rgba(15, 74, 67, 0.08)",
      border: `1px solid ${theme.SAND}`, padding: 8,
      display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
      alignItems: "center", borderRadius: 2,
    }}>
      <div style={{ padding: "16px 24px", borderRight: `1px solid ${theme.SAND}` }}>
        <div style={fieldLabel}>Destination</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color={theme.SEA} />
          <input style={inputBase} placeholder="Where to?" value={city} onChange={e => setCity(e.target.value)} />
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderRight: `1px solid ${theme.SAND}` }}>
        <div style={fieldLabel}>Check-in</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color={theme.SEA} />
          <input style={inputBase} type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderRight: `1px solid ${theme.SAND}` }}>
        <div style={fieldLabel}>Check-out</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color={theme.SEA} />
          <input style={inputBase} type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderRight: `1px solid ${theme.SAND}` }}>
        <div style={fieldLabel}>Guests</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={14} color={theme.SEA} />
          <select style={{ ...inputBase, cursor: "pointer" }} value={guests} onChange={e => setGuests(e.target.value)}>
            <option>1 Guest</option>
            <option>2 Guests</option>
            <option>3 Guests</option>
            <option>4+ Guests</option>
          </select>
        </div>
      </div>
      <button onClick={handleSearch} className="cta-btn" style={{
        background: theme.SEA, color: theme.CREAM, border: "none",
        padding: "22px 32px", display: "flex", alignItems: "center", gap: 10,
        fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase",
        fontWeight: 500, height: "100%",
      }}>
        <Search size={14} /> Search
      </button>
    </div>
  );
}
