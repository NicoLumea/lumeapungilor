import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AccessDenied } from "@/components/site/AccessDenied";
import { StaffVerification } from "@/components/site/StaffVerification";
import { hasAccess, type AccessLevel } from "@/lib/authorization";
import { useAuth, type AuthState } from "@/lib/use-auth";

export type { AccessLevel } from "@/lib/authorization";

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

  if (auth.error) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-sm text-destructive">{auth.error}</p>
        <button type="button" className="mt-5 underline" onClick={auth.refresh}>
          Reîncearcă verificarea
        </button>
      </div>
    );
  }

  if (
    level !== "customer" &&
    auth.isStaff &&
    auth.staffVerificationRequired &&
    !auth.staffVerified
  ) {
    if (auth.staffVerificationLoading) {
      return (
        <p className="py-32 text-center text-sm text-muted-foreground">Se verifică sesiunea…</p>
      );
    }
    return <StaffVerification auth={auth} destination={href} />;
  }

  if (!hasAccess(!!auth.user, auth.roles, level)) {
    return (
      <AccessDenied message="Contul tău nu are drepturile necesare pentru această secțiune. Dacă ai nevoie de acces, contactează un administrator." />
    );
  }

  return <>{children(auth)}</>;
}
