import { Router } from "express";
import { workspaceController } from "./workspace.controller.js";
import { roomController } from "../room/room.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { requireWorkspacePermission } from "../../middleware/permission.middleware.js";
import {
  WorkspaceCreateSchema,
  WorkspaceUpdateSchema,
  RoomCreateSchema,
} from "@codesync/validators";
import { MembershipRole } from "@codesync/types";

const router = Router();

// Apply authentication to all workspace routes
router.use(authenticate);

router.post(
  "/",
  validateRequest(WorkspaceCreateSchema),
  workspaceController.create.bind(workspaceController)
);
router.get("/", workspaceController.getWorkspaces.bind(workspaceController));

router.get(
  "/:id",
  requireWorkspacePermission(MembershipRole.VIEWER),
  workspaceController.getById.bind(workspaceController)
);
router.patch(
  "/:id",
  requireWorkspacePermission(MembershipRole.OWNER),
  validateRequest(WorkspaceUpdateSchema),
  workspaceController.update.bind(workspaceController)
);
router.delete(
  "/:id",
  requireWorkspacePermission(MembershipRole.OWNER),
  workspaceController.delete.bind(workspaceController)
);

router.post(
  "/:id/archive",
  requireWorkspacePermission(MembershipRole.OWNER),
  workspaceController.archive.bind(workspaceController)
);
router.post(
  "/:id/restore",
  requireWorkspacePermission(MembershipRole.OWNER),
  workspaceController.restore.bind(workspaceController)
);

// Nested Room routes
router.post(
  "/:workspaceId/rooms",
  requireWorkspacePermission(MembershipRole.ADMIN),
  validateRequest(RoomCreateSchema),
  roomController.create.bind(roomController)
);
router.get(
  "/:workspaceId/rooms",
  requireWorkspacePermission(MembershipRole.VIEWER),
  roomController.getWorkspaceRooms.bind(roomController)
);

export default router;
