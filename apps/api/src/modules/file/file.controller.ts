import { Request, Response, NextFunction } from "express";
import { fileService } from "./file.service.js";
import { FileCreateSchema, FileUpdateSchema } from "@codesync/validators";
import { socketManager } from "../../realtime/server/socket.manager.js";
import { SocketEvents } from "@codesync/types";

export const getFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = req.params.id;
    const files = await fileService.getRoomFiles(roomId);

    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

export const createFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = req.params.id;
    const validatedData = FileCreateSchema.parse(req.body);

    const file = await fileService.createFile(roomId, validatedData);

    // Notify clients
    const io = socketManager.getIO();
    io.to(roomId).emit(SocketEvents.FILE_TREE_UPDATED, { roomId });

    res.status(201).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = req.params.id;
    const { fileId } = req.params;
    const validatedData = FileUpdateSchema.parse(req.body);

    const file = await fileService.updateFile(roomId, fileId, validatedData);

    // Notify clients
    const io = socketManager.getIO();
    io.to(roomId).emit(SocketEvents.FILE_TREE_UPDATED, { roomId });

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = req.params.id;
    const { fileId } = req.params;

    await fileService.deleteFile(roomId, fileId);

    // Notify clients
    const io = socketManager.getIO();
    io.to(roomId).emit(SocketEvents.FILE_TREE_UPDATED, { roomId });

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
