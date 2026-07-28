import { useToastStore } from "../../store/toast.store.js";
import { createPortal } from "react-dom";

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-right-5 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
              : toast.type === "error"
                ? "bg-red-950/90 border-red-500/30 text-red-300"
                : "bg-slate-905/90 border-slate-800 text-slate-300"
          }`}
        >
          <span className="text-sm font-semibold leading-relaxed">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 rounded p-1 hover:bg-slate-800/40 text-current transition-all cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};
