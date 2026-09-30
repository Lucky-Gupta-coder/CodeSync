import { ReactNode } from "react";
import { useUIStore, UIState } from "../../../store/ui.store.js";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const theme = useUIStore((state: UIState) => state.theme);
  const setTheme = useUIStore((state: UIState) => state.setTheme);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-on-surface relative overflow-x-hidden transition-colors duration-200">
      {/* Background Subtle Tech Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--cs-outline-variant)_1px,transparent_1px),linear-gradient(to_bottom,var(--cs-outline-variant)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Navigation Bar */}
      <header className="relative z-20 border-b border-outline-variant/60 bg-surface/60 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-mono font-bold text-on-primary text-sm shadow-md">
            &lt;/&gt;
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-on-surface">CodeSync</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center bg-surface-container p-1 rounded-lg border border-outline-variant">
            <button
              onClick={() => setTheme("dark")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                theme === "dark"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>🌙 Dark</span>
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                theme === "light"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>☀️ Light</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Column: Product Introduction & Interactive IDE Illustration */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Top Tag Pill */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-mono font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Real-Time Collaborative Development Workspace
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-on-surface tracking-tight leading-[1.1]">
                Code together.
                <br />
                <span className="text-primary bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent">
                  Build together.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed mt-4">
                Real-time collaborative development workspace. Join developers building, debugging,
                and collaborating together in one workspace.
              </p>
            </div>

            {/* Feature Indicators (4 compact items) */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface shadow-sm">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <span>Collaborative code editor</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface shadow-sm">
                <svg
                  className="w-4 h-4 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>Real-time chat</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface shadow-sm">
                <svg
                  className="w-4 h-4 text-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span>Shared whiteboard</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface shadow-sm">
                <svg
                  className="w-4 h-4 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Integrated terminal</span>
              </div>
            </div>

            {/* Collaborative IDE Visual (Stitch Mockup Window) */}
            <div className="mt-2 rounded-2xl border border-outline-variant bg-surface/90 backdrop-blur-xl shadow-2xl overflow-hidden hidden sm:block">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container border-b border-outline-variant text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-on-surface-variant pl-2">
                    <span className="px-2 py-0.5 rounded bg-surface border border-outline-variant text-primary font-semibold flex items-center gap-1">
                      &lt;/&gt; workspace.ts
                    </span>
                    <span className="px-2 py-0.5 rounded hover:bg-surface-container-high transition-colors">
                      🎨 whiteboard.canvas
                    </span>
                    <span className="px-2 py-0.5 rounded hover:bg-surface-container-high transition-colors">
                      💬 chat.dock
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[9px]"
                    title="Developer 1"
                  >
                    D1
                  </div>
                  <div
                    className="w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-[9px]"
                    title="Developer 2"
                  >
                    D2
                  </div>
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse ml-1" />
                </div>
              </div>

              {/* Window Code & Widgets Split */}
              <div className="grid grid-cols-12 text-xs font-mono min-h-[210px]">
                {/* Code Window */}
                <div className="col-span-8 p-4 bg-surface border-r border-outline-variant relative overflow-hidden">
                  <div className="flex gap-4">
                    <div className="text-muted text-right select-none flex flex-col gap-1 text-[11px]">
                      <span>18</span>
                      <span>19</span>
                      <span>20</span>
                      <span>21</span>
                      <span>22</span>
                      <span>23</span>
                      <span>24</span>
                      <span>25</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1 text-[11px] leading-relaxed overflow-x-auto">
                      <div>
                        <span className="text-purple-400 font-semibold">import</span> &#123;
                        SessionStore, Broadcast &#125;{" "}
                        <span className="text-purple-400 font-semibold">from</span>{" "}
                        <span className="text-emerald-400">&apos;@codesync/core&apos;</span>;
                      </div>
                      <div className="text-muted italic">
                        {"// Real-time collaborative workspace transport"}
                      </div>
                      <div className="relative">
                        <span className="text-purple-400 font-semibold">export async function</span>{" "}
                        <span className="text-blue-400 font-bold">syncSession</span>(channelId:{" "}
                        <span className="text-amber-400">string</span>) &#123;
                        {/* Cursor 1 */}
                        <span className="absolute -top-4 right-6 bg-primary text-on-primary text-[9px] font-sans font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1">
                          Developer 1
                        </span>
                      </div>
                      <div className="pl-4">
                        <span className="text-purple-400 font-semibold">const</span> mesh ={" "}
                        <span className="text-purple-400">await</span> SessionStore.
                        <span className="text-blue-400">acquire</span>(channelId);
                      </div>
                      <div className="pl-4 bg-primary/10 rounded px-1 relative">
                        <span className="text-purple-400">await</span> mesh.
                        <span className="text-blue-400">broadcastEvent</span>(&#123; type:{" "}
                        <span className="text-emerald-400">&apos;cursor-sync&apos;</span> &#125;);
                        {/* Cursor 2 */}
                        <span className="absolute -top-4 right-2 bg-secondary text-on-secondary text-[9px] font-sans font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1">
                          Developer 2
                        </span>
                      </div>
                      <div className="pl-4">
                        <span className="text-purple-400">return</span> mesh.
                        <span className="text-blue-400">getSnapshotState</span>();
                      </div>
                      <div>&#125;</div>
                    </div>
                  </div>
                </div>

                {/* Right Side Widgets */}
                <div className="col-span-4 bg-surface-container p-3 flex flex-col justify-between gap-3">
                  {/* Architecture Box */}
                  <div className="p-2.5 rounded-lg bg-surface border border-outline-variant flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-muted tracking-wider uppercase">
                      COLLABORATIVE SYNC
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-on-surface py-1 px-1 bg-surface-container rounded border border-outline-variant">
                      <span className="px-1 py-0.5 bg-primary/20 text-primary rounded font-bold">
                        Store
                      </span>
                      <span className="text-muted">➔</span>
                      <span className="px-1 py-0.5 bg-secondary/20 text-secondary rounded font-bold">
                        Mesh
                      </span>
                    </div>
                  </div>

                  {/* Dock Chat Box */}
                  <div className="p-2.5 rounded-lg bg-surface border border-outline-variant flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted tracking-wider uppercase">
                      <span>DOCK CHAT</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    </div>
                    <div className="flex flex-col gap-1 text-[10px]">
                      <p className="text-on-surface-variant">
                        <span className="text-primary font-bold">Developer 1:</span> check line 24
                      </p>
                      <p className="text-on-surface-variant">
                        <span className="text-secondary font-bold">Developer 2:</span> looks good
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Window Bottom Status Bar */}
              <div className="px-4 py-2 bg-surface-container border-t border-outline-variant flex items-center justify-between text-[11px] font-mono text-muted">
                <div className="flex items-center gap-2">
                  <span className="text-tertiary font-bold">➔ codesync run session</span>
                </div>
                <span>UTF-8 TypeScript</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card Wrapper */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-outline-variant/60 bg-surface/60 backdrop-blur-md px-6 py-3 text-[11px] font-mono text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>&copy; {new Date().getFullYear()} CodeSync</div>
      </footer>
    </div>
  );
};
