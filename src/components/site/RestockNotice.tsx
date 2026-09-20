import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { requestRestockNotice } from "@/lib/restock.functions";

/** Shown on unavailable products so customers can be told when stock returns. */
export function RestockNotice({
  productId,
  variantId,
}: {
  productId: string;
  variantId: string | null;
}) {
  const submit = useServerFn(requestRestockNotice);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Introdu o adresă de e-mail validă.");
      return;
    }
    if (!consent) {
      setError("Bifează acordul pentru a putea primi anunțul.");
      return;
    }
    setBusy(true);
    try {
      const result = await submit({
        data: { productId, variantId, email: email.trim(), consent: true },
      });
      if (result.ok) {
        setDone(
          result.alreadyActive
            ? "Ai deja o cerere activă pentru acest produs. Te anunțăm la aceeași adresă."
            : "Cererea a fost înregistrată. Te anunțăm pe e-mail când produsul revine în stoc.",
        );
      } else {
        setError(result.error);
      }
    } catch {
      setError("Cererea nu a putut fi trimisă. Te rugăm să încerci din nou.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="mt-6 border border-border bg-field p-4 text-sm" role="status">
        {done}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="micro mt-4 min-h-11 w-full border border-foreground px-8 py-3 transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        Anunță-mă când revine în stoc
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 border border-border p-4">
      <p className="micro-sm text-muted-foreground">Anunță-mă când revine în stoc</p>
      <label className="mt-3 block">
        <span className="micro-sm text-muted-foreground">Adresa ta de e-mail</span>
        <input
          type="email"
          required
          value={email}
          autoComplete="email"
          aria-describedby={error ? "restock-error" : undefined}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      </label>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 size-4 accent-foreground"
        />
        <span className="text-muted-foreground">
          Sunt de acord să primesc un singur e-mail când acest produs revine în stoc. Te poți
          dezabona oricând din linkul inclus în mesaj. Detalii în{" "}
          <Link to="/confidentialitate" target="_blank" className="link-underline">
            Politica de confidențialitate
          </Link>
          .
        </span>
      </label>
      {error ? (
        <p id="restock-error" role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="micro min-h-11 border border-foreground bg-foreground px-6 py-2 text-background disabled:opacity-40"
        >
          {busy ? "Se trimite…" : "Trimite cererea"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="micro-sm min-h-11 link-underline">
          Renunță
        </button>
      </div>
    </form>
  );
}
