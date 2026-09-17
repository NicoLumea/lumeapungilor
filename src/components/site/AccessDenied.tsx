import { Link } from "@tanstack/react-router";

export function AccessDenied({
  title = "Acces restricționat",
  message = "Contul tău nu are drepturile necesare pentru această pagină.",
  showLogin = false,
  redirectTo,
}: {
  title?: string;
  message?: string;
  showLogin?: boolean;
  redirectTo?: string;
}) {
  return (
    <div className="site-container max-w-[560px] py-28 text-center">
      <h1 className="display text-2xl">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {showLogin ? (
          <Link
            to="/"
            search={redirectTo ? { redirect: redirectTo } : undefined}
            hash="cont"
            className="micro inline-flex min-h-11 items-center border border-foreground bg-foreground px-6 py-3 text-background"
          >
            Autentificare
          </Link>
        ) : null}
        <Link
          to="/magazin"
          className="micro inline-flex min-h-11 items-center border border-foreground px-6 py-3 transition-colors hover:bg-foreground hover:text-background"
        >
          Înapoi în magazin
        </Link>
      </div>
    </div>
  );
}
