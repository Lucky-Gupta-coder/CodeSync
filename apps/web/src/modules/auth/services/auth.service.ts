import { apiClient } from "../../../api/client.js";
import { UserResponseDTO } from "@codesync/types";
import { LoginInput } from "../validation/login.schema.js";

export const authService = {
  async login(credentials: LoginInput): Promise<{
    success: boolean;
    message: string;
    data: { accessToken: string; user: UserResponseDTO };
  }> {
    const response = await apiClient.post("/api/auth/login", credentials);
    return response.data;
  },

  async getCurrentUser(): Promise<{ success: boolean; data: UserResponseDTO }> {
    const response = await apiClient.get("/api/auth/me");
    return response.data;
  },

  async logout(): Promise<void> {
    // No backend logout endpoint needed per requirements
    return Promise.resolve();
  },
};
