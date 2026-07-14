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

export enum UserRole {
  MEMBER = "member",
  ADMIN = "admin",
}

export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: UserResponseDTO;
}
