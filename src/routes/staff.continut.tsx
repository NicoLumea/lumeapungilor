import { createFileRoute } from "@tanstack/react-router";
import { ContentPanel } from "@/components/dashboard/ContentPanel";
import { RequireAccess } from "@/components/site/RequireAccess";

export const Route = createFileRoute("/staff/continut")({
  component: () => <RequireAccess level="admin">{() => <ContentPanel />}</RequireAccess>,
});
