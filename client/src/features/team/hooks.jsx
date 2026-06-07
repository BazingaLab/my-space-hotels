import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "../../lib/api.js";

export const teamKeys = { all: ["team"], list: (f) => ["team", "list", f], stats: () => ["team", "stats"] };

export function useTeam(filters = {}) {
  return useQuery({ queryKey: teamKeys.list(filters), queryFn: () => teamApi.list(filters) });
}
export function useTeamStats() {
  return useQuery({ queryKey: teamKeys.stats(), queryFn: () => teamApi.stats() });
}
export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => teamApi.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }) });
}
export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, patch }) => teamApi.update(id, patch), onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }) });
}
export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => teamApi.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }) });
}
