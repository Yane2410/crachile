import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin-page";
import { getCatalog } from "@/lib/cra/fns";

export const Route = createFileRoute("/admin")({
  loader: () => getCatalog(),
  component: Admin,
});

function Admin() {
  const initial = Route.useLoaderData();
  return <AdminPage initial={initial} />;
}
