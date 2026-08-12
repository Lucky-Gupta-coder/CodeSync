export enum SocketEvents {
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  CONNECT_ERROR = "connect_error",
  AUTHENTICATED = "authenticated",
  ERROR = "error",
  PING = "ping",
  PONG = "pong",
  JOIN_ROOM = "room:join",
  LEAVE_ROOM = "room:leave",
  ROOM_JOINED = "room:joined",
  ROOM_LEFT = "room:left",
  DOCUMENT_UPDATE = "document:update",
  DOCUMENT_STATE_REQUEST = "document:state_request",
  DOCUMENT_STATE_RESPONSE = "document:state_response",
  PRESENCE_JOINED = "presence:joined",
  PRESENCE_LEFT = "presence:left",
  PRESENCE_UPDATE = "presence:update",
  CURSOR_UPDATE = "cursor:update",
}

export enum ConnectionState {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  DISCONNECTED = "disconnected",
  FAILED = "failed",
}

export interface SocketUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SocketError {
  code: string;
  message: string;
  details?: any;
}

export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: SocketError;
}

export interface PresenceUser {
  userId: string;
  name: string;
  email: string;
  color: string;
  joinedAt: string;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
  selectionStartLineNumber: number;
  selectionStartColumn: number;
  selectionEndLineNumber: number;
  selectionEndColumn: number;
}

export interface CursorUpdate {
  roomId: string;
  userId: string;
  position: CursorPosition | null;
}

export interface RoomPresence {
  roomId: string;
  users: PresenceUser[];
}

export interface RoomConnection {
  // Placeholder for future collaboration features
  roomId: string;
}

export interface DocumentSyncRequest {
  roomId: string;
  fileId: string; // The specific file within the room (e.g., 'index.js')
}

export interface DocumentSyncUpdate {
  roomId: string;
  fileId: string;
  update: ArrayBuffer; // Binary Yjs update
}

export interface DocumentState {
  roomId: string;
  fileId: string;
  state: ArrayBuffer; // Full Yjs document state vector
}
