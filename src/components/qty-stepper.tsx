import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Quitar"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="size-4" />
      </Button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Agregar"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
