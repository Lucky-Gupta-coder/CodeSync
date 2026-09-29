import { apiClient } from "../../../api/client.js";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

export const executionApi = {
  runCode: async (roomId: string, code: string, language: string): Promise<ExecutionResult> => {
    const { data } = await apiClient.post<ExecutionResult>(`/api/execution/run`, {
      roomId,
      code,
      language,
    });
    return data;
  },
};
