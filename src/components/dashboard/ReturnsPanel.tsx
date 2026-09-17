import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useReturnRequests, RETURN_KIND_LABEL } from "@/lib/dashboard-data";

const STATUSES = ["nou", "in_lucru", "rezolvat", "respins"] as const;
const LABEL: Record<string, string> = {
  nou: "Nou",
  in_lucru: "În lucru",
  rezolvat: "Rezolvat",
  respins: "Respins",
};

export function ReturnsPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useReturnRequests();

  async function setStatus(id: string, status: string) {
    const { error: err } = await supabase.from("return_requests").update({ status }).eq("id", id);
    if (err) {
      toast.error("Nu am putut actualiza cererea.");
      return;
    }
    toast.success("Cerere actualizată.");
    qc.invalidateQueries({ queryKey: ["dashboard", "returns"] });
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="display text-3xl">Retururi și reclamații</h1>
      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Se încarcă…</p> : null}
      {error ? (
        <p className="mt-8 text-sm text-destructive">Cererile nu au putut fi încărcate.</p>
      ) : null}
      {!isLoading && (data ?? []).length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Nu există cereri înregistrate.</p>
      ) : null}
      <ul className="mt-8 space-y-4">
        {(data ?? []).map((r) => (
          <li key={r.id} className="border border-border p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="micro-sm">{RETURN_KIND_LABEL[r.kind] ?? r.kind}</span>
              <span className="text-sm text-muted-foreground">{r.order_number ?? "fără comandă"}</span>
              <span className="text-sm text-muted-foreground">{r.email}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("ro-RO")}
              </span>
              <select
                value={r.status}
                onChange={(e) => setStatus(r.id, e.target.value)}
                className="ml-auto border border-input bg-background px-2 py-1 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{r.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
