import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript } from "../../lib/googleMaps.js";
import { theme } from "../../lib/theme.js";
import { MapPin, LocateFixed } from "lucide-react";

const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 };

// latitude/longitude: current value (numbers or null). onChange(lat, lng).
// addressHint: a full address string to geocode when "Locate address" is clicked.
export default function LocationPicker({ latitude, longitude, onChange, addressHint }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markerObj = useRef(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript().then(ok => {
      if (cancelled || !ok || !mapRef.current) return;
      const start = latitude && longitude ? { lat: Number(latitude), lng: Number(longitude) } : INDIA_CENTER;

      mapObj.current = new window.google.maps.Map(mapRef.current, {
        center: start,
        zoom: latitude && longitude ? 15 : 5,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      markerObj.current = new window.google.maps.Marker({
        position: start,
        map: mapObj.current,
        draggable: true,
        visible: !!(latitude && longitude),
      });

      markerObj.current.addListener("dragend", () => {
        const pos = markerObj.current.getPosition();
        onChange(pos.lat(), pos.lng());
      });

      mapObj.current.addListener("click", (e) => {
        markerObj.current.setPosition(e.latLng);
        markerObj.current.setVisible(true);
        onChange(e.latLng.lat(), e.latLng.lng());
      });

      setReady(true);
    });
    return () => { cancelled = true; };
  }, []); // map is created once; position updates are handled via the marker directly

  const handleLocateAddress = async () => {
    if (!addressHint?.trim()) { setError("Fill in the address fields above first."); return; }
    setLocating(true); setError(null);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const { results } = await geocoder.geocode({ address: addressHint });
      if (!results?.[0]) { setError("Couldn't find that address — try dropping the pin manually."); return; }
      const loc = results[0].geometry.location;
      mapObj.current.setCenter(loc);
      mapObj.current.setZoom(16);
      markerObj.current.setPosition(loc);
      markerObj.current.setVisible(true);
      onChange(loc.lat(), loc.lng());
    } catch (e) {
      setError("Geocoding failed — try dropping the pin manually.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", fontWeight: 600 }}>
          Pin Hotel Location
        </span>
        <button type="button" onClick={handleLocateAddress} disabled={locating || !ready} style={{
          display: "inline-flex", alignItems: "center", gap: 6, background: "transparent",
          border: `1px solid ${theme.SAND}`, color: theme.SEA_DARK, padding: "6px 12px",
          fontSize: 11, letterSpacing: "0.05em", cursor: locating ? "not-allowed" : "pointer",
        }}>
          <LocateFixed size={12} /> {locating ? "Locating…" : "Locate typed address"}
        </button>
      </div>
      <div
        ref={mapRef}
        style={{ width: "100%", maxWidth: 320, aspectRatio: "1 / 1", border: `1px solid ${theme.SAND}`, background: theme.SAND }}
      />
      <div style={{ fontSize: 11, color: theme.MUTED, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <MapPin size={12} /> Click the map or drag the pin to set the exact spot. {latitude && longitude ? `(${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)})` : "No location set yet."}
      </div>
      {error && <div style={{ color: "#a33", fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}