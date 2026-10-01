import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailPanel } from "@/components/dashboard/OrderDetailPanel";

export const Route = createFileRoute("/n7q4-v2m9/orders/$orderId")({
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { orderId } = Route.useParams();
  return <OrderDetailPanel id={orderId} base="/n7q4-v2m9/orders" />;
}
