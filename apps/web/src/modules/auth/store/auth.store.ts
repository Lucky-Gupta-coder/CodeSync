import { create } from "zustand";
import { AuthState } from "../types/index.js";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,

  login: (token, user) =>
    set({
      accessToken: token,
      user,
      isAuthenticated: true,
      loading: false,
    }),

  logout: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      loading: false,
    }),

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user || !!state.accessToken,
    })),

  setToken: (token) =>
    set((state) => ({
      accessToken: token,
      isAuthenticated: !!token || !!state.user,
    })),

  clear: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      loading: false,
    }),
}));
