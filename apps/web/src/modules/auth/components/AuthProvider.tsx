import { ReactNode } from "react";
import { useAuthStore } from "../store/auth.store.js";
import { useCurrentUser } from "../hooks/useCurrentUser.js";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  // Hook will fetch user context if token is present
  const { isLoading } = useCurrentUser();

  const isInitializing = !!accessToken && !user && isLoading;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="relative flex flex-col items-center">
          {/* Glowing background light */}
          <div className="absolute w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Spinner */}
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
          </div>
          <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase animate-pulse">
            Syncing Session
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
