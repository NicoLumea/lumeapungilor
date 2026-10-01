import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailPanel } from "@/components/dashboard/OrderDetailPanel";

export const Route = createFileRoute("/staff/comenzi/$orderId")({
  component: StaffOrderDetail,
});

function StaffOrderDetail() {
  const { orderId } = Route.useParams();
  return <OrderDetailPanel id={orderId} base="/staff/comenzi" />;
}
