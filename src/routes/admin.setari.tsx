import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGuestCartLimit } from "@/lib/dashboard-data";
import { useMethods, type MethodEntry, type MethodKey } from "@/lib/methods";

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

      <MethodsEditor
        settingKey="payment_methods"
        title="Modalități de plată"
        hint="Adaugă doar modalitățile confirmate de firmă. Cele bifate apar clienților la finalizarea comenzii; restul rămân ascunse."
      />
      <MethodsEditor
        settingKey="delivery_methods"
        title="Modalități de livrare"
        hint="Adaugă doar serviciile de livrare confirmate. Nu se afișează nimic clienților până nu bifezi o opțiune."
      />
    </div>
  );
}

function MethodsEditor({
  settingKey,
  title,
  hint,
}: {
  settingKey: MethodKey;
  title: string;
  hint: string;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useMethods(settingKey);
  const [rows, setRows] = useState<MethodEntry[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  function update(index: number, patch: Partial<MethodEntry>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function save() {
    setBusy(true);
    const clean = rows.filter((r) => r.label.trim().length > 0);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: { methods: clean } })
      .eq("key", settingKey);
    setBusy(false);
    if (error) {
      toast.error("Setarea nu a putut fi salvată.");
      return;
    }
    toast.success("Setare salvată.");
    void qc.invalidateQueries({ queryKey: ["settings", settingKey] });
  }

  return (
    <section className="mt-10 border border-border p-6">
      <h2 className="display text-xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Se încarcă…</p>
      ) : (
        <div className="mt-6 space-y-5">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nicio opțiune configurată.</p>
          ) : null}
          {rows.map((row, index) => (
            <div key={index} className="space-y-3 border border-border p-4">
              <label className="block">
                <span className="micro-sm text-muted-foreground">Denumire</span>
                <input
                  value={row.label}
                  onChange={(e) => update(index, { label: e.target.value })}
                  className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </label>
              <label className="block">
                <span className="micro-sm text-muted-foreground">Detalii pentru clienți</span>
                <textarea
                  rows={2}
                  value={row.description}
                  onChange={(e) => update(index, { description: e.target.value })}
                  className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </label>
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => update(index, { enabled: e.target.checked })}
                  />
                  Confirmată și vizibilă clienților
                </label>
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                  className="micro-sm min-h-9 text-muted-foreground underline underline-offset-4"
                >
                  Șterge
                </button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, { label: "", description: "", enabled: false }])}
              className="micro min-h-11 border border-foreground px-5"
            >
              Adaugă opțiune
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className="micro min-h-11 border border-foreground bg-foreground px-6 text-background disabled:opacity-40"
            >
              {busy ? "Se salvează…" : "Salvează"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
