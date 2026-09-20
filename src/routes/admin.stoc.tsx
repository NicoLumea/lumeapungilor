import { createFileRoute } from "@tanstack/react-router";
import { RestockPanel } from "@/components/dashboard/RestockPanel";

export const Route = createFileRoute("/admin/stoc")({
  component: RestockPanel,
});
