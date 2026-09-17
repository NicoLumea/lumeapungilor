import { createFileRoute } from "@tanstack/react-router";
import { OrdersPanel } from "@/components/dashboard/OrdersPanel";

export const Route = createFileRoute("/staff/comenzi")({
  component: OrdersPanel,
});
