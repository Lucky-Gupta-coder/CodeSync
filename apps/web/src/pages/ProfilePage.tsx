import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../modules/auth/store/auth.store.js";
import {
  workspaceApi,
  GetWorkspacesResponse,
} from "../modules/workspace/services/workspace.service.js";
import { Card } from "../components/common/Card.js";
import { Avatar } from "../components/common/Avatar.js";
import { Badge } from "../components/common/Badge.js";
import { Button } from "../components/common/Button.js";

function useWorkspacesSummary(user: { id: string } | null) {
  const [data, setData] = useState<GetWorkspacesResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setIsLoading(true);
    workspaceApi
      .getWorkspaces(1, 200)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  return { data, isLoading };
}

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);

  // Fetch real workspace data for developer statistics safely
  const { data: workspacesResponse, isLoading: isLoadingWorkspaces } = useWorkspacesSummary(user);

  const workspaces = workspacesResponse?.data || [];
  const ownedCount = user
    ? workspaces.filter(
        (w) =>
          w.owner === user.id ||
          (typeof w.owner === "object" && (w.owner as { id?: string })?.id === user.id)
      ).length
    : 0;
  const joinedCount = Math.max(0, workspaces.length - ownedCount);

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-on-surface-variant">No user session found. Please log in.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in pb-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">Profile</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage your account identity, security context, and workspace access
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="primary" size="md">
            ● Active Developer
          </Badge>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Identity Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="flex flex-col items-center text-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20 border-b border-outline-variant" />

            <div className="relative mt-4 mb-3">
              <Avatar
                name={user.name}
                size="lg"
                className="w-20 h-20 text-3xl ring-4 ring-primary/20 shadow-xl"
              />
              <span
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-surface"
                title="Online"
              />
            </div>

            <h3 className="text-xl font-bold text-on-surface tracking-tight">{user.name}</h3>
            <p className="text-sm text-on-surface-variant truncate max-w-full px-2 mb-3">
              {user.email}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="primary" size="sm">
                {user.role || "Member"}
              </Badge>
              <Badge variant="secondary" size="sm">
                JWT Auth
              </Badge>
            </div>

            <p className="text-xs text-on-surface-variant bg-surface-container p-3 rounded-lg border border-outline-variant w-full mb-4">
              &quot;Your CodeSync developer profile&quot;
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full text-error hover:bg-error/10 border-error/30 hover:border-error"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out Account
            </Button>
          </Card>

          {/* Account Status Card */}
          <Card title="Account Status" description="Authentication details">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-outline-variant">
                <span className="text-xs text-on-surface-variant">Account Status</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-outline-variant">
                <span className="text-xs text-on-surface-variant">Role Type</span>
                <span className="text-xs font-mono text-on-surface">{user.role || "Member"}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-on-surface-variant">Security Protocol</span>
                <span className="text-xs font-mono text-on-surface">Bearer JWT</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Account Details & Workspaces */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Account Information Card */}
          <Card title="Account Information" description="Personal profile details and identifiers">
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-3 border-b border-outline-variant items-center">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Full Name
                </span>
                <span className="md:col-span-2 text-sm font-medium text-on-surface">
                  {user.name} &bull; Primary
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-3 border-b border-outline-variant items-center">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Email Address
                </span>
                <span className="md:col-span-2 text-sm font-medium text-on-surface truncate">
                  {user.email}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-3 border-b border-outline-variant items-center">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  User ID
                </span>
                <div className="md:col-span-2 flex items-center gap-2 overflow-hidden">
                  <code className="text-xs font-mono bg-surface-container px-2.5 py-1 rounded border border-outline-variant text-primary truncate max-w-[240px]">
                    {user.id}
                  </code>
                  <button
                    onClick={handleCopyId}
                    className="text-xs px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    title="Copy User ID"
                  >
                    {copiedId ? (
                      <>
                        <svg
                          className="w-3.5 h-3.5 text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-3 border-b border-outline-variant items-center">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Account Role
                </span>
                <div className="md:col-span-2">
                  <Badge variant="primary" size="sm">
                    {user.role || "Member"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-3 items-center">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Session Type
                </span>
                <span className="md:col-span-2 text-xs text-on-surface-variant font-mono">
                  Active Session
                </span>
              </div>
            </div>
          </Card>

          {/* Workspace Overview Section */}
          <Card
            title="Workspace Overview"
            description="Summary of your collaborative environment access"
          >
            {isLoadingWorkspaces ? (
              <div className="py-6 text-center text-sm text-on-surface-variant">
                Loading workspace statistics...
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant text-center">
                    <span className="text-2xl font-black text-primary">{workspaces.length}</span>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">Workspaces</p>
                  </div>
                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant text-center">
                    <span className="text-2xl font-black text-secondary">{ownedCount}</span>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">Owned</p>
                  </div>
                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant text-center">
                    <span className="text-2xl font-black text-tertiary">{joinedCount}</span>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">Joined</p>
                  </div>
                </div>

                {workspaces.length > 0 ? (
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
                      Recent Workspaces
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {workspaces.slice(0, 5).map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => navigate(`/workspaces/${ws.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-semibold truncate max-w-[140px]">{ws.name}</span>
                        </button>
                      ))}
                      {workspaces.length > 5 && (
                        <button
                          onClick={() => navigate("/workspaces")}
                          className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
                        >
                          +{workspaces.length - 5} more
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant mt-1">
                    No active workspaces created yet. Navigate to Workspaces to get started.
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Security & Password Note */}
          <Card
            title="Account Security"
            description="Authentication method and security parameters"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Password Management</h4>
                    <p className="text-[11px] text-on-surface-variant">
                      Password credentials are securely managed by the backend authentication
                      provider.
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" size="sm">
                  Managed
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Active Session Token</h4>
                    <p className="text-[11px] text-on-surface-variant">
                      Signed JSON Web Token (JWT) issued and validated on API calls.
                    </p>
                  </div>
                </div>
                <Badge variant="primary" size="sm">
                  Verified
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
