import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { roomApi } from "../modules/room/services/room.service.js";
import { workspaceApi } from "../modules/workspace/services/workspace.service.js";
import { RoomStatus } from "@codesync/types";
import { RoomUpdateInput } from "@codesync/validators";
import { Button } from "../components/common/Button.js";
import { Avatar } from "../components/common/Avatar.js";
import { CodeEditor } from "../components/editor/CodeEditor.js";
import { ChatPanel } from "../components/room/ChatPanel.js";
import { getLanguageFromFileName } from "../utils/language.js";
import { EditRoomModal } from "../components/room/EditRoomModal.js";
import { DeleteRoomModal } from "../components/room/DeleteRoomModal.js";
import { Dialog } from "../components/common/Dialog.js";
import { useAuthStore } from "../modules/auth/store/auth.store.js";
import { useToastStore } from "../store/toast.store.js";
import { useSocket } from "../socket/hooks/useSocket.js";
import { useConnectionStatus } from "../socket/hooks/useConnectionStatus.js";
import { useRoomConnection } from "../socket/hooks/useRoomConnection.js";
import { useCollaborativeDocument } from "../collaboration/useCollaborativeDocument.js";
import { usePresence } from "../socket/hooks/usePresence.js";
import { ConnectionState, SocketEvents } from "@codesync/types";
import { FileExplorer } from "../components/room/FileExplorer.js";
import { fileApi } from "../modules/room/services/file.service.js";
import { TerminalPanel } from "../components/room/TerminalPanel.js";
import { Whiteboard } from "../components/whiteboard/Whiteboard.js";
import { SettingsModal } from "../components/common/SettingsModal.js";
import { ShareWorkspaceModal } from "../components/workspace/ShareWorkspaceModal.js";

type RightPanelTab = "chat" | "members" | "activity";

