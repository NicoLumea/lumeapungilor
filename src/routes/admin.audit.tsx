import { createFileRoute } from "@tanstack/react-router";
import { useAuditLogs } from "@/lib/dashboard-data";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPage,
});

function AuditPage() {
  const { data, isLoading, error } = useAuditLogs();

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="display text-3xl">Jurnal de audit</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Înregistrare permanentă a modificărilor importante: produse, prețuri, stoc, comenzi și conturi.
        Înregistrările nu pot fi modificate sau șterse.
      </p>

      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Se încarcă…</p> : null}
      {error ? <p className="mt-8 text-sm text-destructive">Jurnalul nu a putut fi încărcat.</p> : null}

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="micro-sm py-2 font-normal text-muted-foreground">Data</th>
            <th className="micro-sm py-2 font-normal text-muted-foreground">Cine</th>
            <th className="micro-sm py-2 font-normal text-muted-foreground">Acțiune</th>
            <th className="micro-sm py-2 font-normal text-muted-foreground">Element</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={row.id} className="border-b border-border/60 align-top">
              <td className="py-2 pr-4 text-muted-foreground">
                {new Date(row.created_at).toLocaleString("ro-RO")}
              </td>
              <td className="py-2 pr-4">{row.actor_email ?? "sistem"}</td>
              <td className="py-2 pr-4">{row.action}</td>
              <td className="py-2 text-muted-foreground">
                {row.entity}
                {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
