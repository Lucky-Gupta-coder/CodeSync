import { apiClient } from "../../../api/client.js";
import { RoomDTO, RoomLanguage, RoomStatus } from "@codesync/types";

export const roomApi = {
  getWorkspaceRooms: async (workspaceId: string): Promise<RoomDTO[]> => {
    const response = await apiClient.get(`/api/workspaces/${workspaceId}/rooms`);
    return response.data.data;
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
