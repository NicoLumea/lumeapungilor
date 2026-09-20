import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { clearGuestAccess } from "@/lib/guest-access";

export function AccountNav() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const auth = useAuth();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    clearGuestAccess();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-4">
      <Link
        to="/cont"
        activeProps={{ className: "micro-sm text-foreground underline underline-offset-4" }}
        inactiveProps={{ className: "micro-sm text-muted-foreground hover:text-foreground" }}
      >
        Profil
      </Link>
      <Link
        to="/comenzile-mele"
        activeProps={{ className: "micro-sm text-foreground underline underline-offset-4" }}
        inactiveProps={{ className: "micro-sm text-muted-foreground hover:text-foreground" }}
      >
        Comenzile mele
      </Link>
      <Link
        to="/retururi"
        activeProps={{ className: "micro-sm text-foreground underline underline-offset-4" }}
        inactiveProps={{ className: "micro-sm text-muted-foreground hover:text-foreground" }}
      >
        Retururi și reclamații
      </Link>
      <Link
        to="/contact"
        className="micro-sm text-muted-foreground hover:text-foreground"
      >
        Contact
      </Link>
      {auth.isStaff ? (
        <Link to="/staff" className="micro-sm text-muted-foreground hover:text-foreground">
          Panou angajați
        </Link>
      ) : null}
      {auth.isAdmin ? (
        <Link to="/admin" className="micro-sm text-muted-foreground hover:text-foreground">
          Administrare
        </Link>
      ) : null}
      <button
        type="button"
        onClick={signOut}
        className="micro-sm ml-auto text-muted-foreground hover:text-foreground"
      >
        Deconectare
      </button>
    </nav>
  );
}
