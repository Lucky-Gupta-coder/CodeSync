import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { workspaceApi } from "../modules/workspace/services/workspace.service.js";
import { roomApi } from "../modules/room/services/room.service.js";
import { RoomLanguage, RoomStatus, WorkspaceVisibility } from "@codesync/types";
import { RoomCreateSchema, WorkspaceCreateSchema } from "@codesync/validators";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../components/common/Button.js";
import { Card } from "../components/common/Card.js";
import { Badge } from "../components/common/Badge.js";
import { Input } from "../components/common/Input.js";
import { Modal } from "../components/common/Modal.js";
import { Dialog } from "../components/common/Dialog.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { Skeleton } from "../components/common/Skeleton.js";
import { useAuthStore } from "../modules/auth/store/auth.store.js";
import { useToastStore } from "../store/toast.store.js";

type CreateRoomInput = z.input<typeof RoomCreateSchema>;
type EditWorkspaceInput = z.input<typeof WorkspaceCreateSchema>;

export const WorkspaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);

  const [isOpenRoomModal, setIsOpenRoomModal] = useState(false);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
  const [isOpenArchiveDialog, setIsOpenArchiveDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Fetch workspace details
  const {
    data: workspace,
    isLoading: isLoadingWorkspace,
    error: workspaceError,
  } = useQuery({
    queryKey: ["workspace", id],
    queryFn: () => workspaceApi.getWorkspaceById(id || ""),
    retry: false,
    enabled: !!id,
  });

  // Fetch workspace rooms
  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["rooms", id],
    queryFn: () => roomApi.getWorkspaceRooms(id || ""),
    enabled: !!id && !!workspace,
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; language: RoomLanguage }) =>
      roomApi.createRoom(id || "", data),
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ["rooms", id] });
      setIsOpenRoomModal(false);
      resetRoomForm();
      addToast(`Coding room "${newRoom.name}" created successfully`, "success");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to create room";
      addToast(msg, "error");
    },
  });

  // Edit workspace mutation
  const editMutation = useMutation({
    mutationFn: (data: EditWorkspaceInput) =>
      workspaceApi.updateWorkspace(id || "", {
        name: data.name,
        description: data.description || "",
        visibility: data.visibility || WorkspaceVisibility.PRIVATE,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["workspaces-list"] });
      setIsOpenEditModal(false);
      addToast(`Workspace details updated successfully`, "success");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to update workspace";
      addToast(msg, "error");
    },
  });

  // Archive workspace mutation
  const archiveMutation = useMutation({
    mutationFn: () => {
      if (!workspace) return Promise.reject(new Error("Workspace not loaded"));
      return workspace.isArchived
        ? workspaceApi.restoreWorkspace(id || "")
        : workspaceApi.archiveWorkspace(id || "");
    },
    onSuccess: (updatedWs) => {
      queryClient.invalidateQueries({ queryKey: ["workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["workspaces-list"] });
      setIsOpenArchiveDialog(false);
      addToast(
        updatedWs.isArchived
          ? "Workspace archived and made read-only"
          : "Workspace restored successfully",
        "success"
      );
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Operation failed";
      addToast(msg, "error");
    },
  });

  // Delete workspace mutation
  const deleteMutation = useMutation({
    mutationFn: () => workspaceApi.deleteWorkspace(id || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces-list"] });
      addToast("Workspace deleted successfully", "success");
      navigate("/workspaces");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to delete workspace";
      addToast(msg, "error");
    },
  });

  const {
    register: registerRoom,
    handleSubmit: handleSubmitRoom,
    reset: resetRoomForm,
    formState: { errors: roomErrors },
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(RoomCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      language: RoomLanguage.JAVASCRIPT,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEditForm,
    formState: { errors: editErrors },
  } = useForm<EditWorkspaceInput>({
    resolver: zodResolver(WorkspaceCreateSchema),
  });

  // Populate edit form defaults
  useEffect(() => {
    if (workspace) {
      resetEditForm({
        name: workspace.name,
        description: workspace.description || "",
        visibility: workspace.visibility,
      });
    }
  }, [workspace, resetEditForm]);

  const onRoomSubmit = (fields: CreateRoomInput) => {
    createRoomMutation.mutate({
      name: fields.name,
      description: fields.description || "",
      language: fields.language || RoomLanguage.JAVASCRIPT,
    });
  };

  const onEditSubmit = (fields: EditWorkspaceInput) => {
    editMutation.mutate(fields);
  };

  if (!id) {
    return <div className="text-slate-400">Workspace ID is missing.</div>;
  }

  if (workspaceError) {
    const status = (workspaceError as { response?: { status?: number } }).response?.status;
    if (status === 403) {
      navigate("/unauthorized", { replace: true });
    } else {
      navigate("/404", { replace: true });
    }
    return null;
  }

  const isLoading = isLoadingWorkspace || isLoadingRooms;
  const isOwner = workspace && user && String(workspace.owner) === String(user.id);

  return (
    <div className="flex flex-col gap-6">
      {/* Header card details */}
      {isLoadingWorkspace ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : workspace ? (
        <Card className="border-slate-800">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-2xl font-black text-white tracking-tight">{workspace.name}</h2>
                <Badge
                  variant={
                    workspace.visibility === WorkspaceVisibility.PUBLIC ? "success" : "secondary"
                  }
                >
                  {workspace.visibility}
                </Badge>
                {workspace.isArchived && <Badge variant="warning">Archived</Badge>}
              </div>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                {workspace.description || "No description provided."}
              </p>
            </div>

            {/* Quick Actions (Restricted to OWNER) */}
            {isOwner && (
              <div className="flex items-center gap-3 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setIsOpenEditModal(true)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsOpenArchiveDialog(true)}>
                  {workspace.isArchived ? "Restore" : "Archive"}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setIsOpenDeleteDialog(true)}>
                  Delete
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : null}

      {/* Rooms header */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Coding Rooms</h3>
          <p className="text-xs text-slate-500">Live share channels in this workspace</p>
        </div>
        <Button
          size="sm"
          disabled={workspace?.isArchived || isLoading}
          onClick={() => setIsOpenRoomModal(true)}
        >
          New Room
        </Button>
      </div>

      {/* Rooms Grid list */}
      {isLoadingRooms ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : rooms && rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <Card
              key={room.id}
              title={room.name}
              description={room.description}
              onClick={() => navigate(`/rooms/${room.id}`)}
              footer={
                <div className="w-full flex items-center justify-between">
                  <Badge variant="primary" size="sm">
                    {room.language}
                  </Badge>
                  <Badge
                    variant={room.status === RoomStatus.ACTIVE ? "success" : "danger"}
                    size="sm"
                  >
                    {room.status}
                  </Badge>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No rooms created yet"
          description="Rooms represent direct coding sessions where multiple users join and write code side-by-side."
          action={
            <Button
              size="sm"
              disabled={workspace?.isArchived}
              onClick={() => setIsOpenRoomModal(true)}
            >
              Create Room
            </Button>
          }
          icon={
            <svg
              className="h-12 w-12 text-slate-655"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
      )}

      {/* New Room Modal */}
      <Modal
        isOpen={isOpenRoomModal}
        onClose={() => setIsOpenRoomModal(false)}
        title="Create Coding Room"
      >
        <form onSubmit={handleSubmitRoom(onRoomSubmit)} className="flex flex-col gap-4">
          <Input
            label="Room Name"
            placeholder="room-name"
            error={roomErrors.name?.message}
            {...registerRoom("name")}
          />
          <Input
            label="Description"
            placeholder="Description of the coding room"
            error={roomErrors.description?.message}
            {...registerRoom("description")}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Language
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all cursor-pointer"
              {...registerRoom("language")}
            >
              {Object.values(RoomLanguage).map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsOpenRoomModal(false)}
            >
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={createRoomMutation.isPending}>
              Create Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Workspace Modal */}
      <Modal
        isOpen={isOpenEditModal}
        onClose={() => setIsOpenEditModal(false)}
        title="Edit Workspace"
      >
        <form onSubmit={handleSubmitEdit(onEditSubmit)} className="flex flex-col gap-4">
          <Input
            label="Workspace Name"
            placeholder="e.g. project-x"
            error={editErrors.name?.message}
            {...registerEdit("name")}
          />
          <Input
            label="Description"
            placeholder="A description of this project workspace"
            error={editErrors.description?.message}
            {...registerEdit("description")}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Visibility
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              {...registerEdit("visibility")}
            >
              <option value={WorkspaceVisibility.PRIVATE}>Private (Invite Only)</option>
              <option value={WorkspaceVisibility.PUBLIC}>Public (Read-Only to Guests)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsOpenEditModal(false)}
            >
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={editMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Archive Dialogue */}
      <Dialog
        isOpen={isOpenArchiveDialog}
        onClose={() => setIsOpenArchiveDialog(false)}
        onConfirm={() => archiveMutation.mutate()}
        title={workspace?.isArchived ? "Restore Workspace?" : "Archive Workspace?"}
        message={
          workspace?.isArchived
            ? "Restoring this workspace allows team members to create new rooms and update details."
            : "Archiving this workspace makes all nested coding rooms read-only. Members will not be able to modify content."
        }
        confirmText={workspace?.isArchived ? "Restore" : "Archive"}
        loading={archiveMutation.isPending}
      />

      {/* Delete Workspace Modal with Typing Safety */}
      <Modal
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          setIsOpenDeleteDialog(false);
          setDeleteConfirmText("");
        }}
        title="Delete Workspace?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            This operation is permanent and will cascade-delete all coding rooms and memberships.
          </p>
          <p className="text-xs text-red-400 font-semibold bg-red-500/5 border border-red-500/10 p-3.5 rounded-lg leading-relaxed">
            Please type <span className="font-bold underline select-all">{workspace?.name}</span> to
            confirm.
          </p>
          <Input
            placeholder="Type workspace name here"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsOpenDeleteDialog(false);
                setDeleteConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteConfirmText !== workspace?.name}
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              Delete Workspace
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
