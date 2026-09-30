import { ReactNode } from "react";

export interface CardProps {
  title?: string | ReactNode;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = ({
  title,
  description,
  children,
  footer,
  className = "",
  onClick,
}: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-outline-variant bg-surface p-6 shadow-sm transition-all text-on-surface ${
        onClick ? "hover:border-primary/40 hover:bg-surface-container cursor-pointer shadow-md" : ""
      } ${className}`}
    >
      {title &&
        (typeof title === "string" ? (
          <h3 className="text-lg font-bold text-on-surface mb-1 tracking-tight">{title}</h3>
        ) : (
          title
        ))}
      {description && (
        <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{description}</p>
      )}
      <div className="text-on-surface">{children}</div>
      {footer && (
        <div className="mt-4 border-t border-outline-variant pt-4 flex items-center justify-between text-xs text-on-surface-variant">
          {footer}
        </div>
      )}
    </div>
  );
};
