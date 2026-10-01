import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type RestockRow = {
  id: string;
  email: string;
  status: string;
  created_at: string;
  notified_at: string | null;
  notify_error: string | null;
  product_id: string;
  variant_id: string | null;
  products: { name: string; slug: string; stock: number; track_stock: boolean } | null;
  product_variants: { name: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  activ: "Activ",
  anuntat: "Anunțat",
  dezabonat: "Dezabonat",
};

function useRestockRequests() {
  return useQuery({
    queryKey: ["admin", "restock"],
    queryFn: async (): Promise<RestockRow[]> => {
      const { data, error } = await supabase
        .from("restock_requests")
        .select(
          "id,email,status,created_at,notified_at,notify_error,product_id,variant_id,products(name,slug,stock,track_stock),product_variants(name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RestockRow[];
    },
  });
}

export function RestockPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useRestockRequests();
  const [status, setStatus] = useState<string>("activ");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    let list = data ?? [];
    if (status) list = list.filter((r) => r.status === status);
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (r) => r.email.toLowerCase().includes(q) || (r.products?.name ?? "").toLowerCase().includes(q),
      );
    return list;
  }, [data, status, query]);

  const markNotified = useMutation({
    mutationFn: async (id: string) => {
      const { error: err } = await supabase
        .from("restock_requests")
        .update({ status: "anuntat", notified_at: new Date().toISOString(), notify_error: null })
        .eq("id", id);
      if (err) throw err;
    },
    onSuccess: () => {
      toast.success("Cererea a fost marcată ca anunțată.");
      void qc.invalidateQueries({ queryKey: ["admin", "restock"] });
    },
    onError: () => toast.error("Cererea nu a putut fi actualizată."),
  });

  function exportCsv() {
    const header = ["E-mail", "Produs", "Opțiune", "Status", "Creat", "Anunțat"];
    const lines = rows.map((r) =>
      [
        r.email,
        r.products?.name ?? "",
        r.product_variants?.name ?? "",
        STATUS_LABEL[r.status] ?? r.status,
        new Date(r.created_at).toLocaleString("ro-RO"),
        r.notified_at ? new Date(r.notified_at).toLocaleString("ro-RO") : "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cereri-revenire-stoc.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display text-2xl">Cereri „Anunță-mă când revine în stoc”</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Trimite anunțul manual pe e-mail, apoi marchează cererea ca anunțată. Marcajul se
            înregistrează doar după ce ai trimis mesajul.
          </p>
        </div>
        <button type="button" onClick={exportCsv} className="micro min-h-11 border border-foreground px-5">
          Exportă CSV
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <label className="block">
          <span className="micro-sm text-muted-foreground">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-2 border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Toate</option>
            <option value="activ">Active</option>
            <option value="anuntat">Anunțate</option>
            <option value="dezabonat">Dezabonate</option>
          </select>
        </label>
        <label className="block">
          <span className="micro-sm text-muted-foreground">Caută</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E-mail sau produs"
            className="mt-2 border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Se încarcă…</p>
      ) : error ? (
        <p className="mt-10 text-sm text-destructive">Cererile nu au putut fi încărcate.</p>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Nu există cereri pentru filtrele alese.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="micro-sm py-3">E-mail</th>
                <th className="micro-sm py-3">Produs</th>
                <th className="micro-sm py-3">Stoc</th>
                <th className="micro-sm py-3">Status</th>
                <th className="micro-sm py-3">Creat</th>
                <th className="micro-sm py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border align-top">
                  <td className="py-3">{r.email}</td>
                  <td className="py-3">
                    {r.products?.name ?? "—"}
                    {r.product_variants?.name ? ` — ${r.product_variants.name}` : ""}
                  </td>
                  <td className="py-3">
                    {r.products?.track_stock ? r.products.stock : "Nelimitat"}
                  </td>
                  <td className="py-3">{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="py-3">{new Date(r.created_at).toLocaleDateString("ro-RO")}</td>
                  <td className="py-3 text-right">
                    {r.status === "activ" ? (
                      <button
                        type="button"
                        disabled={markNotified.isPending}
                        onClick={() => markNotified.mutate(r.id)}
                        className="micro-sm min-h-9 link-underline"
                      >
                        Marchează ca anunțat
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
