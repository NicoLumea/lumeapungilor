import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TYPE_LABEL: Record<string, string> = {
  website: "Website",
  product: "Produs",
  experience: "Experiență generală",
};
const STATUS_LABEL: Record<string, string> = {
  new: "Nou",
  reviewed: "Revizuit",
  resolved: "Rezolvat",
};

export function FeedbackPanel() {
  const client = useQueryClient();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const query = useQuery({
    queryKey: ["dashboard", "feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_feedback")
        .select("id,email,feedback_type,product_id,order_number,rating,message,status,created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });
  const filtered = (query.data ?? []).filter((row) => {
    const day = row.created_at.slice(0, 10);
    return (
      (!type || row.feedback_type === type) &&
      (!status || row.status === status) &&
      (!fromDate || day >= fromDate) &&
      (!toDate || day <= toDate)
    );
  });

  async function setStatusFor(id: string, next: string) {
    const { error } = await supabase
      .from("customer_feedback")
      .update({ status: next })
      .eq("id", id)
      .select("id")
      .single();
    if (error) {
      toast.error(error.message || "Starea nu a putut fi actualizată.");
      return;
    }
    toast.success("Stare actualizată.");
    await client.invalidateQueries({ queryKey: ["dashboard", "feedback"] });
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="display text-3xl">Feedback clienți</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Mesaje despre site, produse și experiența de cumpărare.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs">
          Tip
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm"
          >
            <option value="">Toate</option>
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Stare
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm"
          >
            <option value="">Toate</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          De la
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm"
          />
        </label>
        <label className="text-xs">
          Până la
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm"
          />
        </label>
      </div>
      {query.isLoading ? <p className="mt-8 text-sm">Se încarcă…</p> : null}
      {query.error ? (
        <p className="mt-8 text-sm text-destructive">Feedbackul nu este disponibil.</p>
      ) : null}
      {!query.isLoading && !query.error && filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Nu există feedback pentru filtrele selectate.
        </p>
      ) : null}
      <ul className="mt-8 space-y-4">
        {filtered.map((row) => (
          <li key={row.id} className="border border-border p-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{TYPE_LABEL[row.feedback_type] ?? row.feedback_type}</span>
              <span>{new Date(row.created_at).toLocaleDateString("ro-RO")}</span>
              {row.rating ? <span>{row.rating} / 5</span> : null}
              {row.order_number ? <span>Comanda {row.order_number}</span> : null}
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm">{row.message}</p>
            {row.email ? (
              <p className="mt-3 break-all text-xs text-muted-foreground">{row.email}</p>
            ) : null}
            <label className="mt-4 inline-flex items-center gap-3 text-xs">
              Stare
              <select
                value={row.status}
                onChange={(event) => void setStatusFor(row.id, event.target.value)}
                className="min-h-10 border border-input bg-background px-3 text-sm"
              >
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
