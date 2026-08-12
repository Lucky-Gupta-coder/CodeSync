import { CodeSyncSocket } from "../types/socket.types.js";
import { jwtService } from "../../shared/auth/jwt.service.js";
import { socketLogger } from "../utils/socket.logger.js";
import { UserRole } from "@codesync/types";

export const socketAuthMiddleware = async (socket: CodeSyncSocket, next: (err?: Error) => void) => {
  const token =
    socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

  if (!token) {
    socketLogger.warn(`Connection rejected - No token provided (Socket ID: ${socket.id})`);
    return next(new Error("Authentication error: Token not provided"));
  }

  try {
    const decoded = await jwtService.verifyAccessToken(token);
    socket.data.user = {
      id: decoded.sub as string,
      name: "Unknown User", // Name is not stored in standard access token
      email: decoded.email as string,
      role: (decoded.role as UserRole) || UserRole.MEMBER,
    };
    next();
  } catch (error) {
    socketLogger.warn(`Connection rejected - Invalid token (Socket ID: ${socket.id})`, { error });
    return next(new Error("Authentication error: Invalid or expired token"));
  }
};
