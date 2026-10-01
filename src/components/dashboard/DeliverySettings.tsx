import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { num, useContent } from "@/lib/content";
import { formatRon } from "@/lib/format";

export function DeliverySettings({ editable }: { editable: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useContent();
  const current = num(data?.["settings"], "shipping_flat");
  const [fee, setFee] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (current !== null) setFee(String(current));
  }, [current]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(fee);
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > 10000 ||
      Math.round(value * 100) !== value * 100
    ) {
      toast.error("Introdu o sumă validă în RON, cu maximum două zecimale.");
      return;
    }
    setSaving(true);
    const { error: saveError } = await supabase.rpc("set_delivery_fee", { p_fee: value });
    setSaving(false);
    if (saveError) {
      toast.error(saveError.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["site_content"] });
    toast.success("Costul de livrare a fost salvat pentru comenzile viitoare.");
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="display text-3xl">Livrare</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Costul curent se afișează la finalizarea comenzii. Comenzile existente păstrează suma
        înregistrată la plasare.
      </p>
      {isLoading ? <p className="mt-8 text-sm">Se încarcă…</p> : null}
      {error ? (
        <p className="mt-8 text-sm text-destructive">Setarea nu a putut fi încărcată.</p>
      ) : null}
      {!isLoading && !error ? (
        <div className="mt-8 border border-border p-6">
          <p className="micro-sm text-muted-foreground">Cost livrare curent</p>
          <p className="mt-2 text-2xl">{current === null ? "Neconfigurat" : formatRon(current)}</p>
          {editable ? (
            <form onSubmit={save} className="mt-6 flex flex-wrap items-end gap-4">
              <label className="block text-sm">
                Cost nou (RON)
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="0.01"
                  required
                  value={fee}
                  onChange={(event) => setFee(event.target.value)}
                  className="mt-2 block w-40 border border-input bg-background px-3 py-2"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="micro min-h-11 border border-foreground bg-foreground px-6 text-background disabled:opacity-40"
              >
                {saving ? "Se salvează…" : "Salvează"}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Doar administratorii pot modifica acest cost.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
