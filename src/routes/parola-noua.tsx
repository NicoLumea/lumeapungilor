import { createFileRoute, Link } from "@tanstack/react-router";
import { PasswordRecoveryForm } from "@/components/site/PasswordRecoveryForm";

export const Route = createFileRoute("/parola-noua")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Setează o parolă nouă — Lumea Pungilor" },
      { name: "description", content: "Verifică un cod de recuperare și setează o parolă nouă." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  return (
    <main className="site-container max-w-[480px] py-20 sm:py-28">
      <h1 className="display text-3xl">Setează o parolă nouă</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Introdu adresa de email și codul de 6 cifre din cel mai recent mesaj de recuperare. Codul
        este valabil o perioadă limitată și poate fi folosit o singură dată.
      </p>
      <PasswordRecoveryForm />
      <Link to="/resetare-parola" className="micro-sm mt-6 inline-block link-underline">
        Solicită un cod nou
      </Link>
    </main>
  );
}
