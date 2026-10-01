import { createFileRoute, Navigate } from "@tanstack/react-router";
import { RequireAccess } from "@/components/site/RequireAccess";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administrare — Lumea Pungilor" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminEntry,
});

function AdminEntry() {
  return <RequireAccess level="admin">{() => <Navigate to="/n7q4-v2m9" replace />}</RequireAccess>;
}
