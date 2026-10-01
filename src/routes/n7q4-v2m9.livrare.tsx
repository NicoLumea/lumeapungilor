import { createFileRoute } from "@tanstack/react-router";
import { DeliverySettings } from "@/components/dashboard/DeliverySettings";

export const Route = createFileRoute("/n7q4-v2m9/livrare")({
  component: () => <DeliverySettings editable />,
});
