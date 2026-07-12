import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Search, Building2 } from "lucide-react";
import { theme } from "../lib/theme.js";
import { api } from "../lib/api.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function SearchBar() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 Guests");

  const [suggestions, setSuggestions] = useState({ hotels: [], cities: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const inputBase = {
    width: "100%", background: "transparent", border: "none", outline: "none",
    fontSize: 14, color: theme.INK, paddingTop: 4,
  };
  const fieldLabel = {
    fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
    color: theme.SEA_DARK, fontWeight: 600, marginBottom: 2,
  };

  const handleCheckInChange = (value) => {
    setCheckIn(value);
    if (checkOut && checkOut <= value) setCheckOut("");
  };

  // Debounced autocomplete as the guest types the destination
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (city.trim().length < 2) {
      setSuggestions({ hotels: [], cities: [] });
      return;
    }
    debounceRef.current = setTimeout(() => {
      api.suggest(city.trim())
        .then(setSuggestions)
        .catch(() => setSuggestions({ hotels: [], cities: [] }));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [city]);

  // Close the dropdown on an outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildSearchParams = (cityName) => {
    const params = new URLSearchParams();
    if (cityName) params.set("city", cityName);
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    return params;
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    navigate(`/hotels?${buildSearchParams(city).toString()}`);
  };

  const pickHotel = (h) => {
    setShowSuggestions(false);
    setCity("");
    navigate(`/hotels/${h.id}`);
  };

  const pickCity = (c) => {
    setShowSuggestions(false);
    setCity(c.city);
    navigate(`/hotels?${buildSearchParams(c.city).toString()}`);
  };

  const hasSuggestions = suggestions.hotels.length > 0 || suggestions.cities.length > 0;

  return (
    <div className="grid-1-mobile" style={{
      background: "#fff", boxShadow: "0 20px 60px rgba(15, 74, 67, 0.08)",
      border: `1px solid ${theme.SAND}`, padding: 8,
      display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
      alignItems: "center", borderRadius: 2,
    }}>
      <div ref={wrapperRef} style={{ position: "relative", padding: "16px 24px", borderRight: `1px solid ${theme.SAND}` }}>
        <div style={fieldLabel}>Destination</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color={theme.SEA} />
          <input
            style={inputBase}
            placeholder="City, hotel, or pincode"
            value={city}
            onChange={e => { setCity(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
          />
        </div>

        {showSuggestions && hasSuggestions && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6,
            background: "#fff", border: `1px solid ${theme.SAND}`,
            boxShadow: "0 12px 32px rgba(15, 74, 67, 0.12)", zIndex: 50,
            maxHeight: 320, overflowY: "auto",
          }}>
            {suggestions.hotels.length > 0 && (
              <div>
                <div style={{ padding: "10px 16px 4px", fontSize: 10, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>Hotels</div>
                {suggestions.hotels.map(h => (
                  <button key={h.id} onClick={() => pickHotel(h)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                    padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13,
                  }}>
                    <Building2 size={14} color={theme.SEA} />
                    <span>{h.name}</span>
                    <span style={{ color: theme.MUTED, fontSize: 12 }}>— {h.city}</span>
                  </button>
                ))}
              </div>
            )}
            {suggestions.cities.length > 0 && (
              <div>
                <div style={{ padding: "10px 16px 4px", fontSize: 10, letterSpacing: "0.15em", color: theme.MUTED, textTransform: "uppercase" }}>Cities</div>
                {suggestions.cities.map(c => (
                  <button key={c.city} onClick={() => pickCity(c)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                    padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13,
                  }}>
                    <MapPin size={14} color={theme.SEA} />
                    <span>{c.city}</span>
                    <span style={{ color: theme.MUTED, fontSize: 12 }}>, {c.state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "16px 24px", borderRight: `1px solid ${theme.SAND}` }}>
        <div style={fieldLabel}>Check-in</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color={theme.SEA} />
          <input style={inputBase} type="date" min={todayStr()} value={checkIn} onChange={e => handleCheckInChange(e.target.value)} />
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderRight: `1px solid ${theme.SAND}` }}>
        <div style={fieldLabel}>Check-out</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color={theme.SEA} />
          <input style={inputBase} type="date" min={checkIn || todayStr()} value={checkOut} onChange={e => setCheckOut(e.target.value)} />
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