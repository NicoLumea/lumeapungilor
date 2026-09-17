import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AccessDenied } from "@/components/site/AccessDenied";
import { useAuth, type AuthState } from "@/lib/use-auth";

export type AccessLevel = "customer" | "staff" | "admin" | "owner";

function allowed(auth: AuthState, level: AccessLevel): boolean {
  if (level === "customer") return !!auth.user;
  if (level === "staff") return auth.isStaff;
  if (level === "admin") return auth.isAdmin;
  return auth.isOwner;
}

export function RequireAccess({
  level,
  children,
}: {
  level: AccessLevel;
  children: (auth: AuthState) => ReactNode;
}) {
  const auth = useAuth();
  const href = useRouterState({ select: (s) => s.location.href });

  if (auth.loading) {
    return <p className="py-32 text-center text-sm text-muted-foreground">Se încarcă…</p>;
  }

  if (!auth.user) {
    return (
      <AccessDenied
        title="Autentificare necesară"
        message="Pentru această pagină ai nevoie de un cont. Te poți autentifica sau crea un cont, apoi revii aici."
        showLogin
        redirectTo={href}
      />
    );
  }

  if (!allowed(auth, level)) {
    return (
      <AccessDenied message="Contul tău nu are drepturile necesare pentru această secțiune. Dacă ai nevoie de acces, contactează un administrator." />
    );
  }

  return <>{children(auth)}</>;
}
