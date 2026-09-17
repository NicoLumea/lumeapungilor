import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useContactRequests } from "@/lib/dashboard-data";

export function MessagesPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useContactRequests();

  async function toggle(id: string, status: string) {
    const { error: err } = await supabase.from("contact_requests").update({ status }).eq("id", id);
    if (err) {
      toast.error("Nu am putut actualiza mesajul.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["dashboard", "messages"] });
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="display text-3xl">Mesaje</h1>
      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Se încarcă…</p> : null}
      {error ? <p className="mt-8 text-sm text-destructive">Mesajele nu au putut fi încărcate.</p> : null}
      {!isLoading && (data ?? []).length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Nu există mesaje.</p>
      ) : null}
      <ul className="mt-8 space-y-4">
        {(data ?? []).map((m) => (
          <li key={m.id} className="border border-border p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="micro-sm">{m.name}</span>
              <span className="text-sm text-muted-foreground">{m.email}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(m.created_at).toLocaleDateString("ro-RO")}
              </span>
              <button
                type="button"
                onClick={() => toggle(m.id, m.status === "rezolvat" ? "nou" : "rezolvat")}
                className="micro-sm ml-auto min-h-9 border border-foreground px-3 py-1"
              >
                {m.status === "rezolvat" ? "Redeschide" : "Marchează rezolvat"}
              </button>
            </div>
            {m.subject ? <p className="mt-3 text-sm font-medium">{m.subject}</p> : null}
            <p className="mt-2 whitespace-pre-line text-sm">{m.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
