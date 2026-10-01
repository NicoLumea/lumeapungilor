import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  confirmStaffVerificationCode,
  clearStaffVerification,
  resendStaffVerificationCode,
} from "@/lib/staff-mfa.functions";
import type { AuthState } from "@/lib/use-auth";

export function StaffVerification({ auth }: { auth: AuthState }) {
  const confirm = useServerFn(confirmStaffVerificationCode);
  const resend = useServerFn(resendStaffVerificationCode);
  const clearVerification = useServerFn(clearStaffVerification);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Introdu codul de verificare format din 6 cifre.");
      return;
    }
    setBusy(true);
    try {
      const result = await confirm({ data: { code } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Autentificarea personalului a fost verificată.");
      auth.refresh();
    } catch {
      toast.error("Codul de verificare este invalid sau a expirat.");
    } finally {
      setBusy(false);
    }
  }

  async function sendAgain() {
    setBusy(true);
    try {
      const result = await resend({ data: {} });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Am trimis un cod nou.");
    } catch {
      toast.error("Codul nu a putut fi retrimis momentan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[440px] px-4 py-24">
      <h1 className="display text-2xl">Verifică autentificarea</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Am trimis un cod de verificare la adresa de email asociată contului tău
        {auth.maskedStaffEmail ? ` (${auth.maskedStaffEmail})` : ""}. Accesul intern rămâne blocat
        până la confirmarea codului.
      </p>
      <form onSubmit={verify} className="mt-8 space-y-5">
        <label className="block">
          <span className="micro-sm text-muted-foreground">Cod de verificare</span>
          <input
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-2 w-full border border-input bg-background px-3 py-3 text-center text-xl tracking-[0.35em] outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="micro min-h-11 w-full border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy ? "Se verifică…" : "Verifică"}
        </button>
      </form>
      <div className="mt-5 flex flex-wrap gap-5">
        <button
          type="button"
          disabled={busy}
          onClick={sendAgain}
          className="micro-sm min-h-10 underline underline-offset-4 disabled:opacity-40"
        >
          Retrimite codul
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await clearVerification({ data: {} });
            } catch {
              // Supabase sign-out still revokes the authentication session.
            }
            await supabase.auth.signOut();
            window.location.assign("/autentificare");
          }}
          className="micro-sm min-h-10 text-muted-foreground underline underline-offset-4"
        >
          Înapoi la autentificare
        </button>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Aceasta este o verificare suplimentară la nivelul aplicației. Sesiunea Supabase nu este
        marcată drept AAL2.
      </p>
    </div>
  );
}