export const RoomDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const socket = useSocket();
  const socketStatus = useConnectionStatus();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);

  const [rightTab, setRightTab] = useState<RightPanelTab>("chat");
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"code" | "whiteboard">("code");

  // Modals state
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenArchiveDialog, setIsOpenArchiveDialog] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [isOpenSettingsModal, setIsOpenSettingsModal] = useState(false);
  const [isOpenShareModal, setIsOpenShareModal] = useState(false);

  // Data fetching
  const { data: roomFiles = [] } = useQuery({
    queryKey: ["roomFiles", id],
    queryFn: () => fileApi.getRoomFiles(id || ""),
    enabled: !!id,
  });

  useEffect(() => {
    if (roomFiles.length > 0 && !activeFileId) {
      const firstFile = roomFiles.find((f) => f.type === "FILE");
      if (firstFile) setActiveFileId(firstFile.id);
    }
  }, [roomFiles, activeFileId]);

  const activeFileNode = roomFiles.find((f) => f.id === activeFileId);
  const activeFileName = activeFileNode?.name || "No file selected";

  const { isJoined } = useRoomConnection(socket, socketStatus, id);

  useEffect(() => {
    if (!socket || !isJoined) return;
    const handleFileTreeUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["roomFiles", id] });
    };
    socket.on(SocketEvents.FILE_TREE_UPDATED, handleFileTreeUpdate);
    return () => {
      socket.off(SocketEvents.FILE_TREE_UPDATED, handleFileTreeUpdate);
    };
  }, [socket, isJoined, id, queryClient]);

  const ytext = useCollaborativeDocument(isJoined ? socket : null, id || "", activeFileId || "");
  const { users, cursors, updateCursor } = usePresence(isJoined ? socket : null, id);

  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
  } = useQuery({
    queryKey: ["room", id],
    queryFn: () => roomApi.getRoomById(id || ""),
    retry: false,
    enabled: !!id,
  });

  const { data: workspace } = useQuery({
    queryKey: ["workspace", room?.workspace],
    queryFn: () => workspaceApi.getWorkspaceById(room?.workspace || ""),
    enabled: !!room?.workspace,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["workspaceMembers", room?.workspace],
    queryFn: () => workspaceApi.getWorkspaceMembers(room?.workspace || ""),
    enabled: !!room?.workspace,
  });

  const updateRoomMutation = useMutation({
    mutationFn: (data: RoomUpdateInput) => roomApi.updateRoom(id || "", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", id] });
      queryClient.invalidateQueries({ queryKey: ["rooms", room?.workspace] });
      setIsOpenEditModal(false);
      addToast(`Room updated successfully`, "success");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to update room";
      addToast(msg, "error");
    },
  });

  const archiveRoomMutation = useMutation({
    mutationFn: () => {
      if (!room) return Promise.reject(new Error("Room not loaded"));
      return room.status === RoomStatus.ARCHIVED
        ? roomApi.restoreRoom(id || "")
        : roomApi.archiveRoom(id || "");
    },
    onSuccess: (updatedRoom) => {
      queryClient.invalidateQueries({ queryKey: ["room", id] });
      queryClient.invalidateQueries({ queryKey: ["rooms", room?.workspace] });
      setIsOpenArchiveDialog(false);
      addToast(
        updatedRoom.status === RoomStatus.ARCHIVED ? "Room archived" : "Room restored successfully",
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

  const deleteRoomMutation = useMutation({
    mutationFn: () => roomApi.deleteRoom(id || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", room?.workspace] });
      addToast("Room deleted successfully", "success");
      if (room?.workspace) {
        navigate(`/workspaces/${room.workspace}`);
      } else {
        navigate("/workspaces");
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to delete room";
      addToast(msg, "error");
    },
  });

  if (roomError) {
    return <div className="p-8 text-error">Failed to load room.</div>;
  }

  const isOwner =
    (workspace && user && String(workspace.owner) === String(user.id)) ||
    (room && user && String(room.owner) === String(user.id));

  const currentUserMember = members.find((m: any) => String(m.user.id) === String(user?.id));
  const hasEditorAccess =
    currentUserMember &&
    (currentUserMember.role === "OWNER" ||
      currentUserMember.role === "ADMIN" ||
      currentUserMember.role === "EDITOR");

  const canEdit = isOwner || hasEditorAccess;

  return (
    <div className="flex flex-col h-screen bg-surface w-full overflow-hidden">
      {/* Top Application Bar */}
      <header className="h-12 bg-surface-container shrink-0 flex items-center justify-between px-4 border-b border-surface-container-highest">
        {/* Left: Branding & Room Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">data_object</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">CodeSync</span>
          </div>
          <div className="w-px h-4 bg-outline-variant mx-2"></div>
          <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded text-body-sm font-body-sm">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              folder
            </span>
            <span className="text-on-surface-variant">{workspace?.name || "Workspace"}</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">{room?.name || "Room"}</span>
            <span className="text-[10px] bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.5 rounded ml-1 font-label-sm">
              Active Session
            </span>
          </div>
        </div>

        {/* Center: Search (Optional / Placeholder) */}
        <div className="flex-1 max-w-xl hidden md:flex items-center">
          <div className="w-full relative ml-8">
            <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[18px] text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Search rooms, files, symbols..."
              className="w-full h-8 bg-surface-container-low border border-outline-variant rounded pl-9 pr-3 text-body-sm font-body-sm focus:outline-none focus:border-primary-container transition-colors"
            />
            <kbd className="absolute right-2 top-1.5 font-code-sm text-code-sm bg-surface-container px-1.5 rounded text-outline border border-outline-variant">
              ⌘ K
            </kbd>
          </div>
        </div>

        {/* Right: Connection Status & Global Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-code-sm font-code-sm bg-surface-container-lowest border border-outline-variant px-2 py-1 rounded">
            <span
              className={`w-1.5 h-1.5 rounded-full ${socketStatus === ConnectionState.CONNECTED ? "bg-tertiary" : "bg-error"}`}
            ></span>
            <span className="text-tertiary">{socketStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-outline hover:text-on-surface p-1">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </button>
            <button className="text-outline hover:text-on-surface p-1">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
          </div>
          <div className="w-px h-4 bg-outline-variant"></div>
          <Avatar name={user?.name || "User"} size="sm" />
        </div>
      </header>

      {/* Main IDE Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Global Nav (Minimal Icons) */}
        <aside className="w-12 bg-surface-container shrink-0 border-r border-surface-container-highest flex flex-col items-center py-4 gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-outline hover:text-on-surface p-2 rounded hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">dashboard</span>
          </button>
          <button
            onClick={() => navigate("/workspaces")}
            className="text-outline hover:text-on-surface p-2 rounded hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">folder_open</span>
          </button>
          <button
            onClick={() => setActiveView("code")}
            className={`p-2 rounded ${activeView === "code" ? "text-primary bg-primary-container/10 border-l-2 border-primary-container" : "text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"}`}
            title="Code Editor"
          >
            <span className="material-symbols-outlined">terminal</span>
          </button>
          <button
            onClick={() => setActiveView("whiteboard")}
            className={`p-2 rounded ${activeView === "whiteboard" ? "text-primary bg-primary-container/10 border-l-2 border-primary-container" : "text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"}`}
            title="Whiteboard"
          >
            <span className="material-symbols-outlined">draw</span>
          </button>
          <button
            onClick={() => setIsOpenSettingsModal(true)}
            className="text-outline hover:text-on-surface p-2 rounded hover:bg-surface-container-high transition-colors mt-auto"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </aside>

        {/* File Explorer Panel */}
        <aside className="w-64 bg-surface-container-low shrink-0 flex flex-col border-r border-surface-container-highest">
          <div className="h-9 border-b border-surface-container-highest flex items-center px-4">
            <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider">
              Files
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <FileExplorer
              roomId={id || ""}
              activeFileId={activeFileId}
              onFileSelect={setActiveFileId}
            />
          </div>
        </aside>

        {/* Center Editor & Terminal */}
        <main className="flex-1 flex flex-col min-w-0 bg-background relative">
          {/* Editor Tabs & Toolbar */}
          <div
            className={`h-9 bg-surface-container shrink-0 items-center justify-between border-b border-surface-container-highest ${activeView === "whiteboard" ? "hidden" : "flex"}`}
          >
            <div className="flex items-center h-full">
              <div className="h-full px-4 border-r border-surface-container-highest bg-background flex items-center gap-2 relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container"></div>
                <span className="text-primary-container font-label-sm">
                  {getLanguageFromFileName(activeFileName).toUpperCase()}
                </span>
                <span className="font-code-md text-code-md text-on-surface">{activeFileName}</span>
                <button className="ml-2 text-outline hover:text-on-surface">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 pr-4">
              <div className="flex items-center gap-2 font-code-sm text-code-sm text-tertiary">
                <span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span>
                <span>Connected</span>
                <span className="text-outline-variant">•</span>
                <span>CRDT Synced</span>
              </div>

              <div className="flex items-center -space-x-1 ml-2">
                {users.slice(0, 3).map((u) => (
                  <div
                    key={u.userId}
                    className="w-6 h-6 rounded-full border border-surface bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface"
                    style={{ borderColor: u.color }}
                  >
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="h-6 text-[11px] px-2 ml-2"
                onClick={() => setIsOpenShareModal(true)}
              >
                <span className="material-symbols-outlined text-[14px]">share</span> Share
              </Button>
            </div>
          </div>

          {/* Viewport */}
          <div className="flex-1 min-h-0 relative flex flex-col">
            {activeView === "code" ? (
              <>
                <div className="flex-1 min-h-0 relative">
                  {isLoadingRoom ? (
                    <div className="p-4 text-outline font-code-sm">Loading editor...</div>
                  ) : (
                    <CodeEditor
                      ytext={ytext}
                      language={getLanguageFromFileName(activeFileName)}
                      readOnly={!canEdit || room?.status === RoomStatus.ARCHIVED || !activeFileId}
                      users={users}
                      cursors={cursors}
                      onCursorChange={updateCursor}
                    />
                  )}
                </div>
                <TerminalPanel
                  roomId={id || ""}
                  ytext={ytext}
                  language={getLanguageFromFileName(activeFileName)}
                />
              </>
            ) : (
              <Whiteboard roomId={id || ""} />
            )}
          </div>
        </main>

        {/* Right Collaboration Panel */}
        <aside className="w-80 bg-surface-container shrink-0 flex flex-col border-l border-surface-container-highest">
          <div className="h-9 border-b border-surface-container-highest flex items-center px-2">
            <button
              onClick={() => setRightTab("chat")}
              className={`flex-1 h-full font-label-sm text-label-sm uppercase tracking-wider ${rightTab === "chat" ? "text-on-surface border-b border-primary-container" : "text-outline hover:text-on-surface"}`}
            >
              Chat
            </button>
            <button
              onClick={() => setRightTab("members")}
              className={`flex-1 h-full font-label-sm text-label-sm uppercase tracking-wider ${rightTab === "members" ? "text-on-surface border-b border-primary-container" : "text-outline hover:text-on-surface"}`}
            >
              Members ({users.length})
            </button>
            <button
              onClick={() => setRightTab("activity")}
              className={`flex-1 h-full font-label-sm text-label-sm uppercase tracking-wider ${rightTab === "activity" ? "text-on-surface border-b border-primary-container" : "text-outline hover:text-on-surface"}`}
            >
              Activity
            </button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {rightTab === "chat" && (
              <div className="absolute inset-0 flex flex-col">
                <ChatPanel
                  socket={socket}
                  roomId={id || ""}
                  isJoined={isJoined}
                  socketStatus={socketStatus}
                />
              </div>
            )}
            {rightTab === "members" && (
              <div className="absolute inset-0 overflow-y-auto p-4 flex flex-col gap-4">
                {users.map((u) => (
                  <div key={u.userId} className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar name={u.name} size="sm" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-tertiary rounded-full border-2 border-surface-container"></div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-body-sm font-semibold text-on-surface truncate">
                        {u.name}
                      </span>
                      <span className="text-label-sm font-label-sm text-outline truncate">
                        {user?.id === u.userId
                          ? "You"
                          : u.userId === room?.owner
                            ? "Host"
                            : "Collaborator"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {rightTab === "activity" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <span className="material-symbols-outlined text-[48px] text-outline mb-2">
                  history
                </span>
                <span className="text-body-md text-on-surface mb-1">Activity Stream</span>
                <span className="text-body-sm text-outline">Coming soon in a future update.</span>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* StatusBar Footer */}
      <footer className="h-6 bg-surface-container-highest shrink-0 flex items-center justify-between px-4 border-t border-outline-variant/30 text-code-sm font-code-sm text-outline">
        <div className="flex items-center gap-4">
          <span>{socketStatus === ConnectionState.CONNECTED ? "Yjs Synced" : "Disconnected"}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span className="text-tertiary flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">group</span> {users.length}{" "}
            Peers Active
          </span>
        </div>
      </footer>

      {/* Edit Room Modal */}
      <EditRoomModal
        isOpen={isOpenEditModal}
        onClose={() => setIsOpenEditModal(false)}
        room={room || null}
        onSubmit={(data) => updateRoomMutation.mutate(data)}
        isLoading={updateRoomMutation.isPending}
      />

      {/* Share Workspace Modal */}
      <ShareWorkspaceModal
        isOpen={isOpenShareModal}
        onClose={() => setIsOpenShareModal(false)}
        workspaceId={room?.workspace || ""}
      />

      {/* Archive / Restore Room Dialog */}
      <Dialog
        isOpen={isOpenArchiveDialog}
        onClose={() => setIsOpenArchiveDialog(false)}
        onConfirm={() => archiveRoomMutation.mutate()}
        title={room?.status === RoomStatus.ARCHIVED ? "Restore Room?" : "Archive Room?"}
        message={
          room?.status === RoomStatus.ARCHIVED
            ? "Restoring this room re-enables code editing and configurations."
            : "Archiving this room makes it read-only for workspace members."
        }
        confirmText={room?.status === RoomStatus.ARCHIVED ? "Restore" : "Archive"}
        loading={archiveRoomMutation.isPending}
      />

      {/* Delete Room Modal */}
      <DeleteRoomModal
        isOpen={isOpenDeleteModal}
        onClose={() => setIsOpenDeleteModal(false)}
        room={room || null}
        onConfirmDelete={() => deleteRoomMutation.mutate()}
        isLoading={deleteRoomMutation.isPending}
      />

      <SettingsModal isOpen={isOpenSettingsModal} onClose={() => setIsOpenSettingsModal(false)} />
    </div>
  );
};
