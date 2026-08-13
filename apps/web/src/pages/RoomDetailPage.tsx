import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { roomApi } from "../modules/room/services/room.service.js";
import { workspaceApi } from "../modules/workspace/services/workspace.service.js";
import { RoomLanguage, RoomStatus } from "@codesync/types";
import { RoomUpdateInput } from "@codesync/validators";
import { Button } from "../components/common/Button.js";
import { Badge } from "../components/common/Badge.js";
import { Skeleton } from "../components/common/Skeleton.js";
import { Avatar } from "../components/common/Avatar.js";
import { Breadcrumbs } from "../components/common/Breadcrumbs.js";
import { LanguageBadge } from "../components/room/LanguageBadge.js";
import { RoomSidebar, RoomSidebarTab } from "../components/room/RoomSidebar.js";
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
import { ConnectionState } from "@codesync/types";

export const RoomDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const socket = useSocket();
  const socketStatus = useConnectionStatus();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState<RoomSidebarTab>("overview");
  const [activeFile, setActiveFile] = useState("index.js");
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenArchiveDialog, setIsOpenArchiveDialog] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);

  const [files, setFiles] = useState<Record<string, string>>({
    "index.js": `// Welcome to CodeSync Room!\n\nimport { formatMsg } from "./utils.js";\n\nfunction main() {\n  const message = "Hello from collaborative room!";\n  console.log(formatMsg(message));\n}\n\nmain();`,
    "utils.js": `export function formatMsg(msg) {\n  return \`[\${new Date().toISOString()}] \${msg}\`;\n}`,
    "package.json": `{\n  "name": "codesync-sandbox",\n  "version": "1.0.0",\n  "type": "module",\n  "dependencies": {}\n}`,
    "README.md": `# CodeSync Sandbox\n\nThis is a collaborative coding sandbox. Any modifications made here are synchronized in real-time.`,
  });

  // Manage room connection lifecycle (reconnecting, joining, leaving)
  const { isJoined, isJoining } = useRoomConnection(socket, socketStatus, id);

  // Get collaborative Yjs document text for the active file
  // We only initialize the document sync if we have successfully joined the room
  const ytext = useCollaborativeDocument(isJoined ? socket : null, id || "", activeFile);

  // Get live presence and cursors
  const { users, cursors, updateCursor } = usePresence(isJoined ? socket : null, id);

  // Fetch room details
  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
    refetch: refetchRoom,
  } = useQuery({
    queryKey: ["room", id],
    queryFn: () => roomApi.getRoomById(id || ""),
    retry: false,
    enabled: !!id,
  });

  // Fetch parent workspace details for breadcrumbs and owner check
  const { data: workspace } = useQuery({
    queryKey: ["workspace", room?.workspace],
    queryFn: () => workspaceApi.getWorkspaceById(room?.workspace || ""),
    enabled: !!room?.workspace,
  });

  // Change room language/details mutation
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

  // Toggle archive status mutation
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

  // Delete room mutation
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

  if (!id) {
    return <div className="text-slate-400">Room ID is missing.</div>;
  }

  if (roomError) {
    const status = (roomError as { response?: { status?: number } }).response?.status;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-lg">
          {status || 500}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            {status === 404
              ? "Room Not Found"
              : status === 403
                ? "Permission Denied"
                : "Failed to load room"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {status === 404
              ? "The room you are looking for does not exist or has been deleted."
              : status === 403
                ? "You do not have required permissions to view this coding room."
                : "An unexpected error occurred while fetching room data."}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/workspaces")}>
            Back to Workspaces
          </Button>
          <Button size="sm" onClick={() => refetchRoom()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const mockFiles = [
    { name: "index.js", size: "1.2 KB" },
    { name: "utils.js", size: "840 B" },
    { name: "package.json", size: "430 B" },
    { name: "README.md", size: "2.1 KB" },
  ];

  const handleEditorChange = (value: string) => {
    setFiles((prev) => ({
      ...prev,
      [activeFile]: value,
    }));
  };

  const isOwner =
    (workspace && user && String(workspace.owner) === String(user.id)) ||
    (room && user && String(room.owner) === String(user.id));

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-6.5rem)]">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          {
            label: workspace?.name || "Workspace",
            href: room?.workspace ? `/workspaces/${room.workspace}` : "/workspaces",
          },
          { label: room?.name || "Room" },
        ]}
      />

      {/* Room Header bar */}
      <div className="border border-slate-850 bg-slate-900/40 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-400 shrink-0 relative">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div
              className={`absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                socketStatus === ConnectionState.CONNECTED && isJoined
                  ? "bg-emerald-500"
                  : socketStatus === ConnectionState.CONNECTING || isJoining
                    ? "bg-amber-500 animate-pulse"
                    : "bg-red-500"
              }`}
              title={
                socketStatus === ConnectionState.CONNECTED && isJoined
                  ? "Connected & Joined"
                  : socketStatus === ConnectionState.CONNECTING || isJoining
                    ? "Connecting..."
                    : "Disconnected"
              }
            />
          </div>
          <div>
            {isLoadingRoom ? (
              <Skeleton className="h-6 w-48" />
            ) : room ? (
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">{room.name}</h2>
                <LanguageBadge language={room.language} size="sm" />
                <Badge
                  variant={room.status === RoomStatus.ACTIVE ? "success" : "warning"}
                  size="sm"
                >
                  {room.status}
                </Badge>
              </div>
            ) : null}
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              {room?.description || "Collaborative sandbox workspace room."}
            </p>
          </div>
        </div>

        {/* Room Header Action Buttons */}
        {room && isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={room.status === RoomStatus.ARCHIVED}
              onClick={() => setIsOpenEditModal(true)}
            >
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsOpenArchiveDialog(true)}>
              {room.status === RoomStatus.ARCHIVED ? "Restore" : "Archive"}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setIsOpenDeleteModal(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Main Workspace split layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0 overflow-hidden">
        {/* Left Room Sidebar */}
        <div className="w-full md:w-48 shrink-0">
          <RoomSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content Display */}
        {activeTab === "overview" || activeTab === "files" || activeTab === "chat" ? (
          <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0 overflow-hidden">
            {/* Explorer Panel */}
            <aside className="w-full md:w-56 shrink-0 border border-slate-850 bg-slate-950/40 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-850 bg-slate-900/20 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">
                  Explorer
                </span>
                <span className="text-[10px] text-slate-500 font-mono">FILES</span>
              </div>
              <div className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
                {mockFiles.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => setActiveFile(file.name)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      activeFile === file.name
                        ? "bg-indigo-600/10 text-indigo-400 font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">{file.size}</span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Editor & Terminal Center area */}
            <div className="flex-1 flex flex-col border border-slate-850 bg-slate-950/30 rounded-2xl overflow-hidden min-w-0">
              {/* Editor Tabs bar */}
              <div className="h-10 border-b border-slate-850 bg-slate-950/80 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-indigo-300 bg-indigo-950/40 px-3 py-1 rounded border border-indigo-900/40">
                    {activeFile}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden sm:inline">
                    {getLanguageFromFileName(activeFile)}
                  </span>
                </div>
                {room && (
                  <select
                    value={room.language}
                    onChange={(e) =>
                      updateRoomMutation.mutate({ language: e.target.value as RoomLanguage })
                    }
                    disabled={
                      room.status === RoomStatus.ARCHIVED ||
                      !isOwner ||
                      updateRoomMutation.isPending
                    }
                    className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-60"
                  >
                    {Object.values(RoomLanguage).map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Code Display Area */}
              <div className="flex-1 overflow-hidden bg-slate-950">
                {isLoadingRoom ? (
                  <div className="flex flex-col gap-3 p-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : room ? (
                  <CodeEditor
                    value={files[activeFile] || ""}
                    ytext={ytext}
                    language={getLanguageFromFileName(activeFile)}
                    readOnly={!isOwner || room.status === RoomStatus.ARCHIVED}
                    onChange={handleEditorChange}
                    users={users}
                    cursors={cursors}
                    onCursorChange={updateCursor}
                  />
                ) : null}
              </div>

              {/* Terminal / Output Panel Placeholder */}
              <div className="h-28 border-t border-slate-850 bg-slate-950 flex flex-col shrink-0">
                <div className="h-7 px-4 bg-slate-900/30 border-b border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Terminal Output</span>
                  <span className="text-[10px] text-slate-600">Read-Only Placeholder</span>
                </div>
                <div className="flex-1 p-3 font-mono text-xs text-emerald-400/90 overflow-y-auto">
                  <p>$ codesync-runner init --room={room?.id || "sandbox"}</p>
                  <p className="text-slate-400">
                    [INFO] Ready for execution. Reserved slot for socket output.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Information & Activity Sidebar or Chat Panel */}
            {activeTab === "overview" && (
              <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                <div className="border border-slate-850 bg-slate-950/40 rounded-2xl p-4 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">
                    Room Info
                  </span>
                  {room && (
                    <div className="flex flex-col gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Language:</span>
                        <span className="text-slate-200 font-medium ml-1">
                          {room.language.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <span className="text-slate-200 font-medium ml-1">{room.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Created:</span>
                        <span className="text-slate-200 font-medium ml-1">
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Members */}
                <div className="border border-slate-850 bg-slate-950/40 rounded-2xl p-4 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">
                    Active Members ({users.length})
                  </span>
                  <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-2">
                    {users.length === 0 ? (
                      <span className="text-xs text-slate-500">No active members</span>
                    ) : (
                      users.map((u) => (
                        <div key={u.userId} className="flex items-center gap-2">
                          <div className="relative">
                            <Avatar name={u.name} size="sm" />
                            <div
                              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-950"
                              style={{ backgroundColor: u.color }}
                              title="Online"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-slate-200 truncate">
                              {u.name}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase truncate">
                              {user?.id === u.userId ? "YOU" : "ONLINE"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Changes Placeholder */}
                <div className="border border-slate-850 bg-slate-950/40 rounded-2xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">
                    Recent Activity
                  </span>
                  <p className="text-xs text-slate-500">Room created and initialized.</p>
                </div>
              </aside>
            )}

            {activeTab === "chat" && (
              <aside className="w-full md:w-80 shrink-0 flex flex-col bg-slate-950">
                <ChatPanel
                  socket={socket}
                  roomId={id}
                  isJoined={isJoined}
                  socketStatus={socketStatus}
                />
              </aside>
            )}
          </div>
        ) : activeTab === "members" ? (
          <div className="flex-1 flex flex-col border border-slate-850 bg-slate-950/30 rounded-2xl overflow-hidden min-w-0">
            <div className="h-14 border-b border-slate-850 bg-slate-950/80 flex items-center justify-between px-6 shrink-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Room Members
              </h3>
              <Button size="sm" variant="outline" disabled={!isOwner}>
                Invite Member
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <Avatar name="Owner User" size="md" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">Owner User</span>
                    <span className="text-xs text-slate-500">owner@example.com</span>
                  </div>
                </div>
                <Badge variant="success">Owner</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <Avatar name="Collaborator" size="md" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">Collaborator</span>
                    <span className="text-xs text-slate-500">collab@example.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="primary">Editor</Badge>
                  {isOwner && (
                    <button
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Remove Member"
                      aria-label="Remove Member"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "activity" ? (
          <div className="flex-1 flex flex-col border border-slate-850 bg-slate-950/30 rounded-2xl overflow-hidden min-w-0">
            <div className="h-14 border-b border-slate-850 bg-slate-950/80 flex items-center px-6 shrink-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Activity
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="relative border-l border-slate-800 ml-3 md:ml-4 flex flex-col gap-6 pb-4">
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-slate-950" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-200">
                      Room created and initialized
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      {room ? new Date(room.createdAt).toLocaleString() : "Just now"}
                    </span>
                  </div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-slate-950" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-200">
                      Owner User joined the room
                    </span>
                    <span className="text-xs text-slate-500 mt-1">A few moments later</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Other Tabs Placeholders (Settings) */
          <div className="flex-1 border border-slate-850 bg-slate-950/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">
              {activeTab} Placeholder
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              This panel is reserved for future {activeTab} management. Core Room Management
              structure is active.
            </p>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("overview")}>
              Back to Overview
            </Button>
          </div>
        )}
      </div>

      {/* Edit Room Modal */}
      <EditRoomModal
        isOpen={isOpenEditModal}
        onClose={() => setIsOpenEditModal(false)}
        room={room || null}
        onSubmit={(data) => updateRoomMutation.mutate(data)}
        isLoading={updateRoomMutation.isPending}
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
    </div>
  );
};
