import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearGuestAccess } from "@/lib/guest-access";

export type AppRole = "customer" | "employee" | "admin" | "owner";

export type AuthState = {
  loading: boolean;
  user: User | null;
  roles: AppRole[];
  isCustomer: boolean;
  isEmployee: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isStaff: boolean;
  refresh: () => void;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<{ loading: boolean; user: User | null; roles: AppRole[] }>({
    loading: true,
    user: null,
    roles: [],
  });
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;

    async function resolve(user: User | null) {
      if (!user) {
        if (active) setState({ loading: false, user: null, roles: [] });
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (active)
        setState({
          loading: false,
          user,
          roles: (data ?? []).map((r) => r.role as AppRole),
        });
    }

    supabase.auth.getUser().then(({ data }) => resolve(data.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        resolve(session?.user ?? null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [tick]);

  const roles = state.roles;
  const isOwner = roles.includes("owner");
  const isAdmin = isOwner || roles.includes("admin");
  const isEmployee = isAdmin || roles.includes("employee");

  return {
    loading: state.loading,
    user: state.user,
    roles,
    isCustomer: !!state.user,
    isEmployee,
    isAdmin,
    isOwner,
    isStaff: isEmployee,
    refresh,
  };
}

export async function signOutCleanly(): Promise<void> {
  clearGuestAccess();
  await supabase.auth.signOut();
}
