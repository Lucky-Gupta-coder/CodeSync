import { Request, Response, NextFunction } from "express";
import { roomService } from "./room.service.js";

export class RoomController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const ownerId = req.user!.id;
      const room = await roomService.createRoom(req.body, workspaceId, ownerId);

      res.status(201).json({
        success: true,
        message: "Room created successfully",
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkspaceRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const { search, language, status, owner, sortBy, page, limit } = req.query;

      const result = await roomService.getWorkspaceRooms(workspaceId, {
        search: search ? String(search) : undefined,
        language: language ? String(language) : undefined,
        status: status ? String(status) : undefined,
        owner: owner ? String(owner) : undefined,
        sortBy: sortBy ? String(sortBy) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.rooms,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const room = await roomService.getRoom(id);

      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const room = await roomService.updateRoom(id, req.body);

      res.status(200).json({
        success: true,
        message: "Room updated successfully",
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const room = await roomService.archiveRoom(id);

      res.status(200).json({
        success: true,
        message: "Room archived successfully",
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const room = await roomService.restoreRoom(id);

      res.status(200).json({
        success: true,
        message: "Room restored successfully",
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await roomService.deleteRoom(id);

      res.status(200).json({
        success: true,
        message: "Room deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const roomController = new RoomController();
