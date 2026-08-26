import { cn } from "@/lib/cra/cn";

export function BrandMark({ className }: { className?: string }) {
  return <img src="/brand/mark.png" alt="" className={cn("no-outline object-contain", className)} />;
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface shadow-[var(--shadow-border)]",
          compact ? "size-9" : "size-11",
        )}
      >
        <BrandMark className={compact ? "h-6 w-auto" : "h-8 w-auto"} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block font-sans font-semibold tracking-tight text-title", compact ? "text-sm" : "text-base")}>
          {compact ? "CRA" : "Comer Rezar Amar"}
        </span>
        {compact ? null : (
          <span className="block text-xs font-medium uppercase tracking-kicker text-muted">Restaurante</span>
        )}
      </span>
    </div>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo.png"
      alt="Comer Rezar Amar Restaurante"
      className={cn("no-outline mx-auto h-auto w-full max-w-xs object-contain", className)}
    />
  );
}
