// Admin API
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