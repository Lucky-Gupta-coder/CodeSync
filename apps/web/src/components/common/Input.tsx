import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-slate-900 border ${
            error
              ? "border-red-500/80 focus:ring-red-500/80"
              : "border-slate-800 focus:ring-indigo-500"
          } text-slate-150 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all ${className}`}
          {...props}
        />
        {error && <span className="text-xs font-medium text-red-400">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
