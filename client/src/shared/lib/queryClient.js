import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 60000, gcTime: 300000, retry: 1 },
    mutations: { retry: 0 },
  },
});
