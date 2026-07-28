import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../modules/workspace/services/workspace.service.js";
import { WorkspaceVisibility } from "@codesync/types";
import { WorkspaceCreateSchema } from "@codesync/validators";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../components/common/Button.js";
import { Card } from "../components/common/Card.js";
import { Badge } from "../components/common/Badge.js";
import { Input } from "../components/common/Input.js";
import { Modal } from "../components/common/Modal.js";
import { SearchBar } from "../components/common/SearchBar.js";
import { Pagination } from "../components/common/Pagination.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { Skeleton } from "../components/common/Skeleton.js";
import { useNavigate } from "react-router-dom";

type CreateWorkspaceInput = z.input<typeof WorkspaceCreateSchema>;

export const WorkspacesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch workspaces list
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces", page, debouncedSearch],
    queryFn: () => workspaceApi.getWorkspaces(page, 6, debouncedSearch),
  });

  // Create workspace mutation
  const createMutation = useMutation({
    mutationFn: workspaceApi.createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setIsOpen(false);
      reset();
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

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-1">Workspaces</h2>
          <p className="text-sm text-slate-400">Manage your collaborative coding workspaces</p>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          New Workspace
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search workspaces..." />
      </div>

      {/* Main Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((workspace) => (
            <Card
              key={workspace.id}
              title={workspace.name}
              description={workspace.description}
              onClick={() => navigate(`/workspaces/${workspace.id}`)}
              footer={
                <div className="w-full flex items-center justify-between">
                  <Badge
                    variant={
                      workspace.visibility === WorkspaceVisibility.PUBLIC ? "success" : "secondary"
                    }
                    size="sm"
                  >
                    {workspace.visibility}
                  </Badge>
                  {workspace.isArchived && (
                    <Badge variant="danger" size="sm">
                      Archived
                    </Badge>
                  )}
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No workspaces found"
          description="Create your first collaborative workspace to start coding with team members in real-time."
          action={
            <Button size="sm" onClick={() => setIsOpen(true)}>
              Create Workspace
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
        />
      )}

      {/* Pagination */}
      {data && (
        <Pagination currentPage={page} totalPages={data.pagination.pages} onPageChange={setPage} />
      )}

      {/* Create Workspace Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Workspace">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="workspace-name"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Description"
            placeholder="A brief description of this workspace"
            error={errors.description?.message}
            {...register("description")}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Visibility
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all cursor-pointer"
              {...register("visibility")}
            >
              <option value={WorkspaceVisibility.PRIVATE}>Private (Invite Only)</option>
              <option value={WorkspaceVisibility.PUBLIC}>Public (Read-Only to Guests)</option>
            </select>
            {errors.visibility && (
              <span className="text-xs font-medium text-red-400">{errors.visibility.message}</span>
            )}
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
