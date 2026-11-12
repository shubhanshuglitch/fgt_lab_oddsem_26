"use client";

import { type ReactNode, isValidElement } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./card";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: any;
  description?: string;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  let iconElement: ReactNode = null;
  if (icon) {
    if (isValidElement(icon)) {
      iconElement = icon;
    } else if (
      typeof icon === "function" ||
      (typeof icon === "object" && icon !== null && ("$$typeof" in icon || "render" in icon))
    ) {
      const IconComp = icon;
      iconElement = <IconComp className="h-5 w-5" />;
    }
  }

  return (
    <Card className={cn("p-4 flex flex-col justify-between", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        {iconElement && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {iconElement}
          </div>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1">{description}</p>
      )}

      {trend && (
        <div className="mt-2.5 flex items-center gap-1 text-[11px]">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          )}
          <span
            className={cn(
              "font-semibold",
              isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {isPositive ? "+" : ""}
            {trend.value}%
          </span>
          {trend.label && (
            <span className="text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}
    </Card>
  );
}

export { StatCard };
