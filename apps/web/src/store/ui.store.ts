import { create } from "zustand";

export interface UIState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme") as "light" | "dark";
    const theme = saved === "light" || saved === "dark" ? saved : "dark";
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    return theme;
  }
  return "dark";
};

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      if (typeof window !== "undefined") {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
      }
      return { theme: newTheme };
    });
  },
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
