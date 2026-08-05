import React from "react";
import { RoomDTO, RoomStatus } from "@codesync/types";
import { Badge } from "../common/Badge.js";
import { Avatar } from "../common/Avatar.js";
import { LanguageBadge } from "./LanguageBadge.js";

interface RoomCardProps {
  room: RoomDTO;
  viewMode?: "grid" | "list";
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onArchive?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  canModify?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  viewMode = "grid",
  onClick,
  onEdit,
  onArchive,
  onDelete,
  canModify = false,
}) => {
  const isArchived = room.status === RoomStatus.ARCHIVED;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={onClick}
        className={`group border border-slate-850 bg-slate-900/40 hover:bg-slate-900/80 hover:border-indigo-500/40 rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isArchived ? "opacity-75 bg-slate-950/40" : ""
        }`}
      >
        <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
          <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                {room.name}
              </h4>
              <LanguageBadge language={room.language} size="sm" />
              {isArchived && (
                <Badge variant="warning" size="sm">
                  Archived
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              {room.description || "No description provided."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-850">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5" title={`Owner ID: ${room.owner}`}>
              <Avatar name="Owner" size="sm" />
              <span className="hidden lg:inline text-slate-400 font-medium">Owner</span>
            </div>
            <span className="text-slate-700">•</span>
            <span title="Created date">Created {formatDate(room.createdAt)}</span>
            <span className="text-slate-700">•</span>
            <span title="Last updated">Updated {formatDate(room.updatedAt)}</span>
          </div>

          {canModify && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <button
                  onClick={onEdit}
                  disabled={isArchived}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Edit Room"
                  aria-label="Edit Room"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
              {onArchive && (
                <button
                  onClick={onArchive}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title={isArchived ? "Restore Room" : "Archive Room"}
                  aria-label={isArchived ? "Restore Room" : "Archive Room"}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2m-14 0v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Delete Room"
                  aria-label="Delete Room"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group border border-slate-850 bg-slate-900/40 hover:bg-slate-900/80 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer ${
        isArchived ? "opacity-75 bg-slate-950/40" : ""
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors tracking-tight line-clamp-1">
              {room.name}
            </h4>
            {isArchived && (
              <Badge variant="warning" size="sm">
                Archived
              </Badge>
            )}
          </div>
          <LanguageBadge language={room.language} size="sm" />
        </div>

        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[2.25rem]">
          {room.description || "No description provided for this coding room."}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-850/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Avatar name="Owner" size="sm" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-300">Workspace Member</span>
            <span className="text-[10px] text-slate-500">Updated {formatDate(room.updatedAt)}</span>
          </div>
        </div>

        {canModify && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button
                onClick={onEdit}
                disabled={isArchived}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Edit Room"
                aria-label="Edit Room"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {onArchive && (
              <button
                onClick={onArchive}
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                title={isArchived ? "Restore Room" : "Archive Room"}
                aria-label={isArchived ? "Restore Room" : "Archive Room"}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2m-14 0v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Delete Room"
                aria-label="Delete Room"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        )}
      </div>
    </div>
  );
};
