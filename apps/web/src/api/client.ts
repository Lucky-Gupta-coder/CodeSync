import axios from "axios";
import { APP_CONFIG } from "@codesync/config";
import { useAuthStore } from "../modules/auth/store/auth.store.js";

const API_URL = import.meta.env.VITE_API_URL || `http://localhost:${APP_CONFIG.defaultPort}`;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

// Automatically inject Bearer token on all outgoing requests if present
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
