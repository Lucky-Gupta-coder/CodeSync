import * as Y from "yjs";
import { Socket } from "socket.io-client";
import {
  SocketEvents,
  DocumentSyncUpdate,
  DocumentState,
  DocumentSyncRequest,
} from "@codesync/types";

/**
 * Manages Y.Doc instances for collaborative editing.
 * We want to ensure that for a given roomId and fileId, there is exactly one Y.Doc instance locally.
 */
class YjsService {
  private documents: Map<string, Y.Doc> = new Map();
  private socketListenersAttached = false;
  private socket: Socket | null = null;

  private getCompositeId(roomId: string, fileId: string): string {
    return `${roomId}:${fileId}`;
  }

  /**
   * Initialize socket listeners for document sync if they haven't been attached.
   */
  public attachSocket(socket: Socket) {
    if (this.socket === socket && this.socketListenersAttached) return;

    this.detachSocket();
    this.socket = socket;

    // Listen for incoming document updates
    this.socket.on(SocketEvents.DOCUMENT_UPDATE, this.handleDocumentUpdate);

    // Listen for requests from peers asking for the full state
    this.socket.on(SocketEvents.DOCUMENT_STATE_REQUEST, this.handleStateRequest);

    // Listen for the response containing the full state
    this.socket.on(SocketEvents.DOCUMENT_STATE_RESPONSE, this.handleStateResponse);

    this.socketListenersAttached = true;
  }

  public detachSocket() {
    if (!this.socket) return;
    this.socket.off(SocketEvents.DOCUMENT_UPDATE, this.handleDocumentUpdate);
    this.socket.off(SocketEvents.DOCUMENT_STATE_REQUEST, this.handleStateRequest);
    this.socket.off(SocketEvents.DOCUMENT_STATE_RESPONSE, this.handleStateResponse);
    this.socketListenersAttached = false;
    this.socket = null;
  }

  /**
   * Retrieves or creates a Y.Doc for the specified room and file.
   */
  public getDocument(roomId: string, fileId: string): Y.Doc {
    const id = this.getCompositeId(roomId, fileId);
    if (!this.documents.has(id)) {
      const doc = new Y.Doc();

      // When local document changes, broadcast it to others via Socket.IO
      doc.on("update", (update: Uint8Array, origin: any) => {
        // Only broadcast if the update originated locally (not from the socket relay)
        if (origin !== this && this.socket) {
          const payload: DocumentSyncUpdate = {
            roomId,
            fileId,
            update: update.buffer as ArrayBuffer, // send as ArrayBuffer
          };
          this.socket.emit(SocketEvents.DOCUMENT_UPDATE, payload);
        }
      });

      this.documents.set(id, doc);
    }
    return this.documents.get(id)!;
  }

  /**
   * Fetch the full state of the document from peers in the room.
   */
  public requestDocumentState(roomId: string, fileId: string) {
    if (!this.socket) return;
    const payload: DocumentSyncRequest = { roomId, fileId };
    this.socket.emit(SocketEvents.DOCUMENT_STATE_REQUEST, payload);
  }

  /**
   * Clean up a document when it's no longer needed (e.g. room unmounted).
   */
  public cleanupDocument(roomId: string, fileId: string) {
    const id = this.getCompositeId(roomId, fileId);
    const doc = this.documents.get(id);
    if (doc) {
      doc.destroy();
      this.documents.delete(id);
    }
  }

  public cleanupAll() {
    for (const doc of this.documents.values()) {
      doc.destroy();
    }
    this.documents.clear();
  }

  // --- Socket Handlers ---

  private handleDocumentUpdate = (data: DocumentSyncUpdate) => {
    const { roomId, fileId, update } = data;
    const doc = this.documents.get(this.getCompositeId(roomId, fileId));

    if (doc) {
      // Apply the update from remote. Use `this` as origin to prevent broadcasting it back.
      Y.applyUpdate(doc, new Uint8Array(update), this);
    }
  };

  private handleStateRequest = (data: DocumentSyncRequest & { requesterId: string }) => {
    const { roomId, fileId, requesterId } = data;
    const id = this.getCompositeId(roomId, fileId);
    const doc = this.documents.get(id);

    // If we have the document locally, we can send our state back
    if (doc && this.socket) {
      const state = Y.encodeStateAsUpdate(doc);

      // We could add logic to ensure only ONE peer responds, but since the payload is just a sync update,
      // it's harmless (though slightly inefficient) if multiple peers respond in this phase.
      const payload: DocumentState & { targetSocketId: string } = {
        roomId,
        fileId,
        state: state.buffer as ArrayBuffer,
        targetSocketId: requesterId,
      };

      this.socket.emit(SocketEvents.DOCUMENT_STATE_RESPONSE, payload);
    }
  };

  private handleStateResponse = (data: DocumentState) => {
    const { roomId, fileId, state } = data;
    const id = this.getCompositeId(roomId, fileId);
    const doc = this.documents.get(id);

    if (doc) {
      // Apply the full state update from peer
      Y.applyUpdate(doc, new Uint8Array(state), this);
    }
  };
}

export const yjsService = new YjsService();
