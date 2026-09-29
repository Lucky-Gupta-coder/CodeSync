import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size = "md", loading, className = "", ...props }, ref) => {
    const baseStyle =
      "inline-flex items-center justify-center font-body-sm rounded transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.99] gap-2";

    const variants = {
      primary: "bg-primary-container hover:bg-primary-fixed-dim text-on-primary shadow-md",
      secondary: "bg-surface-container hover:bg-surface-container-high text-on-surface",
      danger: "bg-error hover:bg-error/90 text-on-error shadow-md",
      outline:
        "bg-transparent hover:bg-surface-container-high text-outline hover:text-on-surface border border-outline-variant",
      ghost:
        "bg-transparent hover:bg-surface-container-high text-outline hover:text-on-surface border-transparent",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs h-7 font-label-sm",
      md: "px-4 py-2 text-sm h-9",
      lg: "px-5 py-2.5 text-base h-10",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
