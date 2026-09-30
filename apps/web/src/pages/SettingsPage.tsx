import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../store/ui.store.js";
import { useAuthStore } from "../modules/auth/store/auth.store.js";
import { Card } from "../components/common/Card.js";
import { Button } from "../components/common/Button.js";
import { Badge } from "../components/common/Badge.js";

export const SettingsPage = () => {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
    // Safely clear UI cache preference keys
    sessionStorage.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            Settings
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure appearance, editor interface parameters, and developer preferences
          </p>
        </div>
        <Badge variant="secondary" size="md">
          v1.0.0 IDE
        </Badge>
      </div>

      {/* 1. Appearance Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-23"
            />
          </svg>
          <h3 className="text-lg font-bold text-on-surface tracking-tight">Appearance</h3>
        </div>

        <Card
          title="Color Theme"
          description="Choose your preferred color theme across the entire application interface"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {/* Dark Mode Card */}
            <div
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                theme === "dark"
                  ? "border-primary bg-surface-container ring-2 ring-primary/30"
                  : "border-outline-variant bg-surface hover:bg-surface-container"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700" />
                  <span className="font-bold text-sm text-on-surface">
                    Dark Theme (IDE Default)
                  </span>
                </div>
                {theme === "dark" && (
                  <span className="w-2 h-2 rounded-full bg-primary" title="Active" />
                )}
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span className="text-purple-400">const</span>
                <span className="text-indigo-300">theme</span> ={" "}
                <span className="text-emerald-400">&quot;dark_ide&quot;</span>;
              </div>
              <span className="text-xs text-on-surface-variant">
                Deep dark charcoal &amp; violet accents
              </span>
            </div>

            {/* Light Mode Card */}
            <div
              onClick={() => setTheme("light")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                theme === "light"
                  ? "border-primary bg-surface-container ring-2 ring-primary/30"
                  : "border-outline-variant bg-surface hover:bg-surface-container"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300" />
                  <span className="font-bold text-sm text-on-surface">Light Theme (Notebook)</span>
                </div>
                {theme === "light" && (
                  <span className="w-2 h-2 rounded-full bg-primary" title="Active" />
                )}
              </div>
              <div className="bg-slate-100 p-2.5 rounded border border-slate-300 text-[11px] font-mono text-slate-700 flex items-center justify-between">
                <span className="text-purple-700">const</span>
                <span className="text-indigo-800">theme</span> ={" "}
                <span className="text-emerald-700">&quot;light_notebook&quot;</span>;
              </div>
              <span className="text-xs text-on-surface-variant">
                Warm off-white background & slate text
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Interface Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <h3 className="text-lg font-bold text-on-surface tracking-tight">Interface & Layout</h3>
        </div>

        <Card
          title="Navigation Layout"
          description="Control sidebar visibility and density parameters"
        >
          <div className="flex items-center justify-between py-2 border-b border-outline-variant">
            <div>
              <h4 className="text-sm font-bold text-on-surface">Collapsed Sidebar Navigation</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Keep the left sidebar compact to maximize editor canvas space
              </p>
            </div>
            <Button
              variant={sidebarCollapsed ? "primary" : "outline"}
              size="sm"
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? "Collapsed" : "Expanded"}
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm font-bold text-on-surface">Editor Typography & Layout</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Monaco Editor uses JetBrains Mono with 2-space tabs and line numbering enabled
              </p>
            </div>
            <Badge variant="secondary" size="sm">
              Standard 14px
            </Badge>
          </div>
        </Card>
      </div>

      {/* 3. Account Context Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <h3 className="text-lg font-bold text-on-surface tracking-tight">Account Context</h3>
        </div>

        <Card title="Logged In Account" description="Current active session details">
          {user ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm border border-primary/30">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">{user.name}</h4>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                View Profile Page
              </Button>
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant">No active user profile.</p>
          )}
        </Card>
      </div>

      {/* 4. Danger Zone Section */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-bold text-error tracking-tight">Danger Zone</h3>
        </div>

        <Card className="border-error/30 bg-error/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-on-surface">Sign Out of CodeSync</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                End your active developer session and return to the login screen
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 mt-4 border-t border-outline-variant">
            <div>
              <h4 className="text-sm font-bold text-on-surface">Clear Workspace UI State</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Reset local view cache without removing account token
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearCache}>
              {cacheCleared ? "Cleared!" : "Clear Cache"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
