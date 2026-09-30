import React, { useState, useEffect } from "react";
import { RoomLanguage } from "@codesync/types";
import { Button } from "../common/Button.js";

interface RoomListHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  languageFilter: string;
  onLanguageFilterChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onNewRoomClick: () => void;
  isCreateDisabled?: boolean;
}

export const RoomListHeader: React.FC<RoomListHeaderProps> = ({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  statusFilter,
  onStatusFilterChange,
  languageFilter,
  onLanguageFilterChange,
  viewMode,
  onViewModeChange,
  onNewRoomClick,
  isCreateDisabled = false,
}) => {
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search by 300ms
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, search, onSearchChange]);

  return (
    <div className="flex flex-col gap-4 bg-surface border border-outline-variant p-4 rounded-2xl mb-6 shadow-sm">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            aria-label="Search rooms"
            placeholder="Search rooms by name, description, language..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          {/* View mode toggle */}
          <div className="flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant shrink-0">
            <button
              onClick={() => onViewModeChange("grid")}
              title="Grid view"
              className={`p-1.5 rounded-lg text-on-surface-variant transition-colors ${
                viewMode === "grid" ? "bg-primary/15 text-primary" : "hover:text-on-surface"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
                />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              title="List view"
              className={`p-1.5 rounded-lg text-on-surface-variant transition-colors ${
                viewMode === "list" ? "bg-primary/15 text-primary" : "hover:text-on-surface"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <Button size="sm" disabled={isCreateDisabled} onClick={onNewRoomClick}>
            New Room
          </Button>
        </div>
      </div>

      {/* Filter and Sort row */}
      <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-outline-variant">
        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-on-surface-variant font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            aria-label="Filter by status"
            className="bg-surface border border-outline-variant text-on-surface rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Language filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-on-surface-variant font-medium">Language:</span>
          <select
            value={languageFilter}
            onChange={(e) => onLanguageFilterChange(e.target.value)}
            aria-label="Filter by language"
            className="bg-surface border border-outline-variant text-on-surface rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">All Languages</option>
            {Object.values(RoomLanguage).map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Sort option */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-on-surface-variant font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            aria-label="Sort rooms"
            className="bg-surface border border-outline-variant text-on-surface rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="recently_updated">Recently Updated</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="language">Language</option>
          </select>
        </div>
      </div>
    </div>
  );
};
