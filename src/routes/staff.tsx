import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAccess } from "@/components/site/RequireAccess";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panou angajați — Lumea Pungilor" },
      { name: "description", content: "Panoul intern pentru angajați." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffLayout,
});

const NAV: { to: string; label: string; exact: boolean }[] = [
  { to: "/staff", label: "Prezentare", exact: true },
  { to: "/staff/produse", label: "Produse și stoc", exact: false },
  { to: "/staff/categorii", label: "Categorii", exact: false },
  { to: "/staff/comenzi", label: "Comenzi", exact: false },
  { to: "/staff/retururi", label: "Retururi", exact: false },
  { to: "/staff/stoc", label: "Cereri revenire stoc", exact: false },
  { to: "/staff/mesaje", label: "Mesaje", exact: false },
  { to: "/staff/continut", label: "Conținut", exact: false },
];

function StaffLayout() {
  return (
    <RequireAccess level="staff">
      {() => (
        <DashboardShell title="Panou angajați" nav={NAV}>
          <Outlet />
        </DashboardShell>
      )}
    </RequireAccess>
  );
}
