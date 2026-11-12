"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "flex w-full rounded-md border bg-background text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      inputSize: {
        default: "h-10 px-3 py-2 text-sm",
        sm: "h-9 px-3 py-1 text-xs",
        lg: "h-11 px-4 py-2 text-base",
      },
      hasErrorVariant: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "border-input",
      },
    },
    defaultVariants: { inputSize: "default", hasErrorVariant: false },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    Omit<VariantProps<typeof inputVariants>, "hasErrorVariant"> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  error?: string | boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputSize,
      error,
      label,
      helperText,
      errorMessage,
      startIcon,
      endIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = !!error || !!errorMessage;
    const resolvedErrorMessage = typeof error === "string" ? error : errorMessage;

    const input = (
      <div className="relative">
        {startIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            inputVariants({ inputSize, hasErrorVariant: hasError }),
            startIcon && "pl-9",
            endIcon && "pr-9",
            className
          )}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={
            hasError
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          {...props}
        />
        {endIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {endIcon}
          </span>
        )}
      </div>
    );

    if (!label && !helperText && !resolvedErrorMessage) {
      return input;
    }

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-foreground flex items-center justify-between"
          >
            <span>{label}</span>
            {props.required && <span className="text-destructive">*</span>}
          </label>
        )}
        {input}
        {hasError && resolvedErrorMessage ? (
          <p id={`${inputId}-error`} className="text-xs text-destructive">
            {resolvedErrorMessage}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
