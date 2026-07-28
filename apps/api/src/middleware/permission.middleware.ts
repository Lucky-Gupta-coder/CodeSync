import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../shared/errors/forbidden-error.js";
import { NotFoundError } from "../shared/errors/not-found-error.js";
import { getWorkspacePermission } from "../modules/workspace/permission.helper.js";
import { MembershipRole } from "@codesync/types";
import { Room } from "../modules/room/room.model.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      workspace?: import("../modules/workspace/workspace.model.js").IWorkspace | null;
      workspaceRole?: MembershipRole | null;
      membership?: import("../modules/workspace/membership.model.js").IMembership | null;
    }
  }
}

// Role hierarchy level definitions to easily enforce minRole constraints
const roleHierarchy: Record<MembershipRole, number> = {
  [MembershipRole.OWNER]: 4,
  [MembershipRole.ADMIN]: 3,
  [MembershipRole.EDITOR]: 2,
  [MembershipRole.VIEWER]: 1,
};

export const requireWorkspacePermission = (minRole: MembershipRole) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return next(new ForbiddenError("Authentication required"));
      }

      let workspaceId = req.params.workspaceId;
      const isRoomRoute = req.baseUrl.includes("/rooms") || req.path.includes("/rooms/");

      if (isRoomRoute) {
        const roomId = req.params.id;
        if (roomId) {
          const room = await Room.findById(roomId);
          if (!room) {
            return next(new NotFoundError("Room not found"));
          }
          workspaceId = String(room.workspace);
        }
      } else {
        if (!workspaceId) {
          workspaceId = req.params.id;
        }
      }

      if (!workspaceId) {
        return next(new ForbiddenError("Workspace ID is required"));
      }

      const permission = await getWorkspacePermission(userId, workspaceId);
      if (!permission) {
        return next(new NotFoundError("Workspace not found"));
      }

      const { role, workspace, membership } = permission;

      if (!role || roleHierarchy[role] < roleHierarchy[minRole]) {
        return next(new ForbiddenError("Permission denied"));
      }

      // Attach workspace details to Request object for controller access
      req.workspace = workspace;
      req.workspaceRole = role;
      req.membership = membership;

      next();
    } catch (error) {
      next(error);
    }
  };
};
