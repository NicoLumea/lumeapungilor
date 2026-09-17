import { createFileRoute } from "@tanstack/react-router";
import { MessagesPanel } from "@/components/dashboard/MessagesPanel";

export const Route = createFileRoute("/staff/mesaje")({
  component: MessagesPanel,
});
