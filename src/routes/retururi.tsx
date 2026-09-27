import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AccountNav } from "@/components/site/AccountNav";
import { RequireAccess } from "@/components/site/RequireAccess";
import { ReturnRequestForm } from "@/components/site/ReturnRequestForm";
import { useMyReturns } from "@/lib/dashboard-data";
import { RETURN_REASON_LABEL, RETURN_STATUS_LABEL, type ReturnReason } from "@/lib/returns-core";
import { getEligibleReturnOrders } from "@/lib/returns.functions";

export const Route = createFileRoute("/retururi")({
  ssr: false,
  validateSearch: (search) => z.object({ order: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Retururile mele — Lumea Pungilor" },
      {
        name: "description",
        content: "Trimite și urmărește cererile tale de retur sau reclamație.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAccess level="customer">{(auth) => <MyReturns userId={auth.user!.id} />}</RequireAccess>
  ),
});

function MyReturns({ userId }: { userId: string }) {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const loadOrders = useServerFn(getEligibleReturnOrders);
  const orders = useQuery({
    queryKey: ["account", "return-eligible-orders", userId],
    queryFn: () => loadOrders(),
  });
  const returns = useMyReturns(userId);
  const [showForm, setShowForm] = useState(!!search.order);
  useEffect(() => {
    if (search.order) setShowForm(true);
  }, [search.order]);

  return (
    <div className="site-container max-w-[1000px] py-10">
      <AccountNav />
      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl">Retururile mele</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Poți trimite o cerere numai pentru comenzile achitate din contul tău.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="micro min-h-11 border border-foreground px-5"
        >
          {showForm ? "Închide formularul" : "Solicită retur / Trimite reclamație"}
        </button>
      </div>
      {showForm ? (
        orders.isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Se încarcă comenzile eligibile…</p>
        ) : orders.error ? (
          <p className="mt-8 text-sm text-destructive">
            Comenzile eligibile nu au putut fi încărcate.
          </p>
        ) : (
          <ReturnRequestForm
            orders={orders.data ?? []}
            initialOrderNumber={search.order}
            onSubmitted={() => {
              qc.invalidateQueries({ queryKey: ["account", "returns", userId] });
              qc.invalidateQueries({ queryKey: ["account", "orders", userId] });
            }}
          />
        )
      ) : null}
      <div className="mt-12 flex items-center justify-between border-t border-border pt-8">
        <h2 className="display text-2xl">Cereri trimise</h2>
        <Link to="/retur" className="micro-sm link-underline">
          Condiții și proces
        </Link>
      </div>
      {returns.isLoading ? <p className="mt-6 text-sm text-muted-foreground">Se încarcă…</p> : null}
      {!returns.isLoading && (returns.data ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nu ai cereri înregistrate.</p>
      ) : null}
      <ul className="mt-6 space-y-4">
        {(returns.data ?? []).map((request) => (
          <li key={request.id} className="border border-border p-5">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <span className="micro-sm">Cererea {request.id.slice(0, 8).toUpperCase()}</span>
              <span className="text-sm text-muted-foreground">{request.order_number}</span>
              <span className="ml-auto text-sm">
                {RETURN_STATUS_LABEL[request.status] ?? request.status}
              </span>
            </div>
            <p className="mt-3 text-sm">
              {RETURN_REASON_LABEL[request.reason as ReturnReason] ?? request.kind}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {request.message}
            </p>
            {request.resolution ? (
              <p className="mt-3 border-l border-brand pl-4 text-sm">{request.resolution}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
