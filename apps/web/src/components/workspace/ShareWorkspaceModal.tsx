import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { workspaceApi } from "../../modules/workspace/services/workspace.service";
import { MembershipRole } from "@codesync/types";
import { Button } from "../common/Button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../modules/auth/store/auth.store";

interface ShareWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export const ShareWorkspaceModal: React.FC<ShareWorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(MembershipRole.VIEWER);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const { data: members = [] } = useQuery({
    queryKey: ["workspaceMembers", workspaceId],
    queryFn: () => workspaceApi.getWorkspaceMembers(workspaceId),
    enabled: isOpen && !!workspaceId,
  });

  const currentUserMember = members.find((m: any) => String(m.user.id) === String(currentUser?.id));
  const canManage = currentUserMember?.role === "OWNER" || currentUserMember?.role === "ADMIN";

  const mutation = useMutation({
    mutationFn: () => workspaceApi.addMember(workspaceId, email, role),
    onSuccess: () => {
      setSuccess(true);
      setError("");
      setTimeout(() => {
        setSuccess(false);
        setEmail("");
        queryClient.invalidateQueries({ queryKey: ["workspaceMembers", workspaceId] });
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to add member");
      setSuccess(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => workspaceApi.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers", workspaceId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to remove member");
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-container w-[400px] rounded-lg shadow-xl border border-surface-container-highest p-6 relative">
        <h2 className="text-body-lg font-semibold text-on-surface mb-4">Share Workspace</h2>

        {error && <div className="text-error text-body-sm mb-4">{error}</div>}
        {success && (
          <div className="text-success text-body-sm mb-4">Member added successfully!</div>
        )}

        <div className="mb-4">
          <label className="block text-label-sm text-outline mb-1">User Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm focus:outline-none focus:border-primary"
            placeholder="user@example.com"
          />
        </div>

        <div className="mb-6">
          <label className="block text-label-sm text-outline mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-surface text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm focus:outline-none focus:border-primary"
          >
            <option value={MembershipRole.VIEWER}>Viewer (Read Only)</option>
            <option value={MembershipRole.EDITOR}>Editor (Can Edit)</option>
            <option value={MembershipRole.ADMIN}>Admin (Can Manage)</option>
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !email || !canManage}
          >
            {mutation.isPending ? "Adding..." : "Add Member"}
          </Button>
        </div>

        <div className="mt-6 border-t border-surface-container-highest pt-4">
          <h3 className="text-body-sm font-semibold text-on-surface mb-3">Members</h3>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
            {members.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-surface-container-low p-2 rounded border border-outline-variant/30"
              >
                <div className="flex flex-col">
                  <span className="text-body-sm text-on-surface">{member.user.email}</span>
                  <span className="text-label-sm text-outline capitalize">
                    {member.role.toLowerCase()}
                  </span>
                </div>
                {canManage &&
                  member.role !== "OWNER" &&
                  String(member.user.id) !== String(currentUser?.id) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeMutation.mutate(member.user.id)}
                      disabled={removeMutation.isPending}
                    >
                      Remove
                    </Button>
                  )}
              </div>
            ))}
            {members.length === 0 && (
              <div className="text-label-sm text-outline italic">No members found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
