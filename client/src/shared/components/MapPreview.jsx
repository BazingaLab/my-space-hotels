import { useEffect, useRef } from "react";
import { loadGoogleMapsScript } from "../../lib/googleMaps.js";
import { theme } from "../../lib/theme.js";

// Read-only pin display for the guest-facing hotel page. Renders nothing
// if the hotel has no saved coordinates yet (older hotels, or skipped by owner).
export default function MapPreview({ latitude, longitude, size = 280 }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;
    let cancelled = false;
    loadGoogleMapsScript().then(ok => {
      if (cancelled || !ok || !mapRef.current) return;
      const pos = { lat: Number(latitude), lng: Number(longitude) };
      const map = new window.google.maps.Map(mapRef.current, {
        center: pos, zoom: 15,
        streetViewControl: false, mapTypeControl: false, fullscreenControl: false,
        gestureHandling: "cooperative",
      });
      new window.google.maps.Marker({ position: pos, map });
    });
    return () => { cancelled = true; };
  }, [latitude, longitude]);

  if (!latitude || !longitude) return null;

  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
        Location
      </div>
      <div ref={mapRef} style={{ width: "100%", maxWidth: size, aspectRatio: "1 / 1", border: `1px solid ${theme.SAND}` }} />
    </div>
  );
}