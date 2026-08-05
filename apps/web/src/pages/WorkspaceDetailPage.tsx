import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { workspaceApi } from "../modules/workspace/services/workspace.service.js";
import { roomApi } from "../modules/room/services/room.service.js";
import { RoomLanguage, RoomStatus, WorkspaceVisibility, RoomDTO } from "@codesync/types";
import { RoomCreateSchema, WorkspaceCreateSchema, RoomUpdateInput } from "@codesync/validators";
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
import { Pagination } from "../components/common/Pagination.js";
import { Breadcrumbs } from "../components/common/Breadcrumbs.js";
import { RoomCard } from "../components/room/RoomCard.js";
import { RoomListHeader } from "../components/room/RoomListHeader.js";
import { EditRoomModal } from "../components/room/EditRoomModal.js";
import { DeleteRoomModal } from "../components/room/DeleteRoomModal.js";
import { useAuthStore } from "../modules/auth/store/auth.store.js";
import { useToastStore } from "../store/toast.store.js";
import { useRoomStore } from "../store/room.store.js";

type CreateRoomInput = z.input<typeof RoomCreateSchema>;
type EditWorkspaceInput = z.input<typeof WorkspaceCreateSchema>;

export const WorkspaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const viewMode = useRoomStore((state) => state.viewMode);
  const setViewMode = useRoomStore((state) => state.setViewMode);

  // Sync state with URL search params
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "newest";
  const statusFilter = searchParams.get("status") || "ALL";
  const languageFilter = searchParams.get("language") || "ALL";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Modal States
  const [isOpenRoomModal, setIsOpenRoomModal] = useState(false);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
  const [isOpenArchiveDialog, setIsOpenArchiveDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Room Specific Modals
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<RoomDTO | null>(null);
  const [selectedRoomForArchive, setSelectedRoomForArchive] = useState<RoomDTO | null>(null);
  const [selectedRoomForDelete, setSelectedRoomForDelete] = useState<RoomDTO | null>(null);

  const updateUrlParams = (newParams: Record<string, string | number>) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, val]) => {
        if (val === "" || val === "ALL" || (key === "page" && val === 1)) {
          updated.delete(key);
        } else {
          updated.set(key, String(val));
        }
      });
      return updated;
    });
  };

  // Fetch workspace details
  const {
    data: workspace,
    isLoading: isLoadingWorkspace,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useQuery({
    queryKey: ["workspace", id],
    queryFn: () => workspaceApi.getWorkspaceById(id || ""),
    retry: false,
    enabled: !!id,
  });

  // Query options
  const queryOptions = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      language: languageFilter !== "ALL" ? languageFilter : undefined,
      sortBy,
      page,
      limit: 6,
    }),
    [search, statusFilter, languageFilter, sortBy, page]
  );

  // Fetch rooms with pagination & filters
  const {
    data: roomsResponse,
    isLoading: isLoadingRooms,
    error: roomsError,
    refetch: refetchRooms,
  } = useQuery({
    queryKey: ["rooms", id, queryOptions],
    queryFn: () => roomApi.getWorkspaceRooms(id || "", queryOptions),
    enabled: !!id && !!workspace,
  });

  const rooms = Array.isArray(roomsResponse) ? roomsResponse : roomsResponse?.data || [];
  const pagination = (!Array.isArray(roomsResponse) && roomsResponse?.pagination) || {
    total: rooms.length,
    page: 1,
    limit: 6,
    pages: 1,
  };

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

  // Edit room mutation
  const editRoomMutation = useMutation({
    mutationFn: (data: RoomUpdateInput) => {
      if (!selectedRoomForEdit) return Promise.reject(new Error("No room selected"));
      return roomApi.updateRoom(selectedRoomForEdit.id, data);
    },
    onSuccess: (updatedRoom) => {
      queryClient.invalidateQueries({ queryKey: ["rooms", id] });
      setSelectedRoomForEdit(null);
      addToast(`Room "${updatedRoom.name}" updated successfully`, "success");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to update room";
      addToast(msg, "error");
    },
  });

  // Archive / Restore room mutation
  const archiveRoomMutation = useMutation({
    mutationFn: (targetRoom: RoomDTO) => {
      return targetRoom.status === RoomStatus.ARCHIVED
        ? roomApi.restoreRoom(targetRoom.id)
        : roomApi.archiveRoom(targetRoom.id);
    },
    onSuccess: (updatedRoom) => {
      queryClient.invalidateQueries({ queryKey: ["rooms", id] });
      setSelectedRoomForArchive(null);
      addToast(
        updatedRoom.status === RoomStatus.ARCHIVED
          ? `Room "${updatedRoom.name}" archived`
          : `Room "${updatedRoom.name}" restored successfully`,
        "success"
      );
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to modify room status";
      addToast(msg, "error");
    },
  });

  // Delete room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: () => {
      if (!selectedRoomForDelete) return Promise.reject(new Error("No room selected"));
      return roomApi.deleteRoom(selectedRoomForDelete.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", id] });
      setSelectedRoomForDelete(null);
      addToast("Room deleted successfully", "success");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to delete room";
      addToast(msg, "error");
    },
  });

  // Edit workspace mutation
  const editWorkspaceMutation = useMutation({
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
  const archiveWorkspaceMutation = useMutation({
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
  const deleteWorkspaceMutation = useMutation({
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
    register: registerEditWs,
    handleSubmit: handleSubmitEditWs,
    reset: resetEditWsForm,
    formState: { errors: editWsErrors },
  } = useForm<EditWorkspaceInput>({
    resolver: zodResolver(WorkspaceCreateSchema),
  });

  useEffect(() => {
    if (workspace) {
      resetEditWsForm({
        name: workspace.name,
        description: workspace.description || "",
        visibility: workspace.visibility,
      });
    }
  }, [workspace, resetEditWsForm]);

  const onRoomSubmit = (fields: CreateRoomInput) => {
    createRoomMutation.mutate({
      name: fields.name.trim(),
      description: fields.description ? fields.description.trim() : "",
      language: fields.language || RoomLanguage.JAVASCRIPT,
    });
  };

  const onEditWsSubmit = (fields: EditWorkspaceInput) => {
    editWorkspaceMutation.mutate(fields);
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

  const isOwner = !!(workspace && user && String(workspace.owner) === String(user.id));
  const isCreateDisabled = !!(workspace?.isArchived || isLoadingWorkspace);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workspaces", href: "/workspaces" },
          { label: workspace?.name || "Workspace" },
        ]}
      />

      {/* Header card details */}
      {isLoadingWorkspace ? (
        <Skeleton className="h-36 w-full rounded-2xl" />
      ) : workspace ? (
        <Card className="border-slate-850 bg-slate-900/40">
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
      </div>

      {/* Room Toolbar (Search, Filter, Sort, View Toggle, Create) */}
      <RoomListHeader
        search={search}
        onSearchChange={(val) => updateUrlParams({ search: val, page: 1 })}
        sortBy={sortBy}
        onSortByChange={(val) => updateUrlParams({ sortBy: val, page: 1 })}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => updateUrlParams({ status: val, page: 1 })}
        languageFilter={languageFilter}
        onLanguageFilterChange={(val) => updateUrlParams({ language: val, page: 1 })}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewRoomClick={() => setIsOpenRoomModal(true)}
        isCreateDisabled={isCreateDisabled}
      />

      {/* Rooms Grid/List representation */}
      {roomsError ? (
        <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl text-center flex flex-col items-center gap-3">
          <svg
            className="w-10 h-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h4 className="text-base font-bold text-white">Failed to load rooms</h4>
          <p className="text-xs text-slate-400">
            An error occurred while communicating with backend API.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchWorkspace();
              refetchRooms();
            }}
          >
            Retry
          </Button>
        </div>
      ) : isLoadingRooms ? (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-4"
          }
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className={viewMode === "grid" ? "h-44 w-full rounded-2xl" : "h-20 w-full rounded-xl"}
            />
          ))}
        </div>
      ) : rooms.length > 0 ? (
        <>
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-4"
            }
          >
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                viewMode={viewMode}
                canModify={isOwner}
                onClick={() => navigate(`/rooms/${room.id}`)}
                onEdit={() => setSelectedRoomForEdit(room)}
                onArchive={() => setSelectedRoomForArchive(room)}
                onDelete={() => setSelectedRoomForDelete(room)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={(newPage) => updateUrlParams({ page: newPage })}
              />
            </div>
          )}
        </>
      ) : search || statusFilter !== "ALL" || languageFilter !== "ALL" ? (
        <EmptyState
          title="No matching rooms found"
          description="Try clearing filters or search terms to view all rooms in this workspace."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                updateUrlParams({ search: "", status: "ALL", language: "ALL", page: 1 })
              }
            >
              Clear Filters
            </Button>
          }
        />
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
              className="h-12 w-12 text-slate-600"
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

      {/* Edit Room Modal */}
      <EditRoomModal
        isOpen={!!selectedRoomForEdit}
        onClose={() => setSelectedRoomForEdit(null)}
        room={selectedRoomForEdit}
        onSubmit={(data) => editRoomMutation.mutate(data)}
        isLoading={editRoomMutation.isPending}
      />

      {/* Archive / Restore Room Dialog */}
      <Dialog
        isOpen={!!selectedRoomForArchive}
        onClose={() => setSelectedRoomForArchive(null)}
        onConfirm={() => {
          if (selectedRoomForArchive) {
            archiveRoomMutation.mutate(selectedRoomForArchive);
          }
        }}
        title={
          selectedRoomForArchive?.status === RoomStatus.ARCHIVED ? "Restore Room?" : "Archive Room?"
        }
        message={
          selectedRoomForArchive?.status === RoomStatus.ARCHIVED
            ? `Restoring "${selectedRoomForArchive?.name}" will re-enable modifications and code edits.`
            : `Archiving "${selectedRoomForArchive?.name}" will mark it read-only for workspace members.`
        }
        confirmText={selectedRoomForArchive?.status === RoomStatus.ARCHIVED ? "Restore" : "Archive"}
        loading={archiveRoomMutation.isPending}
      />

      {/* Delete Room Modal */}
      <DeleteRoomModal
        isOpen={!!selectedRoomForDelete}
        onClose={() => setSelectedRoomForDelete(null)}
        room={selectedRoomForDelete}
        onConfirmDelete={() => deleteRoomMutation.mutate()}
        isLoading={deleteRoomMutation.isPending}
      />

      {/* Edit Workspace Modal */}
      <Modal
        isOpen={isOpenEditModal}
        onClose={() => setIsOpenEditModal(false)}
        title="Edit Workspace"
      >
        <form onSubmit={handleSubmitEditWs(onEditWsSubmit)} className="flex flex-col gap-4">
          <Input
            label="Workspace Name"
            placeholder="e.g. project-x"
            error={editWsErrors.name?.message}
            {...registerEditWs("name")}
          />
          <Input
            label="Description"
            placeholder="A description of this project workspace"
            error={editWsErrors.description?.message}
            {...registerEditWs("description")}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Visibility
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              {...registerEditWs("visibility")}
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
            <Button size="sm" type="submit" loading={editWorkspaceMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Archive Workspace Dialog */}
      <Dialog
        isOpen={isOpenArchiveDialog}
        onClose={() => setIsOpenArchiveDialog(false)}
        onConfirm={() => archiveWorkspaceMutation.mutate()}
        title={workspace?.isArchived ? "Restore Workspace?" : "Archive Workspace?"}
        message={
          workspace?.isArchived
            ? "Restoring this workspace allows team members to create new rooms and update details."
            : "Archiving this workspace makes all nested coding rooms read-only. Members will not be able to modify content."
        }
        confirmText={workspace?.isArchived ? "Restore" : "Archive"}
        loading={archiveWorkspaceMutation.isPending}
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
              loading={deleteWorkspaceMutation.isPending}
              onClick={() => deleteWorkspaceMutation.mutate()}
            >
              Delete Workspace
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
