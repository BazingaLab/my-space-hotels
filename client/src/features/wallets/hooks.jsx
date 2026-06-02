import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletsApi } from "../../lib/api.js";

export const walletKeys = {
  all: ["wallets"],
  list: () => ["wallets", "list"],
  summary: () => ["wallets", "summary"],
  hotel: (id) => ["wallets", "hotel", id],
};

export function useWallets() {
  return useQuery({ queryKey: walletKeys.list(), queryFn: () => walletsApi.list() });
}
export function useWalletSummary() {
  return useQuery({ queryKey: walletKeys.summary(), queryFn: () => walletsApi.summary() });
}
export function useHotelWallet(hotelId) {
  return useQuery({ queryKey: walletKeys.hotel(hotelId), queryFn: () => walletsApi.getHotelWallet(hotelId), enabled: !!hotelId });
}
export function useSettle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => walletsApi.settle(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all }),
  });
}
