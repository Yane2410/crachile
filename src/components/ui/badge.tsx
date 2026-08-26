import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "muted",
  ...props
}: ComponentProps<"span"> & { tone?: "muted" | "primary" | "heart" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "muted" && "bg-surface-2 text-muted",
        tone === "primary" && "bg-primary/15 text-heart",
        tone === "heart" && "bg-heart/10 text-heart",
        className,
      )}
      {...props}
    />
  );
}
