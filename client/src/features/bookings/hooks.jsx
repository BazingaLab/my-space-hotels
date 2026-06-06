import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingMgmtApi } from "../../lib/api.js";

export const bookingKeys = { all: ["booking-mgmt"], list: (f) => ["booking-mgmt", "list", f], stats: () => ["booking-mgmt", "stats"] };

export function useManagedBookings(filters = {}) {
  return useQuery({ queryKey: bookingKeys.list(filters), queryFn: () => bookingMgmtApi.list(filters) });
}
export function useBookingStats() {
  return useQuery({ queryKey: bookingKeys.stats(), queryFn: () => bookingMgmtApi.stats() });
}
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }) => bookingMgmtApi.cancel(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: bookingKeys.all }) });
}
export function useTransferBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, new_hotel_id }) => bookingMgmtApi.transfer(id, new_hotel_id), onSuccess: () => qc.invalidateQueries({ queryKey: bookingKeys.all }) });
}
export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, patch }) => bookingMgmtApi.update(id, patch), onSuccess: () => qc.invalidateQueries({ queryKey: bookingKeys.all }) });
}
