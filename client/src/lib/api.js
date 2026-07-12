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
  suggest: (q) => request(`/api/hotels/suggest?q=${encodeURIComponent(q)}`),
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
  resetOwnerPassword: (id) => request(`/api/admin/hotels/${id}/reset-owner-password`, { method: "POST" }),
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
  assign: (id, memberId) => request(`/api/complaints/${id}/assign`, { method: "POST", body: JSON.stringify({ assigned_team_member: memberId }) }),
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
  commissions: () => request("/api/wallets/commissions"),
  getHotelWallet: (hotelId) => request(`/api/wallets/hotel/${hotelId}`),
  settle: (data) => request("/api/wallets/settle", { method: "POST", body: JSON.stringify(data) }),
  eligibility: (hotelId) => request(`/api/wallets/eligibility/${hotelId}`),
};

export const bookingMgmtApi = {
  list: (filters = {}) => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v)).toString();
    return request(`/api/booking-mgmt${qs ? `?${qs}` : ""}`);
  },
  stats: () => request("/api/booking-mgmt/stats"),
  cancel: (id, data) => request(`/api/booking-mgmt/${id}/cancel`, { method: "POST", body: JSON.stringify(data) }),
  transfer: (id, new_hotel_id) => request(`/api/booking-mgmt/${id}/transfer`, { method: "POST", body: JSON.stringify({ new_hotel_id }) }),
  update: (id, patch) => request(`/api/booking-mgmt/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  checkIn: (id) => request(`/api/booking-mgmt/${id}/checkin`, { method: "POST" }),
  checkOut: (id) => request(`/api/booking-mgmt/${id}/checkout`, { method: "POST" }),
  markNoShow: (id) => request(`/api/booking-mgmt/${id}/no-show`, { method: "POST" }),
};

export const teamApi = {
  list: (filters = {}) => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v)).toString();
    return request(`/api/team${qs ? `?${qs}` : ""}`);
  },
  stats: () => request("/api/team/stats"),
  create: (data) => request("/api/team", { method: "POST", body: JSON.stringify(data) }),
  update: (id, patch) => request(`/api/team/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id) => request(`/api/team/${id}`, { method: "DELETE" }),
};

export const guestBookingApi = {
  detail: (id) => request(`/api/guest-bookings/${id}`),
  cancel: (id, user_id) => request(`/api/guest-bookings/${id}/cancel`, { method: "POST", body: JSON.stringify({ user_id }) }),
};

export const paymentsApi = {
  createOrder: (data) => request("/api/payments/create-order", { method: "POST", body: JSON.stringify(data) }),
  verify: (data) => request("/api/payments/verify", { method: "POST", body: JSON.stringify(data) }),
};

export const reviewApi = {
  create: (data) => request("/api/reviews", { method: "POST", body: JSON.stringify(data) }),
  byHotel: (hotelId) => request(`/api/reviews/hotel/${hotelId}`),
};