import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-heart" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-xl font-semibold">Algo salió mal</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {error.message || "Ocurrió un error inesperado. Recarga la página."}
      </p>
    </main>
  );
}
