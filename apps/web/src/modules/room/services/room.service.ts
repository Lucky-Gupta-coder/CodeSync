import { apiClient } from "../../../api/client.js";
import { RoomDTO, RoomLanguage, RoomStatus } from "@codesync/types";

export interface GetRoomsParams {
  search?: string;
  language?: string;
  status?: string;
  owner?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface GetRoomsResponse {
  data: RoomDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const roomApi = {
  getWorkspaceRooms: async (
    workspaceId: string,
    params?: GetRoomsParams
  ): Promise<GetRoomsResponse> => {
    const response = await apiClient.get(`/api/workspaces/${workspaceId}/rooms`, { params });
    return {
      data: response.data.data || [],
      pagination: response.data.pagination || {
        total: (response.data.data || []).length,
        page: 1,
        limit: 10,
        pages: 1,
      },
    };
  },

  getRoomById: async (id: string): Promise<RoomDTO> => {
    const response = await apiClient.get(`/api/rooms/${id}`);
    return response.data.data;
  },

  createRoom: async (
    workspaceId: string,
    data: { name: string; description?: string; language: RoomLanguage }
  ): Promise<RoomDTO> => {
    const response = await apiClient.post(`/api/workspaces/${workspaceId}/rooms`, data);
    return response.data.data;
  },

  updateRoom: async (
    id: string,
    data: { name?: string; description?: string; language?: RoomLanguage; status?: RoomStatus }
  ): Promise<RoomDTO> => {
    const response = await apiClient.patch(`/api/rooms/${id}`, data);
    return response.data.data;
  },

  deleteRoom: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/rooms/${id}`);
    return response.data;
  },

  archiveRoom: async (id: string): Promise<RoomDTO> => {
    const response = await apiClient.post(`/api/rooms/${id}/archive`);
    return response.data.data;
  },

  restoreRoom: async (id: string): Promise<RoomDTO> => {
    const response = await apiClient.post(`/api/rooms/${id}/restore`);
    return response.data.data;
  },
};
