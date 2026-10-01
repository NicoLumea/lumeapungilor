import { createFileRoute } from "@tanstack/react-router";
import { CustomersPanel } from "@/components/dashboard/CustomersPanel";

export const Route = createFileRoute("/staff/clienti")({
  component: () => <CustomersPanel orderBase="/staff/comenzi" />,
});
