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
      className={`rounded-2xl border border-slate-800/85 bg-slate-900/40 backdrop-blur-xl p-6 transition-all ${
        onClick
          ? "hover:border-indigo-500/50 hover:bg-slate-900/60 cursor-pointer shadow-lg hover:shadow-indigo-500/5"
          : ""
      } ${className}`}
    >
      {title &&
        (typeof title === "string" ? (
          <h3 className="text-lg font-bold text-white mb-1 tracking-tight">{title}</h3>
        ) : (
          title
        ))}
      {description && <p className="text-sm text-slate-400 mb-4 line-clamp-2">{description}</p>}
      <div className="text-slate-300">{children}</div>
      {footer && (
        <div className="mt-4 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
