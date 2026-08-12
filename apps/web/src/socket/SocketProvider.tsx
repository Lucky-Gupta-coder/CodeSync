import React, { createContext, useEffect, useState } from "react";
import { socketService } from "./socket.service.js";
import { Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@codesync/api/src/realtime/types/socket.types.js";
import { useAuthStore } from "../modules/auth/store/auth.store.js";
import { SocketEvents, ConnectionState } from "@codesync/types";

interface SocketContextValue {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  status: ConnectionState;
}

export const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [socketInstance, setSocketInstance] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (status !== ConnectionState.DISCONNECTED) {
        socketService.disconnect();
        setSocketInstance(null);
        setStatus(ConnectionState.DISCONNECTED);
      }
      return;
    }

    setStatus(ConnectionState.CONNECTING);
    socketService.connect(token);
    const socket = socketService.getSocket();

    if (!socket) return;

    setSocketInstance(socket);

    const onConnect = () => setStatus(ConnectionState.CONNECTED);
    const onDisconnect = () => setStatus(ConnectionState.DISCONNECTED);
    const onConnectError = () => setStatus(ConnectionState.FAILED);
    const onAuthenticated = () => setStatus(ConnectionState.CONNECTED);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on(SocketEvents.AUTHENTICATED, onAuthenticated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off(SocketEvents.AUTHENTICATED, onAuthenticated);

      socketService.disconnect();
      setSocketInstance(null);
      setStatus(ConnectionState.DISCONNECTED);
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, status }}>
      {children}
    </SocketContext.Provider>
  );
};
