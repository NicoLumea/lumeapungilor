import { createFileRoute } from "@tanstack/react-router";
import { useCustomers } from "@/lib/dashboard-data";

export const Route = createFileRoute("/admin/clienti")({
  component: CustomersPage,
});

function CustomersPage() {
  const { data, isLoading, error } = useCustomers();

  return (
    <div className="mx-auto max-w-[1000px]">
      <h1 className="display text-3xl">Clienți</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Conturile de client înregistrate pe site. Comenzile lor se văd în secțiunea Comenzi.
      </p>
      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Se încarcă…</p> : null}
      {error ? <p className="mt-8 text-sm text-destructive">Lista nu a putut fi încărcată.</p> : null}
      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="micro-sm py-2 font-normal text-muted-foreground">E-mail</th>
            <th className="micro-sm py-2 font-normal text-muted-foreground">Nume</th>
            <th className="micro-sm py-2 font-normal text-muted-foreground">Firmă</th>
            <th className="micro-sm py-2 font-normal text-muted-foreground">Oraș</th>
            <th className="micro-sm py-2 font-normal text-muted-foreground">Înregistrat</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((c) => (
            <tr key={c.id} className="border-b border-border/60">
              <td className="py-2 pr-4">{c.email}</td>
              <td className="py-2 pr-4">{c.full_name ?? "—"}</td>
              <td className="py-2 pr-4">{c.company_name ?? "—"}</td>
              <td className="py-2 pr-4">{c.city ?? "—"}</td>
              <td className="py-2 text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString("ro-RO")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
