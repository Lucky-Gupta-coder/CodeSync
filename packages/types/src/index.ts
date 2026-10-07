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

export const UserRole = {
  MEMBER: "member",
  ADMIN: "admin",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

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

export const WorkspaceVisibility = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
} as const;
export type WorkspaceVisibility = (typeof WorkspaceVisibility)[keyof typeof WorkspaceVisibility];

export const RoomLanguage = {
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  JAVA: "java",
  CPP: "cpp",
  PYTHON: "python",
  C: "c",
  GO: "go",
  RUST: "rust",
} as const;
export type RoomLanguage = (typeof RoomLanguage)[keyof typeof RoomLanguage];

export const RoomStatus = {
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
  ARCHIVED: "ARCHIVED",
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const MembershipRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const;
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole];

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

export const FileType = {
  FILE: "FILE",
  FOLDER: "FOLDER",
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];

export interface FileNodeDTO {
  id: string;
  roomId: string;
  name: string;
  type: FileType;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
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

export { SocketEvents } from "./socket.js";
export * from "./socket.js";
export * from "./whiteboard.js";
