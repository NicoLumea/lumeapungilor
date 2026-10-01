import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { OrdersPanel } from "@/components/dashboard/OrdersPanel";

export const Route = createFileRoute("/n7q4-v2m9/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const params = useParams({ strict: false }) as { orderId?: string };
  return params.orderId ? <Outlet /> : <OrdersPanel base="/n7q4-v2m9/orders" />;
}
