import axios from "axios";
import { APP_CONFIG } from "@codesync/config";

const API_URL = import.meta.env.VITE_API_URL || `http://localhost:${APP_CONFIG.defaultPort}`;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
});
