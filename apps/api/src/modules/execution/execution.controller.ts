import { Request, Response } from "express";
import { ExecutionService } from "./execution.service.js";
import { logger } from "../../config/logger.js";
import { roomService } from "../room/room.service.js"; // to check if room exists / user has access

export const executeCodeHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language, roomId } = req.body;

    if (!code || !language || !roomId) {
      res.status(400).json({ message: "Code, language, and roomId are required." });
      return;
    }

    // Basic authorization: Verify the room exists (could also verify user is in the room if needed)
    const room = await roomService.getRoom(roomId);
    if (!room) {
      res.status(404).json({ message: "Room not found." });
      return;
    }

    const result = await ExecutionService.executeCode(code, language);

    res.status(200).json(result);
  } catch (error: any) {
    logger.error(`Execution error: ${error.message}`);
    res.status(500).json({
      message: error.message || "Failed to execute code.",
    });
  }
};
