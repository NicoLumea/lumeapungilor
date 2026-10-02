import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { formatRon } from "@/lib/format";

const PAGE_SIZE = 25;

export function CustomersPanel({
  orderBase,
}: {
  orderBase: "/staff/comenzi" | "/n7q4-v2m9/orders";
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const customers = useQuery({
    queryKey: ["staff", "customers", search, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("staff_customer_catalog", {
        p_search: search || undefined,
        p_limit: PAGE_SIZE + 1,
        p_offset: page * PAGE_SIZE,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
  const history = useQuery({
    queryKey: ["staff", "customer-orders", selected, historyPage],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,created_at,status,total")
        .eq("user_id", selected!)
        .order("created_at", { ascending: false })
        .range(historyPage * PAGE_SIZE, (historyPage + 1) * PAGE_SIZE);
      if (error) throw error;
      return data ?? [];
    },
  });
  const rows = customers.data?.slice(0, PAGE_SIZE) ?? [];
  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="display text-3xl">Clienți</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Conturi înregistrate; comenzile fără cont nu creează profiluri.
      </p>
      <label className="mt-8 block max-w-md text-sm">
        Caută client
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Nume, e-mail, firmă sau ID"
          className="mt-2 w-full border border-input bg-background px-3 py-2"
        />
      </label>
      {customers.isLoading ? <p className="mt-8 text-sm">Se încarcă…</p> : null}
      {customers.error ? (
        <p className="mt-8 text-sm text-destructive">Clienții nu au putut fi încărcați.</p>
      ) : null}
      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border bg-field text-muted-foreground">
            <tr>
              <th className="p-3 font-normal">Client / ID</th>
              <th className="p-3 font-normal">Firmă / telefon</th>
              <th className="p-3 font-normal">Înregistrat</th>
              <th className="p-3 font-normal">Finalizate</th>
              <th className="p-3 font-normal">Ultima comandă</th>
              <th className="p-3 font-normal">Total finalizat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border/60 align-top">
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(selected === c.id ? null : c.id);
                      setHistoryPage(0);
                    }}
                    className="text-left underline underline-offset-4"
                  >
                    {c.full_name || "—"}
                  </button>
                  <br />
                  {c.email || "—"}
                  <br />
                  <span className="text-xs text-muted-foreground">{c.id}</span>
                </td>
                <td className="p-3">
                  {c.company_name || "—"}
                  <br />
                  {c.phone || "—"}
                </td>
                <td className="p-3">{new Date(c.created_at).toLocaleDateString("ro-RO")}</td>
                <td className="p-3">{c.completed_orders}</td>
                <td className="p-3">
                  {c.last_order_at ? new Date(c.last_order_at).toLocaleString("ro-RO") : "—"}
                </td>
                <td className="p-3">{formatRon(Number(c.total_spent))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!customers.isLoading && rows.length === 0 ? (
        <p className="mt-5 text-sm">Nu există clienți pentru această căutare.</p>
      ) : null}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          className="border border-border px-4 py-2 disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="py-2 text-sm">Pagina {page + 1}</span>
        <button
          type="button"
          disabled={(customers.data?.length ?? 0) <= PAGE_SIZE}
          onClick={() => setPage(page + 1)}
          className="border border-border px-4 py-2 disabled:opacity-40"
        >
          Următor
        </button>
      </div>
      {selected ? (
        <section className="mt-10 border border-border p-5">
          <h2 className="display text-xl">Istoricul comenzilor</h2>
          {history.isLoading ? <p className="mt-4 text-sm">Se încarcă…</p> : null}
          {history.error ? (
            <p className="mt-4 text-sm text-destructive">Istoricul nu a putut fi încărcat.</p>
          ) : null}
          <ul className="mt-4 divide-y divide-border">
            {(history.data ?? []).slice(0, PAGE_SIZE).map((o) => (
              <li key={o.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
                <Link
                  to={
                    orderBase === "/staff/comenzi"
                      ? "/staff/comenzi/$orderId"
                      : "/n7q4-v2m9/orders/$orderId"
                  }
                  params={{ orderId: o.id }}
                  className="underline underline-offset-4"
                >
                  {o.order_number}
                </Link>
                <span>{new Date(o.created_at).toLocaleString("ro-RO")}</span>
                <span>{o.status}</span>
                <span>{formatRon(o.total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={historyPage === 0}
              onClick={() => setHistoryPage(historyPage - 1)}
              className="border border-border px-4 py-2 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="py-2 text-sm">Pagina {historyPage + 1}</span>
            <button
              type="button"
              disabled={(history.data?.length ?? 0) <= PAGE_SIZE}
              onClick={() => setHistoryPage(historyPage + 1)}
              className="border border-border px-4 py-2 disabled:opacity-40"
            >
              Următor
            </button>
          </div>
          {!history.isLoading && history.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nicio comandă înregistrată.</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
