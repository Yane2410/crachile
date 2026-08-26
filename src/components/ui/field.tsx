import type { ComponentProps } from "react";
import { cn } from "@/lib/cra/cn";

export function TextField({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[var(--radius-md)] bg-surface px-3.5 text-base text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-semibold text-fg", className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-[var(--radius-md)] bg-surface px-3.5 py-3 text-base text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    />
  );
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-surface-2 p-1">
      <button
        type="button"
        aria-label="Quitar"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex size-8 items-center justify-center rounded-full text-fg disabled:opacity-40"
      >
        −
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Sumar uno"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex size-8 items-center justify-center rounded-full text-fg disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
