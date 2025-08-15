import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = "No data",
  description,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      data-testid="empty-state"
    >
      {icon && (
        <div className="mb-4 text-muted-foreground" data-testid="empty-icon">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold" data-testid="empty-title">
        {title}
      </h3>
      {description && (
        <p className="mb-4 text-sm text-muted-foreground max-w-md" data-testid="empty-description">
          {description}
        </p>
      )}
      {action && (
        <div data-testid="empty-action">
          {action}
        </div>
      )}
    </div>
  );
}