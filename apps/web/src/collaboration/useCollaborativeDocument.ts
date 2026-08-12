import { useEffect, useState } from "react";
import * as Y from "yjs";
import { Socket } from "socket.io-client";
import { yjsService } from "./yjs.service.js";

/**
 * Hook to manage the lifecycle of a collaborative document for a given room and file.
 * Returns the Y.Text instance associated with the file.
 */
export const useCollaborativeDocument = (socket: Socket | null, roomId: string, fileId: string) => {
  const [ytext, setYtext] = useState<Y.Text | null>(null);

  useEffect(() => {
    if (!socket || !roomId || !fileId) {
      setYtext(null);
      return;
    }

    // Attach socket listeners (service handles idempotent attachment)
    yjsService.attachSocket(socket);

    // Get the Yjs document for this specific file in the room
    const doc = yjsService.getDocument(roomId, fileId);
    const text = doc.getText(fileId);

    setYtext(text);

    // Request the latest state from other peers in the room
    yjsService.requestDocumentState(roomId, fileId);

    // Cleanup when file changes or component unmounts
    return () => {
      setYtext(null);
      // Clean up the document to prevent memory leaks and duplicate cursors across rooms
      yjsService.cleanupDocument(roomId, fileId);
    };
  }, [socket, roomId, fileId]);

  return ytext;
};
