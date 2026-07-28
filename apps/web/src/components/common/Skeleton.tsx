import { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = ({ className = "", ...props }: SkeletonProps) => {
  return <div className={`animate-pulse rounded bg-slate-800/80 ${className}`} {...props} />;
};
