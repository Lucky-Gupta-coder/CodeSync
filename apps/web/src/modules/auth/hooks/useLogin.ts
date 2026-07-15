import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service.js";
import { useAuthStore } from "../store/auth.store.js";
import { LoginInput } from "../validation/login.schema.js";

export const useLogin = () => {
  const loginState = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const res = await authService.login(credentials);
      return res.data;
    },
    onSuccess: (data) => {
      loginState(data.accessToken, data.user);
    },
  });
};
