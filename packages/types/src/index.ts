export interface HealthCheckResponse {
  status: "ok" | "error";
  timestamp: string;
  environment: string;
  services: {
    database: "connected" | "disconnected";
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}
