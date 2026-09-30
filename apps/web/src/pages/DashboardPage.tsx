import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../modules/workspace/services/workspace.service.js";
import { useAuthStore } from "../modules/auth/store/auth.store.js";
import { Card } from "../components/common/Card.js";
import { Badge } from "../components/common/Badge.js";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../components/common/Spinner.js";
import { StatusCard } from "../components/StatusCard.js";

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Fetch all workspaces to calculate dashboard statistics
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces-dashboard"],
    queryFn: () => workspaceApi.getWorkspaces(1, 100, ""),
  });

  const workspaces = data?.data || [];
  const totalCount = data?.pagination?.total || workspaces.length;
  const archivedCount = workspaces.filter((w) => w.isArchived).length;
  const activeCount = totalCount - archivedCount;

  // Get recently updated (top 3)
  const recentlyUpdated = [...workspaces]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-outline-variant p-6 md:p-8 shadow-sm">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
            Welcome back, {user?.name || "Developer"}
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight mb-2">
            Collaborative Developer Workspace
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
            CodeSync is up and running. Access your shared workspaces, coding rooms, and collaborate
            live with your team members.
          </p>
        </div>
      </div>

      {/* Main stats counters */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-outline-variant p-5 bg-surface">
            <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
              Total Workspaces
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-on-surface">{totalCount}</span>
              <span className="text-xs text-muted">created</span>
            </div>
          </Card>
          <Card className="border border-outline-variant p-5 bg-surface">
            <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
              Active Workspaces
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-tertiary">{activeCount}</span>
              <span className="text-xs text-muted">writeable</span>
            </div>
          </Card>
          <Card className="border border-outline-variant p-5 bg-surface">
            <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
              Archived Workspaces
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-warning">{archivedCount}</span>
              <span className="text-xs text-muted">read-only</span>
            </div>
          </Card>
          <Card className="border border-outline-variant p-5 bg-surface">
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Quick Actions
            </span>
            <div className="flex flex-col gap-2 mt-3">
              <button
                onClick={() => navigate("/workspaces")}
                className="text-left text-xs font-semibold text-on-surface-variant hover:text-primary hover:underline cursor-pointer"
              >
                + View & Create Workspace
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="text-left text-xs font-semibold text-on-surface-variant hover:text-primary hover:underline cursor-pointer"
              >
                ⚙️ Adjust Theme Settings
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Main dashboard splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recently Updated list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface tracking-tight">Recently Updated</h3>
            <button
              onClick={() => navigate("/workspaces")}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {isLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-20 bg-surface-container rounded-xl animate-pulse" />
              ))
            ) : recentlyUpdated.length > 0 ? (
              recentlyUpdated.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => navigate(`/workspaces/${ws.id}`)}
                  className="flex items-center justify-between p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    <span className="text-sm font-bold text-on-surface truncate">{ws.name}</span>
                    <span className="text-xs text-on-surface-variant truncate">
                      {ws.description || "No description."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={ws.isArchived ? "warning" : "success"} size="sm">
                      {ws.isArchived ? "Archived" : "Active"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center border border-dashed border-outline-variant rounded-xl text-muted text-xs">
                No workspaces found. Click &quot;View &amp; Create Workspace&quot; to start.
              </div>
            )}
          </div>
        </div>

        {/* Right: Mock Activity Feed timeline */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-on-surface tracking-tight">Recent Activity</h3>
          <div className="border border-outline-variant bg-surface rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-on-surface">System logs connected</span>
                <span className="text-[10px] text-muted mt-0.5">Just now</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1.5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-on-surface">
                  Database verified successfully
                </span>
                <span className="text-[10px] text-muted mt-0.5">10 minutes ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-muted mt-1.5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-on-surface-variant">
                  Welcome to Collaborative Developer Workspace
                </span>
                <span className="text-[10px] text-muted mt-0.5">1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status monitor card */}
      <div className="mt-4">
        <StatusCard />
      </div>
    </div>
  );
};
