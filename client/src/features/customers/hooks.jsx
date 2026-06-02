import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "../../lib/api.js";

export const customerKeys = {
  all: ["customers"],
  list: (f) => ["customers", "list", f],
  detail: (id) => ["customers", "detail", id],
  stats: () => ["customers", "stats"],
};

export function useCustomers(filters = {}) {
  return useQuery({ queryKey: customerKeys.list(filters), queryFn: () => customersApi.list(filters) });
}
export function useCustomer(id) {
  return useQuery({ queryKey: customerKeys.detail(id), queryFn: () => customersApi.get(id), enabled: !!id });
}
export function useCustomerStats() {
  return useQuery({ queryKey: customerKeys.stats(), queryFn: () => customersApi.stats() });
}
export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => customersApi.update(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: customerKeys.detail(id) });
      qc.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
