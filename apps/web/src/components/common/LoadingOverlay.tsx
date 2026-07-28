import { Spinner } from "./Spinner.js";

export interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay = ({ message = "Loading..." }: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 bg-slate-900 border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
        <Spinner size="lg" />
        <span className="text-sm font-semibold text-slate-300 tracking-wide">{message}</span>
      </div>
    </div>
  );
};
