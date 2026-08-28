import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin-page";
import { getAdminCatalog } from "@/lib/cra/fns";

export const Route = createFileRoute("/admin")({
  loader: () => getAdminCatalog(),
  component: Admin,
});

function Admin() {
  const initial = Route.useLoaderData();
  return <AdminPage initial={initial} />;
}
