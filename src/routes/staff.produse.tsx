import { createFileRoute } from "@tanstack/react-router";
import { ProductsPanel } from "@/components/dashboard/ProductsPanel";

export const Route = createFileRoute("/staff/produse")({
  component: ProductsPanel,
});
