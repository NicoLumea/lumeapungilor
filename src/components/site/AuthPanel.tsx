import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Mode = "in" | "up" | "reset";

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="micro-sm text-muted-foreground">{label}</span>
      <input
        type={type}
        required
        value={value}
        autoComplete={autoComplete ?? "off"}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}

function romanianError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail sau parolă incorecte.";
  if (m.includes("email not confirmed")) return "Confirmă întâi adresa de e-mail din mesajul primit.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Există deja un cont cu această adresă. Autentifică-te.";
  if (m.includes("password")) return "Parola trebuie să aibă cel puțin 8 caractere.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Prea multe încercări. Te rugăm să reîncerci peste câteva minute.";
  return "Ceva nu a funcționat. Te rugăm să încerci din nou.";
}

export function AuthPanel({ onSignedIn }: { onSignedIn?: () => void }) {
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSent(null);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bine ai revenit.");
        onSignedIn?.();
      } else if (mode === "up") {
        if (password.length < 8) {
          toast.error("Parola trebuie să aibă cel puțin 8 caractere.");
          return;
        }
        if (password !== confirm) {
          toast.error("Cele două parole nu coincid.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/cont` },
        });
        if (error) throw error;
        if (!data.session) {
          setSent("Ți-am trimis un e-mail de confirmare. Confirmă adresa, apoi autentifică-te.");
          setMode("in");
        } else {
          onSignedIn?.();
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/parola-noua`,
        });
        if (error) throw error;
        setSent("Ți-am trimis un e-mail cu instrucțiuni pentru resetarea parolei.");
      }
    } catch (err) {
      toast.error(romanianError(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <div className="flex gap-6 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setMode("in")}
          className={`micro-sm min-h-9 ${mode !== "up" ? "text-foreground underline underline-offset-4" : "text-muted-foreground"}`}
        >
          Autentificare
        </button>
        <button
          type="button"
          onClick={() => setMode("up")}
          className={`micro-sm min-h-9 ${mode === "up" ? "text-foreground underline underline-offset-4" : "text-muted-foreground"}`}
        >
          Creează cont
        </button>
      </div>

      {sent ? <p className="mt-5 border border-border bg-field p-3 text-sm">{sent}</p> : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <Field label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" />
        {mode !== "reset" ? (
          <Field
            label="Parolă"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
          />
        ) : null}
        {mode === "up" ? (
          <Field
            label="Confirmă parola"
            type="password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="micro min-h-11 w-full border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy
            ? "Se procesează…"
            : mode === "in"
              ? "Intră în cont"
              : mode === "up"
                ? "Creează cont"
                : "Trimite link de resetare"}
        </button>
      </form>

      <button
        type="button"
        className="micro-sm mt-5 text-muted-foreground underline underline-offset-4 hover:text-foreground"
        onClick={() => setMode(mode === "reset" ? "in" : "reset")}
      >
        {mode === "reset" ? "Înapoi la autentificare" : "Ai uitat parola?"}
      </button>
    </div>
  );
}
