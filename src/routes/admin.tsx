import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin-page";
import { AdminProductOrderPanel } from "@/components/admin-product-order-panel";
import { getCatalog } from "@/lib/cra/fns";

export const Route = createFileRoute("/admin")({
  loader: () => getCatalog(),
  component: Admin,
});

function Admin() {
  const initial = Route.useLoaderData();
  return <><AdminPage initial={initial} /><div className="mx-auto max-w-4xl px-4 pb-10"><AdminProductOrderPanel catalog={initial} /></div></>;
}
