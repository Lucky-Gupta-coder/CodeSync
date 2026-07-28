import { apiClient } from "../../../api/client.js";
import { WorkspaceDTO, WorkspaceVisibility } from "@codesync/types";

export interface GetWorkspacesResponse {
  success: boolean;
  data: WorkspaceDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const workspaceApi = {
  getWorkspaces: async (page = 1, limit = 6, search = ""): Promise<GetWorkspacesResponse> => {
    const response = await apiClient.get("/api/workspaces", {
      params: { page, limit, search },
    });
    return response.data;
  },

  getWorkspaceById: async (id: string): Promise<WorkspaceDTO> => {
    const response = await apiClient.get(`/api/workspaces/${id}`);
    return response.data.data;
  },

  createWorkspace: async (data: {
    name: string;
    description?: string;
    visibility: WorkspaceVisibility;
  }): Promise<WorkspaceDTO> => {
    const response = await apiClient.post("/api/workspaces", data);
    return response.data.data;
  },

  updateWorkspace: async (
    id: string,
    data: { name?: string; description?: string; visibility?: WorkspaceVisibility }
  ): Promise<WorkspaceDTO> => {
    const response = await apiClient.patch(`/api/workspaces/${id}`, data);
    return response.data.data;
  },

  deleteWorkspace: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/workspaces/${id}`);
    return response.data;
  },

  archiveWorkspace: async (id: string): Promise<WorkspaceDTO> => {
    const response = await apiClient.post(`/api/workspaces/${id}/archive`);
    return response.data.data;
  },

  restoreWorkspace: async (id: string): Promise<WorkspaceDTO> => {
    const response = await apiClient.post(`/api/workspaces/${id}/restore`);
    return response.data.data;
  },
};
