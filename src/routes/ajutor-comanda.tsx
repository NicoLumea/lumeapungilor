import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ReturnRequestForm } from "@/components/site/ReturnRequestForm";
import { verifyGuestReturnOrder, type EligibleReturnOrder } from "@/lib/returns.functions";

export const Route = createFileRoute("/ajutor-comanda")({
  head: () => ({
    meta: [
      { title: "Ajutor pentru o comandă fără cont — Lumea Pungilor" },
      {
        name: "description",
        content:
          "Verifică în siguranță o comandă fără cont și trimite o cerere de retur sau reclamație.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuestOrderHelp,
});

function GuestOrderHelp() {
  const verify = useServerFn(verifyGuestReturnOrder);
  const [details, setDetails] = useState({ orderNumber: "", email: "" });
  const [verified, setVerified] = useState<{ order: EligibleReturnOrder; token: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await verify({ data: details });
      if (!result.ok) {
        setVerified(null);
        toast.error(result.error);
        return;
      }
      setVerified({ order: result.order, token: result.token });
      toast.success("Comanda achitată a fost verificată.");
    } catch {
      toast.error("Verificarea nu a putut fi efectuată.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="site-container max-w-[900px] py-14">
      <p className="micro-sm text-muted-foreground">Comandă fără cont</p>
      <h1 className="display mt-3 text-3xl md:text-4xl">Retur sau reclamație</h1>
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Verifică mai întâi comanda folosind atât numărul comenzii, cât și adresa de e-mail folosită
        la cumpărare. Datele nu sunt afișate pe baza numărului comenzii singur.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Consultă{" "}
        <Link to="/retur" className="link-underline">
          condițiile și procesul de retur
        </Link>
        . Drepturile legale ale consumatorilor rămân aplicabile.
      </p>
      <form
        onSubmit={onVerify}
        className="mt-8 grid gap-5 border border-border p-5 sm:grid-cols-2 sm:p-7"
      >
        <label>
          <span className="micro-sm text-muted-foreground">Număr comandă</span>
          <input
            required
            value={details.orderNumber}
            onChange={(e) => setDetails((v) => ({ ...v, orderNumber: e.target.value }))}
            className="form-input"
          />
        </label>
        <label>
          <span className="micro-sm text-muted-foreground">E-mail folosit la comandă</span>
          <input
            type="email"
            required
            value={details.email}
            onChange={(e) => setDetails((v) => ({ ...v, email: e.target.value }))}
            className="form-input"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="micro min-h-11 border border-foreground bg-foreground px-6 text-background disabled:opacity-40 sm:col-span-2 sm:w-fit"
        >
          {busy ? "Se verifică…" : "Verifică comanda"}
        </button>
      </form>
      {verified ? (
        <ReturnRequestForm
          orders={[verified.order]}
          guestToken={verified.token}
          onSubmitted={() => setVerified(null)}
        />
      ) : null}
    </div>
  );
}
