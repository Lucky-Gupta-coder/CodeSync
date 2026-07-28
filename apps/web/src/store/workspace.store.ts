import { create } from "zustand";
import { WorkspaceDTO } from "@codesync/types";

export interface WorkspaceState {
  workspaces: WorkspaceDTO[];
  activeWorkspace: WorkspaceDTO | null;
  loading: boolean;
  setWorkspaces: (workspaces: WorkspaceDTO[]) => void;
  setActiveWorkspace: (workspace: WorkspaceDTO | null) => void;
  setLoading: (loading: boolean) => void;
  clearWorkspaceState: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  loading: false,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
  setLoading: (loading) => set({ loading }),
  clearWorkspaceState: () => set({ workspaces: [], activeWorkspace: null, loading: false }),
}));
