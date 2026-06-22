import { useState, useEffect } from "react";
import { theme } from "../../lib/theme.js";
import { MapPin, Loader } from "lucide-react";

// Reusable Indian address input with pincode auto-fill.
// Uses the free India Post API — no key needed.
// Props:
//   value: { building, street, landmark, pincode, post_office, city, district, state }
//   onChange: (updatedValue) => void
//   required: bool

export default function AddressInput({ value = {}, onChange, required = false }) {
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(null);

  const set = (k, v) => onChange({ ...value, [k]: v });

  const lookupPincode = async (pin) => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) return;
    setPinLoading(true); setPinError(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (!data?.[0] || data[0].Status !== "Success") {
        setPinError("Pincode not found. Please check and enter manually.");
        return;
      }
      const po = data[0].PostOffice?.[0];
      if (po) {
        onChange({
          ...value,
          pincode: pin,
          post_office: po.Name || "",
          city: po.Division || po.District || "",
          district: po.District || "",
          state: po.State || "",
        });
      }
    } catch (e) {
      setPinError("Could not fetch pincode details. Please fill manually.");
    } finally {
      setPinLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "12px 14px",
    border: `1px solid ${theme.SAND}`, background: "#fff",
    fontSize: 14, color: theme.INK, outline: "none",
    fontFamily: "Inter, sans-serif", boxSizing: "border-box",
  };
  const autoInp = { ...inp, background: "#F8FBF8", color: theme.SEA_DARK, fontWeight: 500 };
  const lbl = {
    fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK,
    textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600,
  };
  const autoLbl = { ...lbl, color: theme.SEA };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Building / Flat No */}
      <div>
        <label style={lbl}>Building / Flat No{required && " *"}</label>
        <input
          style={inp} required={required}
          placeholder="e.g. 12B, Sunrise Apartments"
          value={value.building || ""}
          onChange={e => set("building", e.target.value)}
        />
      </div>

      {/* Street / Area */}
      <div>
        <label style={lbl}>Street / Area{required && " *"}</label>
        <input
          style={inp} required={required}
          placeholder="e.g. MG Road, Koregaon Park"
          value={value.street || ""}
          onChange={e => set("street", e.target.value)}
        />
      </div>

      {/* Landmark */}
      <div>
        <label style={lbl}>Landmark</label>
        <input
          style={inp}
          placeholder="e.g. Near City Mall, Opposite HDFC Bank"
          value={value.landmark || ""}
          onChange={e => set("landmark", e.target.value)}
        />
      </div>

      {/* Pincode → triggers auto-fill */}
      <div>
        <label style={lbl}>Pincode{required && " *"}</label>
        <div style={{ position: "relative" }}>
          <input
            style={{ ...inp, paddingRight: 40 }}
            required={required}
            placeholder="6-digit pincode"
            maxLength={6}
            value={value.pincode || ""}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, "");
              set("pincode", v);
              if (v.length === 6) lookupPincode(v);
            }}
          />
          {pinLoading && (
            <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
              <Loader size={16} color={theme.SEA} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
        </div>
        {pinError && <div style={{ fontSize: 12, color: "#a33", marginTop: 4 }}>{pinError}</div>}
        {!pinError && value.pincode?.length === 6 && value.state && (
          <div style={{ fontSize: 12, color: theme.SEA_DARK, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={12} /> Auto-filled from pincode
          </div>
        )}
      </div>

      {/* Auto-filled fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={autoLbl}>City / Town {value.city ? "✓" : ""}</label>
          <input
            style={autoInp}
            placeholder="Auto-filled from pincode"
            value={value.city || ""}
            onChange={e => set("city", e.target.value)}
          />
        </div>
        <div>
          <label style={autoLbl}>District {value.district ? "✓" : ""}</label>
          <input
            style={autoInp}
            placeholder="Auto-filled from pincode"
            value={value.district || ""}
            onChange={e => set("district", e.target.value)}
          />
        </div>
        <div>
          <label style={autoLbl}>State {value.state ? "✓" : ""}</label>
          <input
            style={autoInp}
            placeholder="Auto-filled from pincode"
            value={value.state || ""}
            onChange={e => set("state", e.target.value)}
          />
        </div>
        <div>
          <label style={autoLbl}>Post Office</label>
          <input
            style={autoInp}
            placeholder="Auto-filled from pincode"
            value={value.post_office || ""}
            onChange={e => set("post_office", e.target.value)}
          />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}