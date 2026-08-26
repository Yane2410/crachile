import { cn } from "@/lib/utils";

export function CraMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/mark.png"
      alt=""
      className={cn("no-outline object-contain", className)}
    />
  );
}

export function CraWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface shadow-[var(--shadow-border)]">
        <CraMark className="h-9 w-auto" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block font-display text-[1.05rem] font-semibold tracking-tight text-fg">
          Comer Rezar Amar
        </span>
        {!compact ? (
          <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-heart">
            Restaurante
          </span>
        ) : (
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            CRA
          </span>
        )}
      </span>
    </div>
  );
}

export function CraLogoFull({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo.png"
      alt="Comer Rezar Amar Restaurante"
      className={cn("no-outline mx-auto h-auto w-full max-w-xs object-contain", className)}
    />
  );
}
