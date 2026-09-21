import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Mode = "in" | "up" | "reset";

/** Mirrors the minimum password length enforced by the authentication backend. */
const MIN_PASSWORD_LENGTH = 8;

function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  error,
  hint,
  inputRef,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  error?: string | undefined;
  hint?: string | undefined;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="block">
        <span className="micro-sm text-muted-foreground">{label}</span>
      </label>
      <span className="relative mt-2 block">
        <input
          id={id}
          ref={inputRef}
          type={isPassword && reveal ? "text" : type}
          required
          value={value}
          autoComplete={autoComplete ?? "off"}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border bg-background px-3 py-2 text-sm outline-none focus:border-foreground ${isPassword ? "pr-24" : ""}`}
          style={{ borderColor: error ? "var(--destructive)" : "var(--input)" }}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-pressed={reveal}
            aria-label={reveal ? "Ascunde parola" : "Afișează parola"}
            className="micro-sm absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {reveal ? "Ascunde" : "Afișează"}
          </button>
        ) : null}
      </span>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function romanianError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail sau parolă incorecte.";
  if (m.includes("email not confirmed"))
    return "Confirmă întâi adresa de e-mail din mesajul primit.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Nu am putut finaliza înregistrarea cu datele introduse. Dacă ai deja cont, autentifică-te sau resetează parola.";
  if (m.includes("password"))
    return `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.`;
  if (m.includes("rate limit") || m.includes("too many"))
    return "Prea multe încercări. Te rugăm să reîncerci peste câteva minute.";
  return "Ceva nu a funcționat. Te rugăm să încerci din nou.";
}

export function AuthPanel({
  onSignedIn,
  onSignedUp,
  emailRedirectTo = "/cont",
}: {
  onSignedIn?: () => void;
  onSignedUp?: (authenticated: boolean) => void;
  emailRedirectTo?: string;
}) {
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const passwordLongEnough = password.length >= MIN_PASSWORD_LENGTH;

  function validate(): boolean {
    const next: Record<string, string | undefined> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      next["email"] = "Introdu o adresă de e-mail validă.";
    if (mode !== "reset" && !passwordLongEnough)
      next["password"] = `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.`;
    if (mode === "up") {
      if (password !== confirm) next["confirm"] = "Cele două parole nu coincid.";
      if (!privacy) next["privacy"] = "Confirmă că ai citit Politica de confidențialitate.";
    }
    setErrors(next);
    if (next["email"]) emailRef.current?.focus();
    else if (next["password"]) passwordRef.current?.focus();
    else if (next["confirm"]) confirmRef.current?.focus();
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(null);
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bine ai revenit.");
        onSignedIn?.();
      } else if (mode === "up") {
        const safeEmailRedirect =
          emailRedirectTo.startsWith("/") && !emailRedirectTo.startsWith("//")
            ? emailRedirectTo
            : "/cont";
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${safeEmailRedirect}` },
        });
        if (error) throw error;
        if (!data.session) {
          setSent("Ți-am trimis un e-mail de confirmare. Confirmă adresa, apoi autentifică-te.");
          setMode("in");
          onSignedUp?.(false);
        } else {
          onSignedUp?.(true);
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/parola-noua`,
        });
        if (error) throw error;
        setSent("Dacă există un cont pentru această adresă, vei primi un e-mail cu instrucțiuni.");
      }
    } catch (err) {
      toast.error(romanianError(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-border p-5 sm:p-6">
      <div className="flex gap-6 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => {
            setMode("in");
            setErrors({});
          }}
          className={`micro-sm min-h-9 ${mode !== "up" ? "text-foreground underline underline-offset-4" : "text-muted-foreground"}`}
        >
          Autentificare
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("up");
            setErrors({});
          }}
          className={`micro-sm min-h-9 ${mode === "up" ? "text-foreground underline underline-offset-4" : "text-muted-foreground"}`}
        >
          Creează cont
        </button>
      </div>

      {sent ? (
        <p className="mt-5 border border-border bg-field p-3 text-sm" role="status">
          {sent}
        </p>
      ) : null}

      {mode === "up" ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Crearea unui cont este opțională. Poți continua cumpărăturile și plasa o comandă ca
          vizitator.
        </p>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <Field
          id="auth-email"
          label="E-mail"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setErrors((e) => ({ ...e, email: undefined }));
          }}
          autoComplete="email"
          error={errors["email"]}
          inputRef={emailRef}
        />
        {mode !== "reset" ? (
          <Field
            id="auth-password"
            label="Parolă"
            type="password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setErrors((e) => ({ ...e, password: undefined }));
            }}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            error={errors["password"]}
            inputRef={passwordRef}
          />
        ) : null}
        {mode === "up" ? (
          <>
            <p className="text-xs" aria-live="polite">
              <span className={passwordLongEnough ? "text-foreground" : "text-muted-foreground"}>
                {passwordLongEnough ? "✓" : "•"} Minimum {MIN_PASSWORD_LENGTH} caractere
              </span>
            </p>
            <Field
              id="auth-confirm"
              label="Confirmă parola"
              type="password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                setErrors((e) => ({ ...e, confirm: undefined }));
              }}
              autoComplete="new-password"
              error={errors["confirm"]}
              inputRef={confirmRef}
            />
            <div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => {
                    setPrivacy(e.target.checked);
                    setErrors((x) => ({ ...x, privacy: undefined }));
                  }}
                  aria-invalid={!!errors["privacy"]}
                  aria-describedby={errors["privacy"] ? "privacy-error" : undefined}
                  className="mt-1 size-4 accent-foreground"
                />
                <span className="text-muted-foreground">
                  Am citit{" "}
                  <Link to="/confidentialitate" target="_blank" className="link-underline">
                    Politica de confidențialitate
                  </Link>
                  .
                </span>
              </label>
              {errors["privacy"] ? (
                <p id="privacy-error" role="alert" className="mt-1 text-sm text-destructive">
                  {errors["privacy"]}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              După înregistrare, este posibil să fie necesar să confirmi adresa de email înainte de
              autentificare.
            </p>
          </>
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
        onClick={() => {
          setMode(mode === "reset" ? "in" : "reset");
          setErrors({});
        }}
      >
        {mode === "reset" ? "Înapoi la autentificare" : "Ai uitat parola?"}
      </button>
    </div>
  );
}
