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
  getBookingsByUser: (userId) => request(`/api/bookings/user/${userId}`),
};

export const adminApi = {
  getRole: (userId) => request(`/api/admin/role/${userId}`),
  getUsers: () => request("/api/admin/users"),
  promoteUser: (data) => request("/api/admin/promote", { method: "POST", body: JSON.stringify(data) }),
  getHotels: () => request("/api/admin/hotels"),
  createHotel: (data) => request("/api/admin/hotels", { method: "POST", body: JSON.stringify(data) }),
  updateHotel: (id, data) => request(`/api/admin/hotels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteHotel: (id) => request(`/api/admin/hotels/${id}`, { method: "DELETE" }),
  getBookings: () => request("/api/admin/bookings"),
  getOwnerBookings: (ownerId) => request(`/api/admin/bookings/owner/${ownerId}`),
  getAnalytics: () => request("/api/admin/analytics"),
};

export const pendingApi = {
  submit: (data) => request("/api/pending", { method: "POST", body: JSON.stringify(data) }),
  getAll: (status) => request(`/api/pending${status ? `?status=${status}` : ""}`),
  getMine: (ownerId) => request(`/api/pending/mine/${ownerId}`),
  approve: (id) => request(`/api/pending/${id}/approve`, { method: "POST" }),
  reject: (id, reason) => request(`/api/pending/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
};

export const complaintsApi = {
  list: (filters = {}) => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v)).toString();
    return request(`/api/complaints${qs ? `?${qs}` : ""}`);
  },
  get: (id) => request(`/api/complaints/${id}`),
  create: (data) => request("/api/complaints", { method: "POST", body: JSON.stringify(data) }),
  update: (id, patch) => request(`/api/complaints/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  resolve: (id, notes) => request(`/api/complaints/${id}/resolve`, { method: "POST", body: JSON.stringify({ resolution_notes: notes }) }),
};

export const customersApi = {
  list: (filters = {}) => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v)).toString();
    return request(`/api/customers${qs ? `?${qs}` : ""}`);
  },
  get: (id) => request(`/api/customers/${id}`),
  update: (id, patch) => request(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  stats: () => request("/api/customers/stats/summary"),
};

export const walletsApi = {
  list: () => request("/api/wallets"),
  summary: () => request("/api/wallets/summary"),
  getHotelWallet: (hotelId) => request(`/api/wallets/hotel/${hotelId}`),
  settle: (data) => request("/api/wallets/settle", { method: "POST", body: JSON.stringify(data) }),
};
