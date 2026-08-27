import { createFileRoute } from "@tanstack/react-router";
import { AdminCombosPage } from "@/components/admin-combos-page";

export const Route = createFileRoute("/admin/combos")({ component: AdminCombosPage });
