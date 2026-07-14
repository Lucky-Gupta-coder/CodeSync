import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client.js";
import { APP_CONFIG } from "@codesync/config";
import { HealthCheckResponse } from "@codesync/types";
import { formatDate } from "@codesync/utils";
import { Button } from "@codesync/ui";

const fetchHealth = async (): Promise<HealthCheckResponse> => {
  const { data } = await apiClient.get<HealthCheckResponse>(APP_CONFIG.healthEndpoint);
  return data;
};

export const StatusCard = () => {
  const { data, status, error, refetch, isFetching } = useQuery<HealthCheckResponse>({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 3000,
    retry: 1,
  });

  const isConnected = status === "success" && data?.status === "ok";

  return (
    <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:border-slate-700/80">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight text-white">System Status</h2>
        <div className="flex items-center gap-2">
          {isFetching && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />}
          <span
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              isConnected
                ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse"
                : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
            }`}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Status Banner */}
        <div
          className={`p-4 rounded-xl border transition-all duration-500 ${
            isConnected
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/5 border-rose-500/20 text-rose-400"
          }`}
        >
          <p className="text-xs uppercase tracking-wider font-semibold opacity-70">
            Connection State
          </p>
          <p className="text-lg font-bold mt-1">
            {isConnected ? "Server Connected" : "Server Offline"}
          </p>
        </div>

        {/* Server Properties */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 space-y-3 text-sm text-slate-400">
          <div className="flex justify-between items-center">
            <span>Environment</span>
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              {isConnected ? data?.environment : "N/A"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Database Status</span>
            <span
              className={`font-semibold ${
                isConnected && data?.services?.database === "connected"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {isConnected ? data?.services?.database : "offline"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Last Checked</span>
            <span className="font-mono text-xs">
              {isConnected && data?.timestamp ? formatDate(data.timestamp) : "N/A"}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2 flex flex-col gap-2">
          {error && (
            <p className="text-xs text-rose-500/90 text-center font-medium bg-rose-950/20 border border-rose-900/30 py-1.5 rounded-lg">
              Failed to connect: {error.message}
            </p>
          )}

          <Button
            variant={isConnected ? "outline" : "primary"}
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-full text-center"
          >
            {isFetching ? "Checking..." : "Recheck Status"}
          </Button>
        </div>
      </div>
    </div>
  );
};
