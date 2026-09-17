import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/parola-noua")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Parolă nouă — Lumea Pungilor" },
      { name: "description", content: "Setează o parolă nouă pentru contul tău." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Parola trebuie să aibă cel puțin 8 caractere.");
      return;
    }
    if (password !== confirm) {
      toast.error("Cele două parole nu coincid.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("Parola nu a putut fi schimbată. Cere un link nou de resetare.");
      return;
    }
    toast.success("Parolă schimbată.");
    navigate({ to: "/cont" });
  }

  return (
    <div className="site-container max-w-[420px] py-28">
      <h1 className="display text-2xl">Parolă nouă</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="micro-sm text-muted-foreground">Parolă nouă</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="block">
          <span className="micro-sm text-muted-foreground">Confirmă parola</span>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="micro min-h-11 w-full border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy ? "Se salvează…" : "Salvează parola"}
        </button>
      </form>
    </div>
  );
}
