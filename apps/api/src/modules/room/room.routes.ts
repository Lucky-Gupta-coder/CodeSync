import { Router } from "express";
import { roomController } from "./room.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireWorkspacePermission } from "../../middleware/permission.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { RoomUpdateSchema } from "@codesync/validators";
import { MembershipRole } from "@codesync/types";

import fileRoutes from "../file/file.route.js";

const router = Router();

router.use(authenticate);

// Mount file routes (nested)
router.use("/:id/files", fileRoutes);

// Direct room routes: /api/rooms/:id
router.get(
  "/:id",
  requireWorkspacePermission(MembershipRole.VIEWER),
  roomController.getById.bind(roomController)
);
router.patch(
  "/:id",
  requireWorkspacePermission(MembershipRole.ADMIN),
  validateRequest(RoomUpdateSchema),
  roomController.update.bind(roomController)
);
router.delete(
  "/:id",
  requireWorkspacePermission(MembershipRole.ADMIN),
  roomController.delete.bind(roomController)
);

router.post(
  "/:id/archive",
  requireWorkspacePermission(MembershipRole.ADMIN),
  roomController.archive.bind(roomController)
);
router.post(
  "/:id/restore",
  requireWorkspacePermission(MembershipRole.ADMIN),
  roomController.restore.bind(roomController)
);

export default router;
