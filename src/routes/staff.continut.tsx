import { createFileRoute } from "@tanstack/react-router";
import { ContentPanel } from "@/components/dashboard/ContentPanel";

export const Route = createFileRoute("/staff/continut")({
  component: ContentPanel,
});
