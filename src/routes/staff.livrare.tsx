import { createFileRoute } from "@tanstack/react-router";
import { DeliverySettings } from "@/components/dashboard/DeliverySettings";

export const Route = createFileRoute("/staff/livrare")({
  component: () => <DeliverySettings editable={false} />,
});
