import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintsApi } from "../../lib/api.js";

export const complaintKeys = {
  all: ["complaints"],
  list: (f) => ["complaints", "list", f],
};

export function useComplaints(filters = {}) {
  return useQuery({ queryKey: complaintKeys.list(filters), queryFn: () => complaintsApi.list(filters) });
}
export function useResolveComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }) => complaintsApi.resolve(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  });
}
export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => complaintsApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  });
}
