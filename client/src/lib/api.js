const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getHotels: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/hotels${qs ? `?${qs}` : ""}`);
  },
  getHotelById: (id) => request(`/api/hotels/${id}`),
  getFeaturedHotels: () => request("/api/hotels/featured/list"),
  getPopularDestinations: () => request("/api/hotels/destinations/popular"),
  createBooking: (data) => request("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
  getBookings: (email) => request(`/api/bookings/${email}`),
};
