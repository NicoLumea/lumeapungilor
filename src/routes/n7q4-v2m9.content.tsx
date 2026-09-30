import { createFileRoute } from "@tanstack/react-router";
import { ContentPanel } from "@/components/dashboard/ContentPanel";
import { RequireAccess } from "@/components/site/RequireAccess";

export const Route = createFileRoute("/n7q4-v2m9/content")({
  component: () => <RequireAccess level="admin">{() => <ContentPanel />}</RequireAccess>,
});
