import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer duration-200";

  const variants = {
    primary: "bg-primary hover:bg-primary-fixed-dim text-on-primary shadow-md focus:ring-primary",
    secondary:
      "bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant focus:ring-primary",
    outline:
      "border border-outline-variant text-on-surface hover:bg-surface-container-high hover:text-on-surface focus:ring-primary",
    danger: "bg-error hover:bg-error/90 text-on-error shadow-md focus:ring-error",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};
