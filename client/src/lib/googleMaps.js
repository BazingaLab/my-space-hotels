// Loads the Maps JS API script once and caches the promise — same pattern
// as loadRazorpayScript in Booking.jsx.
let loadingPromise = null;

export function loadGoogleMapsScript() {
  if (window.google?.maps) return Promise.resolve(true);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) { console.error("VITE_GOOGLE_MAPS_API_KEY is not set"); resolve(false); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return loadingPromise;
}