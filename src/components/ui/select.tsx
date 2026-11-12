"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";

const selectVariants = cva(
  "flex w-full appearance-none rounded-md border bg-background text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      selectSize: {
        default: "h-10 px-3 py-2 text-sm",
        sm: "h-9 px-3 py-1 text-xs",
        lg: "h-11 px-4 py-2 text-base",
      },
      error: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "border-input",
      },
    },
    defaultVariants: { selectSize: "default", error: false },
  }
);

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, selectSize, error, label, helperText, errorMessage, id, children, ...props },
    ref
  ) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = error || !!errorMessage;

    const select = (
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            selectVariants({ selectSize, error: hasError }),
            "pr-8",
            className
          )}
          ref={ref}
          aria-invalid={hasError || undefined}
          aria-describedby={
            errorMessage
              ? `${selectId}-error`
              : helperText
                ? `${selectId}-helper`
                : undefined
          }
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );

    if (!label && !helperText && !errorMessage) return select;

    return (
      <div className="grid gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium leading-none text-foreground"
          >
            {label}
          </label>
        )}
        {select}
        {errorMessage && (
          <p
            id={`${selectId}-error`}
            className="text-xs text-destructive"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
        {!errorMessage && helperText && (
          <p id={`${selectId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select, selectVariants };
