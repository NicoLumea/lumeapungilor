import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DashboardNavItem = { to: string; label: string; exact: boolean };

export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: DashboardNavItem[];
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-border px-4 py-4 md:px-8">
        <Link to="/" className="micro">
          Lumea Pungilor
        </Link>
        <span className="micro-sm text-muted-foreground">{title}</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/staff"}
              activeOptions={{ exact: item.exact }}
              activeProps={{ className: "micro-sm text-foreground underline underline-offset-4" }}
              inactiveProps={{ className: "micro-sm text-muted-foreground hover:text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={signOut}
          className="micro-sm ml-auto text-muted-foreground hover:text-foreground"
        >
          Ieșire
        </button>
      </header>
      <main className="px-4 py-10 md:px-8">{children}</main>
    </div>
  );
}
