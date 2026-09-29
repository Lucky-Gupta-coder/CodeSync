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
  CHAT_SEND_MESSAGE = "chat:send_message",
  CHAT_GET_HISTORY = "chat:get_history",
  CHAT_MESSAGE = "chat:message",
  CHAT_HISTORY = "chat:history",
  CHAT_ERROR = "chat:error",
  WHITEBOARD_JOIN = "whiteboard:join",
  WHITEBOARD_LEAVE = "whiteboard:leave",
  WHITEBOARD_UPDATE = "whiteboard:update",
  WHITEBOARD_OBJECT_ADD = "whiteboard:object_add",
  WHITEBOARD_OBJECT_UPDATE = "whiteboard:object_update",
  WHITEBOARD_OBJECT_DELETE = "whiteboard:object_delete",
  WHITEBOARD_CLEAR = "whiteboard:clear",
  WHITEBOARD_SYNC_REQUEST = "whiteboard:sync_request",
  WHITEBOARD_SYNC_STATE = "whiteboard:sync_state",
  FILE_TREE_UPDATED = "file:tree_updated",
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

import { WhiteboardObject } from "./whiteboard.js";

export interface WhiteboardObjectPayload {
  roomId: string;
  object: WhiteboardObject;
}

export interface WhiteboardDeletePayload {
  roomId: string;
  objectId: string;
}

export interface WhiteboardClearPayload {
  roomId: string;
}

export interface WhiteboardSyncRequestPayload {
  roomId: string;
}

export interface WhiteboardSyncStatePayload {
  roomId: string;
  objects: WhiteboardObject[];
}

export interface ChatMessage {
  roomId: string;
  content: string;
}

export interface ChatMessageDTO {
  id: string;
  roomId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

export interface ChatHistoryRequest {
  roomId: string;
  limit?: number;
  before?: string; // Cursor for pagination (createdAt timestamp)
}

export interface ChatHistoryResponse {
  roomId: string;
  messages: ChatMessageDTO[];
  hasMore: boolean;
}

export interface ServerToClientEvents {
  [SocketEvents.ERROR]: (err: { code: string; message: string; details?: unknown }) => void;
  [SocketEvents.ROOM_JOINED]: (data: { roomId: string; members: SocketUser[] }) => void;
  [SocketEvents.ROOM_LEFT]: (data: { roomId: string; userId: string }) => void;
  [SocketEvents.AUTHENTICATED]: () => void;
  [SocketEvents.PONG]: () => void;
  [SocketEvents.DOCUMENT_UPDATE]: (data: DocumentSyncUpdate) => void;
  [SocketEvents.DOCUMENT_STATE_REQUEST]: (
    data: DocumentSyncRequest & { requesterId: string }
  ) => void;
  [SocketEvents.DOCUMENT_STATE_RESPONSE]: (data: DocumentState) => void;
  [SocketEvents.PRESENCE_UPDATE]: (data: RoomPresence) => void;
  [SocketEvents.CURSOR_UPDATE]: (data: CursorUpdate) => void;
  [SocketEvents.CHAT_MESSAGE]: (data: ChatMessageDTO) => void;
  [SocketEvents.CHAT_HISTORY]: (data: ChatHistoryResponse) => void;
  [SocketEvents.CHAT_ERROR]: (err: { code: string; message: string }) => void;
  [SocketEvents.WHITEBOARD_OBJECT_ADD]: (data: WhiteboardObjectPayload) => void;
  [SocketEvents.WHITEBOARD_OBJECT_UPDATE]: (data: WhiteboardObjectPayload) => void;
  [SocketEvents.WHITEBOARD_OBJECT_DELETE]: (data: WhiteboardDeletePayload) => void;
  [SocketEvents.WHITEBOARD_CLEAR]: (data: WhiteboardClearPayload) => void;
  [SocketEvents.WHITEBOARD_SYNC_STATE]: (data: WhiteboardSyncStatePayload) => void;
  [SocketEvents.FILE_TREE_UPDATED]: (data: { roomId: string }) => void;
}

export interface ClientToServerEvents {
  [SocketEvents.PING]: () => void;
  [SocketEvents.JOIN_ROOM]: (
    data: { roomId: string },
    callback?: (response: SocketResponse) => void
  ) => void;
  [SocketEvents.LEAVE_ROOM]: (
    data: { roomId: string },
    callback?: (response: SocketResponse) => void
  ) => void;
  [SocketEvents.DOCUMENT_UPDATE]: (data: DocumentSyncUpdate) => void;
  [SocketEvents.DOCUMENT_STATE_REQUEST]: (data: DocumentSyncRequest) => void;
  [SocketEvents.DOCUMENT_STATE_RESPONSE]: (
    data: DocumentState & { targetSocketId: string }
  ) => void;
  [SocketEvents.CURSOR_UPDATE]: (data: CursorUpdate) => void;
  [SocketEvents.CHAT_SEND_MESSAGE]: (
    data: { roomId: string; content: string },
    callback?: (response: SocketResponse<ChatMessageDTO>) => void
  ) => void;
  [SocketEvents.CHAT_GET_HISTORY]: (
    data: ChatHistoryRequest,
    callback?: (response: SocketResponse<ChatHistoryResponse>) => void
  ) => void;
  [SocketEvents.WHITEBOARD_OBJECT_ADD]: (data: WhiteboardObjectPayload) => void;
  [SocketEvents.WHITEBOARD_OBJECT_UPDATE]: (data: WhiteboardObjectPayload) => void;
  [SocketEvents.WHITEBOARD_OBJECT_DELETE]: (data: WhiteboardDeletePayload) => void;
  [SocketEvents.WHITEBOARD_CLEAR]: (data: WhiteboardClearPayload) => void;
  [SocketEvents.WHITEBOARD_SYNC_REQUEST]: (data: WhiteboardSyncRequestPayload) => void;
}

export interface InterServerEvents {
  [SocketEvents.PING]: () => void;
}

export interface SocketData {
  user: SocketUser;
}
