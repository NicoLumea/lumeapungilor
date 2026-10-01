import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createPasswordRecoveryClient } from "@/lib/password-recovery-client";
import {
  normalizeRecoveryCode,
  passwordValidationError,
  MIN_PASSWORD_LENGTH,
} from "@/lib/password-recovery";

type RecoveryClient = ReturnType<typeof createPasswordRecoveryClient>;

export function PasswordRecoveryForm({ initialEmail = "" }: { initialEmail?: string }) {
  const navigate = useNavigate();
  const client = useRef<RecoveryClient | null>(null);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    const token = normalizeRecoveryCode(code);
    if (!token) {
      setError("Introdu codul de verificare din email (6 cifre).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const recoveryClient = createPasswordRecoveryClient();
      const { data, error: verifyError } = await recoveryClient.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "recovery",
      });
      if (verifyError || !data.session) {
        setError("Codul este invalid, a expirat sau a fost deja folosit. Solicită un cod nou.");
        return;
      }
      client.current = recoveryClient;
      setCode("");
      setVerified(true);
    } catch {
      setError("Codul nu a putut fi verificat. Încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    const validationError = passwordValidationError(password, confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!client.current) {
      setError("Sesiunea de recuperare a expirat. Solicită un cod nou.");
      setVerified(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: updateError } = await client.current.auth.updateUser({ password });
      if (updateError) {
        setError("Parola nu a putut fi schimbată. Verifică sesiunea și încearcă din nou.");
        return;
      }
    } catch {
      setError("Parola nu a putut fi schimbată. Încearcă din nou.");
      setBusy(false);
      return;
    }
    await client.current.auth.signOut({ scope: "local" }).catch(() => undefined);
    client.current = null;
    setPassword("");
    setConfirmation("");
    setBusy(false);
    await navigate({ to: "/autentificare", search: { reset: "success" } });
  }

  return (
    <form onSubmit={verified ? savePassword : verify} className="mt-8 space-y-5">
      {!verified ? (
        <>
          <label className="block" htmlFor="verify-recovery-email">
            <span className="micro-sm text-muted-foreground">Adresa de email</span>
            <input
              id="verify-recovery-email"
              type="email"
              required
              maxLength={320}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block" htmlFor="recovery-code">
            <span className="micro-sm text-muted-foreground">Codul de recuperare</span>
            <input
              id="recovery-code"
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm tracking-widest outline-none focus:border-foreground"
            />
          </label>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Cod verificat. Alege noua parolă.</p>
          <label className="block" htmlFor="new-password">
            <span className="micro-sm text-muted-foreground">Parolă nouă</span>
            <input
              id="new-password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block" htmlFor="confirm-password">
            <span className="micro-sm text-muted-foreground">Confirmă parola nouă</span>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </>
      )}
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
        {busy ? "Se procesează…" : verified ? "Salvează parola" : "Verifică codul"}
      </button>
    </form>
  );
}
