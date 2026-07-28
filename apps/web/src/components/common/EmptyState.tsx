import { ReactNode } from "react";
import { Card } from "./Card.js";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export const EmptyState = ({ title, description, action, icon }: EmptyStateProps) => {
  return (
    <Card className="w-full flex flex-col items-center justify-center text-center p-8 py-12 border-dashed border-slate-800 bg-transparent">
      {icon && <div className="text-slate-500 mb-4">{icon}</div>}
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </Card>
  );
};
