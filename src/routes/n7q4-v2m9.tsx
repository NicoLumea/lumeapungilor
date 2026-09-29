import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RequireAccess } from "@/components/site/RequireAccess";

export const Route = createFileRoute("/n7q4-v2m9")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Portal intern — Lumea Pungilor" },
      { name: "description", content: "Portal intern Lumea Pungilor." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdministrationLayout,
});

const NAV = [
  { to: "/n7q4-v2m9", label: "Prezentare", exact: true },
  { to: "/n7q4-v2m9/products", label: "Produse", exact: false },
  { to: "/n7q4-v2m9/categories", label: "Categorii", exact: false },
  { to: "/n7q4-v2m9/orders", label: "Comenzi", exact: false },
  { to: "/n7q4-v2m9/utilizatori", label: "Utilizatori și interes", exact: false },
  { to: "/n7q4-v2m9/clienti", label: "Clienți", exact: false },
  { to: "/n7q4-v2m9/roluri", label: "Angajați și accese", exact: false },
  { to: "/n7q4-v2m9/retururi", label: "Retururi", exact: false },
  { to: "/n7q4-v2m9/stoc", label: "Cereri revenire stoc", exact: false },
  { to: "/n7q4-v2m9/mesaje", label: "Mesaje", exact: false },
  { to: "/n7q4-v2m9/content", label: "Conținut site", exact: false },
  { to: "/n7q4-v2m9/setari", label: "Setări", exact: false },
  { to: "/n7q4-v2m9/audit", label: "Jurnal de audit", exact: false },
  { to: "/n7q4-v2m9/guide", label: "Ghid", exact: false },
] as const;

function AdministrationLayout() {
  return (
    <RequireAccess level="admin">
      {() => (
        <DashboardShell title="Administrare" nav={[...NAV]}>
          <Outlet />
        </DashboardShell>
      )}
    </RequireAccess>
  );
}
