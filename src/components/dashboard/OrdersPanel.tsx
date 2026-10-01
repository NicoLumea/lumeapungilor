import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { formatRon } from "@/lib/format";

const PAGE_SIZE = 25;
const statuses = ["nou", "confirmat", "in_livrare", "finalizat", "anulat"];
const payments = ["in_asteptare", "platit", "rambursat", "anulat", "neplatit"];

export function OrdersPanel({ base }: { base: "/staff/comenzi" | "/n7q4-v2m9/orders" }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [method, setMethod] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const orders = useQuery({
    queryKey: ["staff", "orders", search, status, payment, method, customerType, from, to, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("staff_order_catalog", {
        p_search: search || null,
        p_status: status || null,
        p_payment_status: payment || null,
        p_payment_method: method || null,
        p_customer_type: customerType || null,
        p_from: from || null,
        p_to: to || null,
        p_limit: PAGE_SIZE + 1,
        p_offset: page * PAGE_SIZE,
      });
      if (error) {
        console.error("[orders] staff_order_catalog failed", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      return data ?? [];
    },
  });
  const rows = orders.data?.slice(0, PAGE_SIZE) ?? [];
  const hasFilters = Boolean(search || status || payment || method || customerType || from || to);
  const resetPage = () => setPage(0);
  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="display text-3xl">Comenzi</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Comenzi înregistrate, inclusiv cele fără cont.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm lg:col-span-2">
          Caută
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Număr, client, e-mail, firmă, produs sau ID"
            className="mt-1 w-full border border-input bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Status comandă
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            className="mt-1 w-full border border-input bg-background px-3 py-2"
          >
            <option value="">Toate</option>
            {statuses.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Status plată
          <select
            value={payment}
            onChange={(e) => {
              setPayment(e.target.value);
              resetPage();
            }}
            className="mt-1 w-full border border-input bg-background px-3 py-2"
          >
            <option value="">Toate</option>
            {payments.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Metodă plată
          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              resetPage();
            }}
            className="mt-1 w-full border border-input bg-background px-3 py-2"
          >
            <option value="">Toate</option>
            <option value="cash">Numerar</option>
            <option value="de_confirmat">De confirmat</option>
          </select>
        </label>
        <label className="text-sm">
          Tip client
          <select
            value={customerType}
            onChange={(e) => {
              setCustomerType(e.target.value);
              resetPage();
            }}
            className="mt-1 w-full border border-input bg-background px-3 py-2"
          >
            <option value="">Toate</option>
            <option value="registered">Înregistrat</option>
            <option value="guest">Fără cont</option>
          </select>
        </label>
        <label className="text-sm">
          De la
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              resetPage();
            }}
            className="mt-1 w-full border border-input bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Până la
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              resetPage();
            }}
            className="mt-1 w-full border border-input bg-background px-3 py-2"
          />
        </label>
      </div>
      {orders.isLoading ? <p className="mt-8 text-sm">Se încarcă…</p> : null}
      {orders.error ? (
        <p className="mt-8 text-sm text-destructive">Comenzile nu au putut fi încărcate.</p>
      ) : null}
      {orders.isSuccess ? (
        <>
          <div className="mt-6 overflow-x-auto border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-field text-muted-foreground">
                <tr>
                  <th className="p-3 font-normal">Comandă / dată</th>
                  <th className="p-3 font-normal">Client</th>
                  <th className="p-3 font-normal">Plată</th>
                  <th className="p-3 font-normal">Status</th>
                  <th className="p-3 font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 align-top">
                    <td className="p-3">
                      <Link
                        to={
                          base === "/staff/comenzi"
                            ? "/staff/comenzi/$orderId"
                            : "/n7q4-v2m9/orders/$orderId"
                        }
                        params={{ orderId: o.id }}
                        className="underline underline-offset-4"
                      >
                        {o.order_number}
                      </Link>
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("ro-RO")}
                      </span>
                    </td>
                    <td className="p-3">
                      {o.contact_name}
                      <br />
                      {o.email}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {o.user_id ? "Înregistrat" : "Fără cont"}
                        {o.company_name ? ` · ${o.company_name}` : ""}
                      </span>
                    </td>
                    <td className="p-3">
                      {o.payment_method === "cash" ? "Numerar" : "De confirmat"}
                      <br />
                      {o.payment_status}
                    </td>
                    <td className="p-3">{o.status}</td>
                    <td className="p-3">{formatRon(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? (
            <p className="mt-5 text-sm">
              {hasFilters ? "Nu există comenzi pentru filtrele alese." : "Nu există comenzi."}
            </p>
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
              disabled={(orders.data?.length ?? 0) <= PAGE_SIZE}
              onClick={() => setPage(page + 1)}
              className="border border-border px-4 py-2 disabled:opacity-40"
            >
              Următor
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
