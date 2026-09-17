import { createFileRoute } from "@tanstack/react-router";
import { CategoriesPanel } from "@/components/dashboard/CategoriesPanel";

export const Route = createFileRoute("/staff/categorii")({
  component: CategoriesPanel,
});
