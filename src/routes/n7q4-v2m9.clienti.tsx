import { createFileRoute } from "@tanstack/react-router";
import { CustomersPanel } from "@/components/dashboard/CustomersPanel";

export const Route = createFileRoute("/n7q4-v2m9/clienti")({
  component: CustomersPage,
});

function CustomersPage() {
  return <CustomersPanel orderBase="/n7q4-v2m9/orders" />;
}
