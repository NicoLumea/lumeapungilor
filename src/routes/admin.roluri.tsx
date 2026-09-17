import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  useEmployeeRequests,
  useRoleChangeRequests,
  useTeam,
} from "@/lib/dashboard-data";
import {
  decideEmployeeRequest,
  decideAdminPromotion,
  requestAdminPromotion,
  setEmployeeSuspension,
} from "@/lib/account.functions";

export const Route = createFileRoute("/admin/roluri")({
  component: RolesPage,
});

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietar",
  admin: "Administrator",
  employee: "Angajat",
  customer: "Client",
};

function RolesPage() {
  const qc = useQueryClient();
  const { data: requests } = useEmployeeRequests();
  const { data: promotions } = useRoleChangeRequests();
  const { data: team } = useTeam();

  const decide = useServerFn(decideEmployeeRequest);
  const suspend = useServerFn(setEmployeeSuspension);
  const askPromotion = useServerFn(requestAdminPromotion);
  const decidePromotion = useServerFn(decideAdminPromotion);

  const [candidate, setCandidate] = useState("");
  const [ownerCode, setOwnerCode] = useState("");
  const [busy, setBusy] = useState(false);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setBusy(true);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Acțiunea nu a putut fi efectuată.");
        return;
      }
      toast.success(success);
      refresh();
    } catch {
      toast.error("Acțiunea nu a putut fi efectuată.");
    } finally {
      setBusy(false);
    }
  }

  const pending = (requests ?? []).filter((r) => r.status === "pending");

  return (
    <div className="mx-auto max-w-[1000px] space-y-14">
      <section>
        <h1 className="display text-3xl">Conturi și accese</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Aici aprobi accesul angajaților și ceri promovarea unui administrator. Accesul la editorul
          Lovable rămâne separat și se acordă doar manual, de către proprietarul proiectului.
        </p>
      </section>

      <section>
        <h2 className="display text-xl">Cereri de acces angajat</h2>
        {pending.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nu există cereri în așteptare.</p>
        ) : null}
        <ul className="mt-5 space-y-3">
          {pending.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 border border-border p-4">
              <span className="text-sm">{r.email}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("ro-RO")}
              </span>
              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() => decide({ data: { requestId: r.id, decision: "approved" } }), "Acces aprobat.")
                  }
                  className="micro-sm min-h-9 border border-foreground bg-foreground px-3 py-1 text-background"
                >
                  Aprobă
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() => decide({ data: { requestId: r.id, decision: "rejected" } }), "Cerere respinsă.")
                  }
                  className="micro-sm min-h-9 border border-foreground px-3 py-1"
                >
                  Respinge
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="display text-xl">Echipa</h2>
        <ul className="mt-5 space-y-3">
          {(team ?? []).map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center gap-4 border border-border p-4">
              <span className="text-sm">{m.email ?? m.user_id.slice(0, 8)}</span>
              <span className="micro-sm text-muted-foreground">
                {m.roles.map((r) => ROLE_LABEL[r] ?? r).join(", ")}
              </span>
              {m.roles.includes("employee") && !m.roles.includes("admin") && !m.roles.includes("owner") ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => suspend({ data: { userId: m.user_id, revoke: true } }),
                      "Acces retras.",
                    )
                  }
                  className="micro-sm ml-auto min-h-9 border border-foreground px-3 py-1"
                >
                  Retrage accesul
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="display text-xl">Promovare administrator</h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          O cerere de promovare rămâne în așteptare până când proprietarul proiectului o aprobă cu codul
          său. Niciun administrator nu se poate promova singur.
        </p>
        <form
          className="mt-5 flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => askPromotion({ data: { candidateEmail: candidate } }), "Cerere trimisă.").then(() =>
              setCandidate(""),
            );
          }}
        >
          <label className="block">
            <span className="micro-sm text-muted-foreground">E-mailul candidatului</span>
            <input
              type="email"
              required
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
              className="mt-2 w-72 max-w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <button type="submit" disabled={busy} className="micro min-h-11 border border-foreground px-5 py-2.5">
            Trimite cererea
          </button>
        </form>

        <label className="mt-8 block max-w-sm">
          <span className="micro-sm text-muted-foreground">
            Cod de proprietar (necesar doar pentru aprobare)
          </span>
          <input
            type="password"
            value={ownerCode}
            onChange={(e) => setOwnerCode(e.target.value)}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>

        <ul className="mt-6 space-y-3">
          {(promotions ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 border border-border p-4">
              <span className="text-sm">{p.candidate_email}</span>
              <span className="micro-sm text-muted-foreground">
                cerut de {p.requester_email} · {p.status === "pending_owner_approval" ? "în așteptarea proprietarului" : p.status}
              </span>
              {p.status === "pending_owner_approval" ? (
                <div className="ml-auto flex gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          decidePromotion({
                            data: { requestId: p.id, decision: "approved", ownerCode: ownerCode || undefined },
                          }),
                        "Promovare aprobată.",
                      )
                    }
                    className="micro-sm min-h-9 border border-foreground bg-foreground px-3 py-1 text-background"
                  >
                    Aprobă
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          decidePromotion({
                            data: { requestId: p.id, decision: "rejected", ownerCode: ownerCode || undefined },
                          }),
                        "Cerere respinsă.",
                      )
                    }
                    className="micro-sm min-h-9 border border-foreground px-3 py-1"
                  >
                    Respinge
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
