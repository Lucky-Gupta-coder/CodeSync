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
    <div className="w-full max-w-md bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:border-primary/40">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">System Status</h2>
        <div className="flex items-center gap-2">
          {isFetching && <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />}
          <span
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              isConnected
                ? "bg-tertiary shadow-[0_0_12px_rgba(14,159,110,0.4)] animate-pulse"
                : "bg-error shadow-[0_0_12px_rgba(220,53,69,0.4)]"
            }`}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Status Banner */}
        <div
          className={`p-4 rounded-xl border transition-all duration-500 ${
            isConnected
              ? "bg-tertiary-container border-tertiary/20 text-on-tertiary-container"
              : "bg-error-container border-error/20 text-on-error-container"
          }`}
        >
          <p className="text-xs uppercase tracking-wider font-semibold opacity-80">
            Connection State
          </p>
          <p className="text-lg font-bold mt-1">
            {isConnected ? "Server Connected" : "Server Offline"}
          </p>
        </div>

        {/* Server Properties */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 space-y-3 text-sm text-on-surface-variant">
          <div className="flex justify-between items-center">
            <span>Environment</span>
            <span className="font-mono text-xs bg-surface-container-high text-on-surface px-2 py-0.5 rounded border border-outline-variant">
              {isConnected ? data?.environment : "N/A"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Database Status</span>
            <span
              className={`font-semibold ${
                isConnected && data?.services?.database === "connected"
                  ? "text-tertiary"
                  : "text-error"
              }`}
            >
              {isConnected ? data?.services?.database : "offline"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Last Checked</span>
            <span className="font-mono text-xs text-on-surface">
              {isConnected && data?.timestamp ? formatDate(data.timestamp) : "N/A"}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2 flex flex-col gap-2">
          {error && (
            <p className="text-xs text-on-error-container text-center font-medium bg-error-container border border-error/30 py-1.5 rounded-lg">
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
