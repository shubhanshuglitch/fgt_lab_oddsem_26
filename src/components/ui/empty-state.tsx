"use client";

import { type ReactNode, isValidElement } from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

export interface EmptyStateProps {
  icon?: any;
  title: string;
  description?: string;
  action?:
    | ReactNode
    | {
        label: string;
        onClick: () => void;
        variant?: ButtonProps["variant"];
      };
  className?: string;
  children?: ReactNode;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  let iconElement: ReactNode = null;
  if (icon) {
    if (isValidElement(icon)) {
      iconElement = icon;
    } else if (
      typeof icon === "function" ||
      (typeof icon === "object" && icon !== null && ("$$typeof" in icon || "render" in icon))
    ) {
      const IconComp = icon;
      iconElement = <IconComp className="h-6 w-6" />;
    }
  }

  let actionElement: ReactNode = null;
  if (action) {
    if (isValidElement(action)) {
      actionElement = action;
    } else if (typeof action === "object" && "label" in action && "onClick" in action) {
      actionElement = (
        <Button
          variant={action.variant ?? "default"}
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      );
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 p-12 text-center",
        className
      )}
    >
      {iconElement && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {iconElement}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {description && (
          <p className="max-w-md text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {actionElement}
      {children}
    </div>
  );
}

export { EmptyState };
