import { createFileRoute } from "@tanstack/react-router";
import { ReturnsPanel } from "@/components/dashboard/ReturnsPanel";

export const Route = createFileRoute("/staff/retururi")({
  component: ReturnsPanel,
});
