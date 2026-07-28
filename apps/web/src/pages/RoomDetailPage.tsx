import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomApi } from "../modules/room/services/room.service.js";
import { RoomLanguage, RoomStatus } from "@codesync/types";
import { Button } from "../components/common/Button.js";
import { Badge } from "../components/common/Badge.js";
import { useState } from "react";
import { Skeleton } from "../components/common/Skeleton.js";
import { Avatar } from "../components/common/Avatar.js";

export const RoomDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeFile, setActiveFile] = useState("index.js");

  // Fetch room details
  const {
    data: room,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["room", id],
    queryFn: () => roomApi.getRoomById(id || ""),
    retry: false,
    enabled: !!id,
  });

  // Change room language mutation
  const changeLanguageMutation = useMutation({
    mutationFn: (language: RoomLanguage) => roomApi.updateRoom(id || "", { language }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", id] });
    },
  });

  // Toggle archive status
  const archiveRoomMutation = useMutation({
    mutationFn: () => {
      if (!room) return Promise.reject(new Error("Room not loaded"));
      return room.status === RoomStatus.ARCHIVED
        ? roomApi.restoreRoom(id || "")
        : roomApi.archiveRoom(id || "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", id] });
    },
  });

  if (!id) {
    return <div className="text-slate-400">Room ID is missing.</div>;
  }

  if (error) {
    navigate("/404", { replace: true });
    return null;
  }

  const mockFiles = [
    { name: "index.js", size: "1.2 KB" },
    { name: "utils.js", size: "840 B" },
    { name: "package.json", size: "430 B" },
    { name: "README.md", size: "2.1 KB" },
  ];

  const getCodeSnippet = (fileName: string, lang: string) => {
    switch (fileName) {
      case "index.js":
        return `// Welcome to CodeSync Room!\n// Language: ${lang}\n\nimport { formatMsg } from "./utils.js";\n\nfunction main() {\n  const message = "Hello from collaborative room!";\n  console.log(formatMsg(message));\n}\n\nmain();`;
      case "utils.js":
        return `export function formatMsg(msg) {\n  return \`[\${new Date().toISOString()}] \${msg}\`;\n}`;
      case "package.json":
        return `{\n  "name": "codesync-sandbox",\n  "version": "1.0.0",\n  "type": "module",\n  "dependencies": {}\n}`;
      case "README.md":
        return `# CodeSync Sandbox\n\nThis is a collaborative coding sandbox. Any modifications made here are synchronized in real-time.`;
      default:
        return "// Empty file";
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-6">
      {/* Left panel: File Explorer tree (VS Code style) */}
      <aside className="w-full md:w-56 shrink-0 border border-slate-900 bg-slate-950/40 rounded-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-900 bg-slate-900/10">
          <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">Explorer</span>
        </div>
        <div className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
          {mockFiles.map((file) => (
            <button
              key={file.name}
              onClick={() => setActiveFile(file.name)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-slate-900/60 cursor-pointer ${
                activeFile === file.name
                  ? "bg-indigo-600/10 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
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
              <span className="text-[10px] text-slate-600 font-medium">{file.size}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Center panel: Text Editor area */}
      <div className="flex-1 border border-slate-900 bg-slate-950/20 rounded-2xl flex flex-col overflow-hidden relative">
        {/* Editor tabs navigation bar */}
        <div className="h-11 border-b border-slate-900 bg-slate-950 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-300 bg-slate-900/40 px-3 py-1.5 rounded border border-slate-850">
              {activeFile}
            </span>
          </div>
          {room && (
            <div className="flex items-center gap-2">
              <Badge variant={room.status === RoomStatus.ACTIVE ? "success" : "danger"} size="sm">
                {room.status}
              </Badge>
            </div>
          )}
        </div>

        {/* Text/code layout area */}
        <div className="flex-1 flex overflow-hidden font-mono text-sm leading-relaxed p-4 bg-slate-950/10 text-slate-300">
          {isLoading ? (
            <div className="w-full h-full flex flex-col gap-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : room ? (
            <div className="flex-1 flex overflow-auto select-text">
              {/* Line numbers gutter */}
              <div className="text-slate-700 text-right pr-4 select-none shrink-0 border-r border-slate-900/60 hidden sm:block">
                {getCodeSnippet(activeFile, room.language)
                  .split("\n")
                  .map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
              </div>
              {/* Code content */}
              <pre className="pl-4 overflow-x-auto whitespace-pre font-mono text-indigo-100 flex-1">
                {getCodeSnippet(activeFile, room.language)}
              </pre>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right panel: Room actions sidebar */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
        <div className="border border-slate-900 bg-slate-950/40 rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">
              Metadata
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-32 mt-2" />
            ) : room ? (
              <div className="mt-1">
                <h3 className="text-base font-bold text-white tracking-tight">{room.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {room.description || "No description."}
                </p>
              </div>
            ) : null}
          </div>

          {room && (
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-900">
              {/* Language selection dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">
                  Language
                </label>
                <select
                  value={room.language}
                  onChange={(e) => changeLanguageMutation.mutate(e.target.value as RoomLanguage)}
                  disabled={room.status === RoomStatus.ARCHIVED || changeLanguageMutation.isPending}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {Object.values(RoomLanguage).map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Actions */}
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  loading={archiveRoomMutation.isPending}
                  onClick={() => archiveRoomMutation.mutate()}
                >
                  {room.status === RoomStatus.ARCHIVED ? "Restore Room" : "Archive Room"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/workspaces/${room.workspace}`)}
                >
                  Back to Workspace
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Active Members mock sidebar */}
        <div className="border border-slate-900 bg-slate-950/40 rounded-2xl p-5 flex flex-col gap-4">
          <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">
            Active Members (Mock)
          </span>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Avatar name="Owner User" size="sm" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-300">Workspace Owner</span>
                <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-wider">
                  OWNER
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Avatar name="Guest Reader" size="sm" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-300">Guest Guest</span>
                <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider">
                  VIEWER
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
