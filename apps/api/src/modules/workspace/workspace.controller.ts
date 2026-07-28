import { Request, Response, NextFunction } from "express";
import { workspaceService } from "./workspace.service.js";

export class WorkspaceController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const workspace = await workspaceService.createWorkspace(req.body, ownerId);

      res.status(201).json({
        success: true,
        message: "Workspace created successfully",
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      let result;
      if (search) {
        result = await workspaceService.searchWorkspaces(userId, search, page, limit);
      } else {
        result = await workspaceService.getUserWorkspaces(userId, page, limit);
      }

      res.status(200).json({
        success: true,
        data: result.workspaces,
        pagination: {
          total: result.total,
          page,
          limit,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const workspace = await workspaceService.getWorkspaceById(id);

      res.status(200).json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const workspace = await workspaceService.updateWorkspace(id, req.body);

      res.status(200).json({
        success: true,
        message: "Workspace updated successfully",
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const workspace = await workspaceService.archiveWorkspace(id);

      res.status(200).json({
        success: true,
        message: "Workspace archived successfully",
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const workspace = await workspaceService.restoreWorkspace(id);

      res.status(200).json({
        success: true,
        message: "Workspace restored successfully",
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await workspaceService.deleteWorkspace(id);

      res.status(200).json({
        success: true,
        message: "Workspace deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const workspaceController = new WorkspaceController();
