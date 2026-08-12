import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { SocketEvents, ConnectionState, SocketResponse } from "@codesync/types";
import { useToastStore } from "../../store/toast.store.js";

/**
 * Manages the lifecycle of joining and leaving a Socket.IO room.
 * Automatically handles re-joining when the socket reconnects.
 */
export const useRoomConnection = (
  socket: Socket | null,
  status: ConnectionState,
  roomId: string | undefined
) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (!socket || !roomId) {
      setIsJoined(false);
      setIsJoining(false);
      return;
    }

    if (status !== ConnectionState.CONNECTED) {
      setIsJoined(false);
      return;
    }

    // Socket is connected and we have a roomId, so we should join
    let isMounted = true;
    setIsJoining(true);

    socket.emit(
      SocketEvents.JOIN_ROOM,
      { roomId },
      (response: SocketResponse<{ roomId: string }>) => {
        if (!isMounted) return;

        if (response.success) {
          setIsJoined(true);
        } else {
          addToast(response.error?.message || "Failed to join room", "error");
        }
        setIsJoining(false);
      }
    );

    // Listen for socket errors that might occur outside the callback
    const handleError = (error: { code: string; message: string }) => {
      if (isMounted) {
        addToast(`Socket Error: ${error.message}`, "error");
      }
    };

    socket.on(SocketEvents.ERROR, handleError);

    return () => {
      isMounted = false;
      socket.off(SocketEvents.ERROR, handleError);

      // Emit LEAVE_ROOM when unmounting or leaving this specific room
      if (status === ConnectionState.CONNECTED) {
        socket.emit(SocketEvents.LEAVE_ROOM, { roomId });
      }
    };
  }, [socket, status, roomId, addToast]);

  return { isJoined, isJoining };
};
