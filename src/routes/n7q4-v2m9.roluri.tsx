import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useTeam } from "@/lib/dashboard-data";
import { promoteAccount, setEmployeeSuspension } from "@/lib/account.functions";

export const Route = createFileRoute("/n7q4-v2m9/roluri")({ component: RolesPage });

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietar",
  admin: "Administrator",
  employee: "Angajat",
  customer: "Client",
};

function RolesPage() {
  const qc = useQueryClient();
  const { data: team, isLoading, isError } = useTeam();
  const promote = useServerFn(promoteAccount);
  const suspend = useServerFn(setEmployeeSuspension);
  const [candidate, setCandidate] = useState("");
  const [role, setRole] = useState<"employee" | "admin">("employee");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    if (busy) return false;
    setBusy(true);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Acțiunea nu a putut fi efectuată.");
        return false;
      }
      toast.success(success);
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      return true;
    } catch {
      toast.error("Acțiunea nu a putut fi efectuată.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-14">
      <section>
        <h1 className="display text-3xl">Angajați și accese</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Administratorii acordă direct acces de angajat sau administrator conturilor existente.
          Rolul ales se activează imediat, fără cerere de aprobare.
        </p>
      </section>

      <section>
        <h2 className="display text-xl">Promovează un cont</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Introdu adresa de e-mail confirmată a contului și alege accesul pe care îl acorzi.
        </p>
        <form
          className="mt-5 flex flex-wrap items-end gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const success = await run(
              () => promote({ data: { candidateEmail: candidate, role } }),
              `Acces de ${role === "admin" ? "administrator" : "angajat"} acordat.`,
            );
            if (success) setCandidate("");
          }}
        >
          <label className="block w-full sm:w-auto">
            <span className="micro-sm text-muted-foreground">E-mailul contului</span>
            <input
              type="email"
              required
              maxLength={200}
              disabled={busy}
              autoComplete="off"
              value={candidate}
              onChange={(event) => setCandidate(event.target.value)}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground sm:w-72"
            />
          </label>
          <label className="block">
            <span className="micro-sm text-muted-foreground">Rol</span>
            <select
              value={role}
              disabled={busy}
              onChange={(event) => setRole(event.target.value as "employee" | "admin")}
              className="mt-2 block min-h-10 border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="employee">Angajat</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="micro min-h-11 border border-foreground bg-foreground px-5 py-2.5 text-background disabled:opacity-40"
          >
            {busy ? "Se procesează…" : "Promovează contul"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="display text-xl">Echipa</h2>
        {isLoading ? <p className="mt-4 text-sm">Se încarcă…</p> : null}
        {isError ? <p className="mt-4 text-sm">Echipa nu a putut fi încărcată.</p> : null}
        {!isLoading && !isError && !team?.length ? (
          <p className="mt-4 text-sm text-muted-foreground">Nu există membri în echipă.</p>
        ) : null}
        <ul className="mt-5 space-y-3">
          {(team ?? []).map((member) => (
            <li
              key={member.user_id}
              className="flex flex-wrap items-center gap-4 border border-border p-4"
            >
              <span className="break-all text-sm">
                {member.email ?? member.user_id.slice(0, 8)}
              </span>
              <span className="micro-sm text-muted-foreground">
                {member.roles.map((r) => ROLE_LABEL[r] ?? r).join(", ")}
              </span>
              {member.roles.includes("employee") &&
              !member.roles.includes("admin") &&
              !member.roles.includes("owner") ? (
                <div className="ml-auto flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy || !member.email}
                    onClick={() =>
                      run(
                        () => promote({ data: { candidateEmail: member.email!, role: "admin" } }),
                        "Acces de administrator acordat.",
                      )
                    }
                    className="micro-sm min-h-9 border border-foreground px-3 py-1 disabled:opacity-40"
                  >
                    Promovează administrator
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => suspend({ data: { userId: member.user_id, revoke: true } }),
                        "Acces retras.",
                      )
                    }
                    className="micro-sm min-h-9 border border-foreground px-3 py-1 disabled:opacity-40"
                  >
                    Retrage accesul
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
