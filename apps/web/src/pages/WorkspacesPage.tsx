import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../modules/workspace/services/workspace.service.js";
import { WorkspaceVisibility } from "@codesync/types";
import { WorkspaceCreateSchema } from "@codesync/validators";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button.js";
import { Card } from "../components/common/Card.js";
import { Badge } from "../components/common/Badge.js";
import { Input } from "../components/common/Input.js";
import { Modal } from "../components/common/Modal.js";
import { SearchBar } from "../components/common/SearchBar.js";
import { Pagination } from "../components/common/Pagination.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { Skeleton } from "../components/common/Skeleton.js";
import { useToastStore } from "../store/toast.store.js";

type CreateWorkspaceInput = z.input<typeof WorkspaceCreateSchema>;

export const WorkspacesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL state params
  const searchParam = searchParams.get("search") || "";
  const pageParam = Number(searchParams.get("page")) || 1;
  const sortParam = searchParams.get("sort") || "newest";
  const visibilityParam = searchParams.get("visibility") || "all";
  const statusParam = searchParams.get("status") || "all";
  const viewParam = (searchParams.get("view") as "grid" | "list") || "grid";

  const [search, setSearch] = useState(searchParam);
  const [isOpen, setIsOpen] = useState(false);

  const updateParams = useCallback(
    (newParams: Record<string, string | number>) => {
      const updated = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, val]) => {
        if (val === "" || val === "all") {
          updated.delete(key);
        } else {
          updated.set(key, String(val));
        }
      });
      setSearchParams(updated);
    },
    [searchParams, setSearchParams]
  );

  // Sync search state with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ search, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, updateParams]);

  // Sync search input if URL search param changes externally
  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  // Fetch workspaces list matching search criteria (high limit to sort/filter client-side cleanly)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["workspaces-list", searchParam],
    queryFn: () => workspaceApi.getWorkspaces(1, 200, searchParam),
  });

  // Calculate filtered and sorted workspaces list
  const processedWorkspaces = useMemo(() => {
    let list = data?.data || [];

    // Filter by visibility
    if (visibilityParam === "public") {
      list = list.filter((w) => w.visibility === WorkspaceVisibility.PUBLIC);
    } else if (visibilityParam === "private") {
      list = list.filter((w) => w.visibility === WorkspaceVisibility.PRIVATE);
    }

    // Filter by status (active / archived)
    if (statusParam === "active") {
      list = list.filter((w) => !w.isArchived);
    } else if (statusParam === "archived") {
      list = list.filter((w) => w.isArchived);
    }

    // Sort list
    list = [...list].sort((a, b) => {
      if (sortParam === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortParam === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      if (sortParam === "recently-updated") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [data, sortParam, visibilityParam, statusParam]);

  // Paginated chunk selection
  const itemsPerPage = 6;
  const totalItems = processedWorkspaces.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedWorkspaces = useMemo(() => {
    const startIndex = (pageParam - 1) * itemsPerPage;
    return processedWorkspaces.slice(startIndex, startIndex + itemsPerPage);
  }, [processedWorkspaces, pageParam]);

  const createMutation = useMutation({
    mutationFn: (data: CreateWorkspaceInput) =>
      workspaceApi.createWorkspace({
        name: data.name,
        description: data.description || "",
        visibility: data.visibility || WorkspaceVisibility.PRIVATE,
      }),
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces-list"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces-dashboard"] });
      setIsOpen(false);
      reset();
      addToast(`Workspace "${newWorkspace.name}" created successfully`, "success");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to create workspace";
      addToast(msg, "error");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(WorkspaceCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: WorkspaceVisibility.PRIVATE,
    },
  });

  const onSubmit = (fields: CreateWorkspaceInput) => {
    createMutation.mutate({
      name: fields.name,
      description: fields.description || "",
      visibility: fields.visibility || WorkspaceVisibility.PRIVATE,
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-1">Workspaces</h2>
          <p className="text-sm text-slate-400">Manage your collaborative coding workspaces</p>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          New Workspace
        </Button>
      </div>

      {/* Filtering, Search & View Controls */}
      <div className="flex flex-col gap-4 border-b border-slate-900 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or description..."
          />

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Sort:</span>
              <select
                value={sortParam}
                onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="recently-updated">Recently Updated</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>

            {/* Visibility Filters */}
            <div className="flex items-center border border-slate-850 rounded-lg p-0.5 bg-slate-900/50">
              {["all", "public", "private"].map((v) => (
                <button
                  key={v}
                  onClick={() => updateParams({ visibility: v, page: 1 })}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    visibilityParam === v
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Status Filters */}
            <div className="flex items-center border border-slate-850 rounded-lg p-0.5 bg-slate-900/50">
              {["all", "active", "archived"].map((st) => (
                <button
                  key={st}
                  onClick={() => updateParams({ status: st, page: 1 })}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    statusParam === st
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Grid/List Toggle */}
            <div className="flex items-center border border-slate-850 rounded-lg p-0.5 bg-slate-900/50 shrink-0">
              <button
                onClick={() => updateParams({ view: "grid" })}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewParam === "grid"
                    ? "text-indigo-400 bg-indigo-600/10"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                title="Grid view"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
                  />
                </svg>
              </button>
              <button
                onClick={() => updateParams({ view: "list" })}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewParam === "list"
                    ? "text-indigo-400 bg-indigo-600/10"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                title="List view"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* List / Grid Displays */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Loading workspaces failed"
          description="A connection issue occurred while loading workspaces from Atlas."
          action={
            <Button
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["workspaces-list"] })}
            >
              Retry
            </Button>
          }
          icon={
            <svg
              className="h-12 w-12 text-red-500"
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
          }
        />
      ) : paginatedWorkspaces.length > 0 ? (
        viewParam === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {paginatedWorkspaces.map((workspace) => (
              <Card
                key={workspace.id}
                title={workspace.name}
                description={workspace.description}
                onClick={() => navigate(`/workspaces/${workspace.id}`)}
                footer={
                  <div className="w-full flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          workspace.visibility === WorkspaceVisibility.PUBLIC
                            ? "success"
                            : "secondary"
                        }
                        size="sm"
                      >
                        {workspace.visibility}
                      </Badge>
                      {workspace.isArchived && (
                        <Badge variant="warning" size="sm">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Updated {formatDate(workspace.updatedAt)}
                    </span>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 animate-in fade-in duration-200">
            {paginatedWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => navigate(`/workspaces/${workspace.id}`)}
                className="flex items-center justify-between p-5 rounded-2xl border border-slate-900 bg-slate-900/20 hover:bg-slate-900/40 hover:border-indigo-500/40 cursor-pointer transition-all"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-sm font-bold text-white mb-1.5 truncate">{workspace.name}</h3>
                  <p className="text-xs text-slate-400 truncate">
                    {workspace.description || "No description."}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <Badge
                    variant={
                      workspace.visibility === WorkspaceVisibility.PUBLIC ? "success" : "secondary"
                    }
                    size="sm"
                  >
                    {workspace.visibility}
                  </Badge>
                  {workspace.isArchived && (
                    <Badge variant="warning" size="sm">
                      Archived
                    </Badge>
                  )}
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Created {formatDate(workspace.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          title={searchParam ? "No matches found" : "No workspaces"}
          description={
            searchParam
              ? "Refine your search term or adjust the visibility/status filters to find workspaces."
              : "No workspaces available. Get started by creating your first collaborative workspace."
          }
          action={
            searchParam ? (
              <Button size="sm" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsOpen(true)}>
                Create Workspace
              </Button>
            )
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
        />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Pagination
          currentPage={pageParam}
          totalPages={totalPages}
          onPageChange={(p) => updateParams({ page: p })}
        />
      )}

      {/* Create Workspace Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Workspace">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Workspace Name"
            placeholder="e.g. project-x"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Description"
            placeholder="A description of this project workspace"
            error={errors.description?.message}
            {...register("description")}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Visibility
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              {...register("visibility")}
            >
              <option value={WorkspaceVisibility.PRIVATE}>Private (Invite Only)</option>
              <option value={WorkspaceVisibility.PUBLIC}>Public (Read-Only to Guests)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
