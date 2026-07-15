import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { authService } from "../services/auth.service.js";
import { useAuthStore } from "../store/auth.store.js";

export const useCurrentUser = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const query = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await authService.getCurrentUser();
      return res.data;
    },
    enabled: !!accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data, error } = query;

  // Sync successfully loaded user context with auth store
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  // If query returns failure (expired/invalid token), logout immediately
  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error, logout]);

  return query;
};
