import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusCard } from "./components/StatusCard.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950">
        {/* Decorative background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

        {/* Header */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 border-b border-slate-900 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
              CS
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              CodeSync{" "}
              <span className="text-indigo-500 text-xs font-semibold uppercase tracking-wider ml-1 bg-indigo-500/10 px-2 py-0.5 rounded">
                Core
              </span>
            </span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            GitHub
          </a>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
          <div className="text-center max-w-xl mb-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Collaborative Developer Workspace
            </h1>
            <p className="text-base text-slate-400">
              Establishing the foundations for real-time collaboration, code execution, whiteboard
              sharing, and rich communications.
            </p>
          </div>

          <StatusCard />
        </main>

        {/* Footer */}
        <footer className="w-full text-center py-6 text-xs text-slate-600 border-t border-slate-900 relative z-10">
          &copy; {new Date().getFullYear()} CodeSync Monorepo. Built for enterprise performance and
          scale.
        </footer>
      </div>
    </QueryClientProvider>
  );
}
