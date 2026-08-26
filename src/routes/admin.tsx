import { createFileRoute } from "@tanstack/react-router";
import { AdminView } from "@/components/admin-view";
import { getCatalog } from "@/lib/server/catalog";

export const Route = createFileRoute("/admin")({
  loader: () => getCatalog(),
  component: AdminPage,
});

function AdminPage() {
  const catalog = Route.useLoaderData();
  return <AdminView initial={catalog} />;
}
