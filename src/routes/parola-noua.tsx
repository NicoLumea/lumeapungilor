import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MIN_PASSWORD_LENGTH,
  passwordValidationError,
  readRecoveryCallback,
  recoveryCallbackConsumed,
  recoveryErrorMessage,
  type RecoveryCallback,
} from "@/lib/password-recovery";

// Route modules load before the site header initializes the shared auth client.
// Preserve only the callback type/error metadata; Supabase removes successful
// tokens/code from the URL while establishing the recovery session.
const initialCallback: RecoveryCallback =
  typeof window !== "undefined" && window.location.pathname === "/parola-noua"
    ? readRecoveryCallback(window.location.href)
    : { kind: "none" };

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
  const navigate = useNavigate();
  const [state, setState] = useState<RecoveryState>("checking");
  const [reason, setReason] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const callback =
      initialCallback.kind === "none"
        ? readRecoveryCallback(window.location.href)
        : initialCallback;
    if (callback.kind === "error" || callback.kind === "incomplete" || callback.kind === "none") {
      setReason(recoveryErrorMessage(callback));
      setState("invalid");
      return;
    }

    let active = true;
    let settled = false;
    const acceptSession = (session: unknown) => {
      if (!active || settled || !session) return;
      settled = true;
      setState("ready");
    };
    const rejectSession = () => {
      if (!active || settled) return;
      settled = true;
      setReason(recoveryErrorMessage(callback));
      setState("invalid");
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        acceptSession(session);
      } else if (
        (event === "INITIAL_SESSION" || event === "SIGNED_IN") &&
        recoveryCallbackConsumed(callback, window.location.href)
      ) {
        acceptSession(session);
      }
    });

    // getSession waits for SDK initialization. It recovers a callback session
    // even if PASSWORD_RECOVERY fired before this route subscribed. A pre-existing
    // login alone is not enough: the callback parameters must also be consumed.
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (
        !sessionError &&
        data.session &&
        recoveryCallbackConsumed(callback, window.location.href)
      ) {
        acceptSession(data.session);
      } else {
        rejectSession();
      }
    }, rejectSession);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
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
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("Parola nu a putut fi schimbată. Verifică sesiunea și încearcă din nou.");
        return;
      }
    } catch {
      setError("Parola nu a putut fi schimbată. Verifică sesiunea și încearcă din nou.");
      return;
    } finally {
      setBusy(false);
    }
    setState("success");
    // The password is already updated. A sign-out/navigation failure must not
    // present the save as failed or invite a second update attempt.
    await supabase.auth.signOut({ scope: "local" });
    await navigate({ to: "/autentificare", search: { reset: "success" } });
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
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{reason}</p>
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
        <p role="status" className="text-sm text-muted-foreground">
          Parola a fost actualizată. Te redirecționăm către autentificare…
        </p>
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
