import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useReturnRequests } from "@/lib/dashboard-data";
import {
  RETURN_REASON_LABEL,
  RETURN_STATUSES,
  RETURN_STATUS_LABEL,
  type ReturnReason,
} from "@/lib/returns-core";

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
              <span className="micro-sm">Cererea {r.id.slice(0, 8).toUpperCase()}</span>
              <span className="text-sm text-muted-foreground">
                {r.order_number ?? "fără comandă"}
              </span>
              <span className="text-sm text-muted-foreground">{r.customer_name ?? r.email}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("ro-RO")}
              </span>
              <select
                value={r.status}
                onChange={(e) => setStatus(r.id, e.target.value)}
                className="ml-auto border border-input bg-background px-2 py-1 text-sm"
              >
                {RETURN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {RETURN_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5 grid gap-5 border-t border-border pt-5 md:grid-cols-2">
              <div>
                <p className="micro-sm text-muted-foreground">Produse și motiv</p>
                <p className="mt-2 text-sm">
                  {RETURN_REASON_LABEL[r.reason as ReturnReason] ?? r.kind}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {r.return_request_items.map((item) => (
                    <li key={item.id}>
                      {item.product_name}
                      {item.variant_name ? ` — ${item.variant_name}` : ""} ·{" "}
                      {item.requested_quantity} din {item.purchased_quantity}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
                  {r.message}
                </p>
              </div>
              <div>
                <p className="micro-sm text-muted-foreground">Client și fotografii</p>
                <p className="mt-2 text-sm">
                  {r.email}
                  {r.customer_phone ? ` · ${r.customer_phone}` : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.return_request_images.map((image) => (
                    <EvidenceLink
                      key={image.id}
                      path={image.storage_path}
                      label={image.original_name}
                    />
                  ))}
                  {r.return_request_images.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Fără fotografii.</span>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceLink({ path, label }: { path: string; label: string }) {
  async function openEvidence() {
    const { data, error } = await supabase.storage
      .from("return-evidence")
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      toast.error("Fotografia nu a putut fi deschisă.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  return (
    <button
      type="button"
      onClick={openEvidence}
      className="micro-sm border border-border px-3 py-2 link-underline"
    >
      {label}
    </button>
  );
}
