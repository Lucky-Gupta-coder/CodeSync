import { useContext } from "react";
import { SocketContext } from "../SocketProvider.js";

export const useConnectionStatus = () => {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error("useConnectionStatus must be used within a SocketProvider");
  }

  return context.status;
};
