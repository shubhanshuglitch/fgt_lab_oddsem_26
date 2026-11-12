"use client";

import {
  forwardRef,
  useState,
  useEffect,
  useRef,
  type InputHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Called with the debounced search value */
  onSearch?: (value: string) => void;
  /** Also expose raw onChange */
  onChange?: (value: string) => void;
  /** Debounce delay in ms (default 300) */
  debounceMs?: number;
  /** Controlled value */
  value?: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      onSearch,
      onChange,
      debounceMs = 300,
      value: controlledValue,
      placeholder = "Search…",
      ...props
    },
    ref
  ) => {
    const [internal, setInternal] = useState(controlledValue ?? "");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync controlled value
    useEffect(() => {
      if (controlledValue !== undefined) setInternal(controlledValue);
    }, [controlledValue]);

    // Debounce
    useEffect(() => {
      if (!onSearch) return;
      timerRef.current = setTimeout(() => onSearch(internal), debounceMs);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [internal, debounceMs, onSearch]);

    const handleChange = (val: string) => {
      setInternal(val);
      onChange?.(val);
    };

    return (
      <div className={cn("relative", className)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={ref}
          type="search"
          value={internal}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={typeof placeholder === "string" ? placeholder : "Search"}
          {...props}
        />
        {internal && (
          <button
            type="button"
            onClick={() => handleChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
