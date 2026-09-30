import { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = ({ className = "", ...props }: SkeletonProps) => {
  return (
    <div className={`animate-pulse rounded bg-surface-container-high/80 ${className}`} {...props} />
  );
};
