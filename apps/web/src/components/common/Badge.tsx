import { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  size?: "sm" | "md";
}

export const Badge = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: BadgeProps) => {
  const baseStyle = "inline-flex items-center font-semibold rounded-full tracking-wider uppercase";

  const variants = {
    primary: "bg-primary-fixed text-on-primary-fixed-variant border border-primary/20",
    secondary: "bg-surface-container-high text-on-surface-variant border border-outline-variant",
    success: "bg-tertiary-container text-on-tertiary-container border border-tertiary/20",
    danger: "bg-error-container text-on-error-container border border-error/20",
    warning: "bg-warning-container text-on-warning border border-warning/20",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
};
