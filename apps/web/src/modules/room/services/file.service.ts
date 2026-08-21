import { apiClient } from "../../../api/client.js";
import { FileNodeDTO } from "@codesync/types";
import { FileCreateInput, FileUpdateInput } from "@codesync/validators";

export const fileApi = {
  getRoomFiles: async (roomId: string): Promise<FileNodeDTO[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: FileNodeDTO[] }>(
      `/api/rooms/${roomId}/files`
    );
    return data.data;
  },

  createFile: async (roomId: string, input: FileCreateInput): Promise<FileNodeDTO> => {
    const { data } = await apiClient.post<{ success: boolean; data: FileNodeDTO }>(
      `/api/rooms/${roomId}/files`,
      input
    );
    return data.data;
  },

  updateFile: async (
    roomId: string,
    fileId: string,
    input: FileUpdateInput
  ): Promise<FileNodeDTO> => {
    const { data } = await apiClient.patch<{ success: boolean; data: FileNodeDTO }>(
      `/api/rooms/${roomId}/files/${fileId}`,
      input
    );
    return data.data;
  },

  deleteFile: async (roomId: string, fileId: string): Promise<void> => {
    await apiClient.delete(`/api/rooms/${roomId}/files/${fileId}`);
  },
};
