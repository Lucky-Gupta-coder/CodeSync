import { create } from "zustand";
import { UserResponseDTO } from "@codesync/types";
import { apiClient } from "../../../api/client.js";

export interface AuthState {
  user: UserResponseDTO | null;
  token: string | null;
  accessToken: string | null; // Keep for backward compatibility with tests
  isAuthenticated: boolean;
  loading: boolean;
  login: (emailOrToken: string, passwordOrUser?: string | UserResponseDTO) => Promise<void> | void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  setUser: (user: UserResponseDTO | null) => void;
  setToken: (token: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  accessToken: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,

  login: async (emailOrToken, passwordOrUser) => {
    // Direct store setter call (e.g. from tests: login(token, user))
    if (typeof emailOrToken === "string" && passwordOrUser && typeof passwordOrUser !== "string") {
      const token = emailOrToken;
      const user = passwordOrUser;
      localStorage.setItem("token", token);
      set({
        token,
        accessToken: token,
        user,
        isAuthenticated: true,
        loading: false,
      });
      return;
    }

    // Credentials login call
    set({ loading: true });
    try {
      const response = await apiClient.post("/api/auth/login", {
        email: emailOrToken,
        password: passwordOrUser as string,
      });

      const { token, user, data } = response.data;
      const jwtToken = token || (data && (data.token || data.accessToken));
      const userObj = user || (data && data.user);

      if (jwtToken) {
        localStorage.setItem("token", jwtToken);
      }
      set({
        token: jwtToken,
        accessToken: jwtToken,
        user: userObj,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signup: async (name, email, password) => {
    set({ loading: true });
    try {
      await apiClient.post("/api/auth/signup", { name, email, password });
      set({ loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({
      token: null,
      accessToken: null,
      user: null,
      isAuthenticated: false,
      loading: false,
    });
  },

  fetchCurrentUser: async () => {
    const token = get().token || get().accessToken;
    if (!token) {
      set({ loading: false });
      return;
    }
    set({ loading: true });
    try {
      const response = await apiClient.get("/api/auth/me");
      const userObj = response.data.user || response.data.data || response.data;
      set({
        user: userObj,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      localStorage.removeItem("token");
      set({
        token: null,
        accessToken: null,
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      throw error;
    }
  },

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user || !!state.token,
    })),

  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set((state) => ({
      token,
      accessToken: token,
      isAuthenticated: !!token || !!state.user,
    }));
  },

  clear: () => {
    localStorage.removeItem("token");
    set({
      token: null,
      accessToken: null,
      user: null,
      isAuthenticated: false,
      loading: false,
    });
  },
}));
