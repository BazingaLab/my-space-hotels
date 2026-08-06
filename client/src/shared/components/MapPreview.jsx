import { useEffect, useRef } from "react";
import { loadGoogleMapsScript } from "../../lib/googleMaps.js";
import { theme } from "../../lib/theme.js";

// interactive=true renders a full-size map with normal zoom/fullscreen/street-view
// controls, for the guest-facing "Where you'll be" section. interactive=false
// (default) keeps the original compact, mostly-static square preview used
// elsewhere, unchanged.
export default function MapPreview({ latitude, longitude, size = 280, interactive = false, height = 400 }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;
    let cancelled = false;
    loadGoogleMapsScript().then(ok => {
      if (cancelled || !ok || !mapRef.current) return;
      const pos = { lat: Number(latitude), lng: Number(longitude) };
      const map = new window.google.maps.Map(mapRef.current, {
        center: pos, zoom: interactive ? 14 : 15,
        streetViewControl: interactive, mapTypeControl: false, fullscreenControl: interactive,
        zoomControl: true,
        gestureHandling: interactive ? "auto" : "cooperative",
      });
      new window.google.maps.Marker({ position: pos, map });
    });
    return () => { cancelled = true; };
  }, [latitude, longitude, interactive]);

  if (!latitude || !longitude) return null;

  if (interactive) {
    return <div ref={mapRef} style={{ width: "100%", height, border: `1px solid ${theme.SAND}` }} />;
  }

  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: theme.SEA_DARK, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
        Location
      </div>
      <div ref={mapRef} style={{ width: "100%", maxWidth: size, aspectRatio: "1 / 1", border: `1px solid ${theme.SAND}` }} />
    </div>
  );
}