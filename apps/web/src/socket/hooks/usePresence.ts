import { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import {
  PresenceUser,
  CursorUpdate,
  SocketEvents,
  RoomPresence,
  CursorPosition,
} from "@codesync/types";

export const usePresence = (socket: Socket | null, roomId: string | undefined) => {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorPosition | null>>({});

  const cursorTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!socket || !roomId) return;

    const handlePresenceUpdate = (data: RoomPresence) => {
      if (data.roomId === roomId) {
        setUsers(data.users);

        // Clean up cursors for users who are no longer in the room
        setCursors((prev) => {
          const newCursors = { ...prev };
          const activeUserIds = new Set(data.users.map((u) => u.userId));

          let changed = false;
          Object.keys(newCursors).forEach((userId) => {
            if (!activeUserIds.has(userId)) {
              delete newCursors[userId];
              changed = true;

              if (cursorTimeoutRefs.current[userId]) {
                clearTimeout(cursorTimeoutRefs.current[userId]);
                delete cursorTimeoutRefs.current[userId];
              }
            }
          });

          return changed ? newCursors : prev;
        });
      }
    };

    const handleCursorUpdate = (data: CursorUpdate) => {
      if (data.roomId === roomId) {
        setCursors((prev) => ({
          ...prev,
          [data.userId]: data.position,
        }));
      }
    };

    socket.on(SocketEvents.PRESENCE_UPDATE, handlePresenceUpdate);
    socket.on(SocketEvents.CURSOR_UPDATE, handleCursorUpdate);

    return () => {
      socket.off(SocketEvents.PRESENCE_UPDATE, handlePresenceUpdate);
      socket.off(SocketEvents.CURSOR_UPDATE, handleCursorUpdate);
    };
  }, [socket, roomId]);

  // Debounce the update cursor to avoid flooding the network
  const updateCursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const updateCursor = useCallback(
    (position: CursorPosition | null) => {
      if (!socket || !roomId) return;

      const now = Date.now();
      const throttleMs = 50;

      if (now - lastUpdateRef.current > throttleMs) {
        socket.emit(SocketEvents.CURSOR_UPDATE, { roomId, position });
        lastUpdateRef.current = now;
      } else {
        if (updateCursorTimeoutRef.current) {
          clearTimeout(updateCursorTimeoutRef.current);
        }
        updateCursorTimeoutRef.current = setTimeout(() => {
          socket.emit(SocketEvents.CURSOR_UPDATE, { roomId, position });
          lastUpdateRef.current = Date.now();
        }, throttleMs);
      }
    },
    [socket, roomId]
  );

  return {
    users,
    cursors,
    updateCursor,
  };
};
