import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  hasRecoveryError,
  hasRecoveryMarker,
  MIN_PASSWORD_LENGTH,
  passwordValidationError,
} from "@/lib/password-recovery";

export const Route = createFileRoute("/parola-noua")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Setează o parolă nouă — Lumea Pungilor" },
      { name: "description", content: "Setează o parolă nouă pentru contul tău." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

type RecoveryState = "checking" | "ready" | "invalid" | "success";

function PasswordInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block" htmlFor={id}>
      <span className="micro-sm text-muted-foreground">{label}</span>
      <span className="relative mt-2 block">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border border-input bg-background px-3 py-2 pr-24 text-sm outline-none focus:border-foreground"
        />
        <button
          type="button"
          aria-label={visible ? "Ascunde parola" : "Afișează parola"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="micro-sm absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
        >
          {visible ? "Ascunde" : "Afișează"}
        </button>
      </span>
    </label>
  );
}

function ResetPassword() {
  const [state, setState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUrl = window.location.href;
    if (hasRecoveryError(currentUrl) || !hasRecoveryMarker(currentUrl)) {
      setState("invalid");
      return;
    }

    let active = true;
    let recoveryEvent = false;
    const timer = window.setTimeout(() => {
      if (active && !recoveryEvent) setState("invalid");
    }, 4000);
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event !== "PASSWORD_RECOVERY" || !session) return;
      recoveryEvent = true;
      window.clearTimeout(timer);
      window.history.replaceState(null, "", "/parola-noua");
      setState("ready");
    });

    return () => {
      active = false;
      window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = passwordValidationError(password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      setError("Parola nu a putut fi schimbată. Linkul poate fi expirat sau deja folosit.");
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    setBusy(false);
    setState("success");
  }

  if (state === "checking") {
    return (
      <main className="site-container max-w-[480px] py-28">
        <p role="status" className="text-sm text-muted-foreground">
          Verificăm linkul de recuperare…
        </p>
      </main>
    );
  }

  if (state === "invalid") {
    return (
      <main className="site-container max-w-[480px] py-28">
        <h1 className="display text-3xl">Link indisponibil</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Linkul de resetare este invalid, a expirat sau a fost deja folosit. Solicită un link nou
          pentru a continua.
        </p>
        <Link
          to="/resetare-parola"
          className="micro mt-7 inline-block border border-foreground px-5 py-3"
        >
          Solicită un link nou
        </Link>
      </main>
    );
  }

  if (state === "success") {
    return (
      <main className="site-container max-w-[480px] py-28">
        <h1 className="display text-3xl">Parola a fost actualizată cu succes.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Acum te poți autentifica folosind noua parolă.
        </p>
        <Link
          to="/autentificare"
          className="micro mt-7 inline-block border border-foreground bg-foreground px-5 py-3 text-background"
        >
          Conectează-te
        </Link>
      </main>
    );
  }

  return (
    <main className="site-container max-w-[480px] py-20 sm:py-28">
      <h1 className="display text-3xl">Setează o parolă nouă</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Folosește cel puțin {MIN_PASSWORD_LENGTH} caractere și nu reutiliza o parolă de pe alt site.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <PasswordInput
          id="new-password"
          label="Parolă nouă"
          value={password}
          onChange={setPassword}
        />
        <PasswordInput
          id="confirm-password"
          label="Confirmă parola nouă"
          value={confirm}
          onChange={setConfirm}
        />
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="micro min-h-11 w-full border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy ? "Se actualizează…" : "Salvează parola"}
        </button>
      </form>
    </main>
  );
}
