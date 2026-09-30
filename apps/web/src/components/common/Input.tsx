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
          <label className="text-xs font-semibold text-on-surface-variant tracking-wide uppercase">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-surface border ${
            error
              ? "border-error focus:ring-error"
              : "border-outline focus:ring-primary focus:border-primary"
          } text-on-surface rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface transition-all ${className}`}
          {...props}
        />
        {error && <span className="text-xs font-medium text-error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
