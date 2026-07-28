import { Workspace, IWorkspace } from "./workspace.model.js";
import { Membership, IMembership } from "./membership.model.js";
import { MembershipRole, WorkspaceVisibility } from "@codesync/types";

export interface ResolvedPermission {
  workspace: IWorkspace;
  membership: IMembership | null;
  role: MembershipRole | null;
}

export const getWorkspacePermission = async (
  userId: string,
  workspaceId: string
): Promise<ResolvedPermission | null> => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return null;
  }

  // 1. Check if user is the workspace owner
  if (String(workspace.owner) === userId) {
    return {
      workspace,
      membership: null,
      role: MembershipRole.OWNER,
    };
  }

  // 2. Check for explicit membership
  const membership = await Membership.findOne({ workspace: workspaceId, user: userId });
  if (membership) {
    return {
      workspace,
      membership,
      role: membership.role,
    };
  }

  // 3. Fallback for public visibility
  if (workspace.visibility === WorkspaceVisibility.PUBLIC) {
    return {
      workspace,
      membership: null,
      role: MembershipRole.VIEWER,
    };
  }

  // Private workspace with no membership -> no role / no access
  return {
    workspace,
    membership: null,
    role: null,
  };
};
