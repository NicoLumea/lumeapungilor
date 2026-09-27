import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { protectedPasswordReset, PublicAuthError } from "@/lib/auth-client";

export const Route = createFileRoute("/resetare-parola")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Resetare parolă — Lumea Pungilor" },
      { name: "description", content: "Solicită un link securizat pentru resetarea parolei." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestPasswordReset,
});

function RequestPasswordReset() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setMessage(await protectedPasswordReset(email));
    } catch (caught) {
      setMessage(null);
      setError(
        caught instanceof PublicAuthError && caught.code === "rate_limited"
          ? "Prea multe solicitări. Încearcă din nou peste câteva minute."
          : "Solicitarea nu a putut fi trimisă. Încearcă din nou.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="site-container max-w-[480px] py-20 sm:py-28">
      <h1 className="display text-3xl">Resetare parolă</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Introdu adresa de email asociată contului tău și îți vom trimite instrucțiuni pentru
        resetarea parolei.
      </p>
      {message ? (
        <p className="mt-6 border border-border bg-field p-4 text-sm leading-relaxed" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block" htmlFor="recovery-email">
          <span className="micro-sm text-muted-foreground">Adresa de email</span>
          <input
            id="recovery-email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="micro min-h-11 w-full border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy ? "Se trimite…" : "Trimite linkul de resetare"}
        </button>
      </form>
      <Link to="/autentificare" className="micro-sm mt-6 inline-block link-underline">
        Înapoi la autentificare
      </Link>
    </main>
  );
}
