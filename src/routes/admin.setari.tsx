import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGuestCartLimit } from "@/lib/dashboard-data";

export const Route = createFileRoute("/admin/setari")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: limit, isLoading } = useGuestCartLimit();
  const [value, setValue] = useState(3);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof limit === "number") setValue(limit);
  }, [limit]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: { value } })
      .eq("key", "guest_cart_max_distinct_products");
    setBusy(false);
    if (error) {
      toast.error("Setarea nu a putut fi salvată.");
      return;
    }
    toast.success("Setare salvată.");
    qc.invalidateQueries({ queryKey: ["settings", "guest_cart_max_distinct_products"] });
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="display text-3xl">Setări</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Setări operaționale ale magazinului. Costurile de livrare și TVA se schimbă din „Conținut site”.
      </p>

      <form onSubmit={save} className="mt-10 space-y-5 border border-border p-6">
        <label className="block">
          <span className="micro-sm text-muted-foreground">
            Câte produse diferite poate comanda cineva fără cont
          </span>
          <input
            type="number"
            min={1}
            max={50}
            value={value}
            disabled={isLoading}
            onChange={(e) => setValue(Number(e.target.value))}
            className="mt-2 w-32 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <p className="text-sm text-muted-foreground">
          Limita este verificată și pe server, la trimiterea comenzii. Fiecare adresă de e-mail poate
          plasa o singură comandă fără cont.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="micro min-h-11 border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy ? "Se salvează…" : "Salvează"}
        </button>
      </form>
    </div>
  );
}
