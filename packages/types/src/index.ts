export interface HealthCheckResponse {
  status: "ok" | "error";
  timestamp: string;
  environment: string;
  services: {
    database: "connected" | "disconnected";
  };
  database: {
    connected: boolean;
    databaseName: string;
    host: string;
    readyState: number;
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
  avatar?: string;
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

export enum WorkspaceVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export enum RoomLanguage {
  JAVASCRIPT = "javascript",
  TYPESCRIPT = "typescript",
  JAVA = "java",
  CPP = "cpp",
  PYTHON = "python",
  C = "c",
  GO = "go",
  RUST = "rust",
}

export enum RoomStatus {
  ACTIVE = "ACTIVE",
  LOCKED = "LOCKED",
  ARCHIVED = "ARCHIVED",
}

export enum MembershipRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  VIEWER = "VIEWER",
}

export interface WorkspaceDTO {
  id: string;
  name: string;
  description: string;
  owner: string;
  visibility: WorkspaceVisibility;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomDTO {
  id: string;
  workspace: string;
  name: string;
  description: string;
  owner: string;
  language: RoomLanguage;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipDTO {
  workspace: string;
  user: UserResponseDTO;
  role: MembershipRole;
  joinedAt: string;
}

export interface WorkspaceListResponse {
  success: boolean;
  data: WorkspaceDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface RoomListResponse {
  success: boolean;
  data: RoomDTO[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
