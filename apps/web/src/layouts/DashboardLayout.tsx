import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../modules/auth/store/auth.store.js";
import { useUIStore } from "../store/ui.store.js";
import { Avatar } from "../components/common/Avatar.js";
import { useState } from "react";

export const DashboardLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
          />
        </svg>
      ),
    },
    {
      to: "/workspaces",
      label: "Workspaces",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      to: "/profile",
      label: "Profile",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      to: "/settings",
      label: "Settings",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  const getScreenTitle = () => {
    const current = navLinks.find((l) => location.pathname.startsWith(l.to));
    return current ? current.label : "CodeSync";
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-900 bg-slate-950 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-900">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30 shrink-0">
              CS
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-bold tracking-tight text-white animate-fade-in whitespace-nowrap">
                CodeSync
              </span>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-900 ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/15"
                    : "text-slate-400 hover:text-white"
                }`
              }
            >
              <span className="shrink-0">{link.icon}</span>
              {!sidebarCollapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info footer */}
        <div className="border-t border-slate-900 p-4">
          <div className="flex items-center justify-between gap-3 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
              <Avatar name={user?.name || "User"} size="sm" />
              {!sidebarCollapsed && (
                <div className="flex flex-col overflow-hidden max-w-[120px]">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {user?.name || "User"}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {user?.email || "user@example.com"}
                  </span>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 rounded p-1 transition-all cursor-pointer"
                title="Logout"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative flex flex-col w-64 bg-slate-950 border-r border-slate-900 animate-slide-in-left duration-250">
            <div className="flex h-16 items-center px-4 border-b border-slate-900 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
                  CS
                </div>
                <span className="text-lg font-bold tracking-tight text-white">CodeSync</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav
              className="flex-1 px-2 py-4 flex flex-col gap-1"
              onClick={() => setMobileOpen(false)}
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-900 ${
                      isActive
                        ? "bg-indigo-600/10 text-indigo-400"
                        : "text-slate-400 hover:text-white"
                    }`
                  }
                >
                  {link.icon}
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-slate-900 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name || "User"} size="sm" />
                <div className="flex flex-col max-w-[120px]">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">{user?.email}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main container wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur flex items-center justify-between px-4 md:px-6 relative z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden md:block text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarCollapsed ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 19l-7-7 7-7M19 19l-7-7 7-7"
                  />
                )}
              </svg>
            </button>

            <h1 className="text-base font-bold text-white md:text-lg pl-1">{getScreenTitle()}</h1>
          </div>

          {/* Theme toggler and user info */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-2 border-l border-slate-900 pl-4">
              <Avatar name={user?.name || "User"} size="sm" />
              <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Nested child views content area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
