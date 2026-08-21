import { Router } from "express";
import { getFiles, createFile, updateFile, deleteFile } from "./file.controller.js";
import { requireWorkspacePermission } from "../../middleware/permission.middleware.js";
import { MembershipRole } from "@codesync/types";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { FileCreateSchema, FileUpdateSchema } from "@codesync/validators";

// mergeParams allows this router to access the :id parameter from the parent room router
const router = Router({ mergeParams: true });

router.get("/", requireWorkspacePermission(MembershipRole.VIEWER), getFiles);
router.post(
  "/",
  requireWorkspacePermission(MembershipRole.EDITOR),
  validateRequest(FileCreateSchema),
  createFile
);
router.put(
  "/:fileId",
  requireWorkspacePermission(MembershipRole.EDITOR),
  validateRequest(FileUpdateSchema),
  updateFile
);
router.delete("/:fileId", requireWorkspacePermission(MembershipRole.EDITOR), deleteFile);

export default router;
