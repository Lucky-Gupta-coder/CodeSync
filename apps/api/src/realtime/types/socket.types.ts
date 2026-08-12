import { Socket } from "socket.io";
import {
  SocketEvents,
  SocketUser,
  DocumentSyncRequest,
  DocumentSyncUpdate,
  DocumentState,
  SocketResponse,
  RoomPresence,
  CursorUpdate,
} from "@codesync/types";

export interface ServerToClientEvents {
  [SocketEvents.ERROR]: (err: { code: string; message: string; details?: any }) => void;
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
}

export interface InterServerEvents {
  [SocketEvents.PING]: () => void;
}

export interface SocketData {
  user: SocketUser;
}

export type CodeSyncSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
