import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getStaffVerificationStatus } from "@/lib/staff-mfa.functions";

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
  staffVerificationRequired: boolean;
  staffVerified: boolean;
  staffVerificationLoading: boolean;
  maskedStaffEmail: string | null;
  refresh: () => void;
};

type InternalAuthState = {
  loading: boolean;
  user: User | null;
  roles: AppRole[];
  staffVerificationRequired: boolean;
  staffVerified: boolean;
  staffVerificationLoading: boolean;
  maskedStaffEmail: string | null;
};

const SIGNED_OUT_STATE: InternalAuthState = {
  loading: false,
  user: null,
  roles: [],
  staffVerificationRequired: false,
  staffVerified: false,
  staffVerificationLoading: false,
  maskedStaffEmail: null,
};

export function useAuth(): AuthState {
  const getVerificationStatus = useServerFn(getStaffVerificationStatus);
  const [state, setState] = useState<InternalAuthState>({
    loading: true,
    user: null,
    roles: [],
    staffVerificationRequired: false,
    staffVerified: false,
    staffVerificationLoading: false,
    maskedStaffEmail: null,
  });
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;

    async function resolve(user: User | null) {
      if (!user) {
        if (active) setState(SIGNED_OUT_STATE);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (data ?? []).map((r) => r.role as AppRole);
      const privileged = roles.some((role) =>
        (["employee", "admin", "owner"] as AppRole[]).includes(role),
      );
      if (!privileged) {
        if (active)
          setState({
            loading: false,
            user,
            roles,
            staffVerificationRequired: false,
            staffVerified: true,
            staffVerificationLoading: false,
            maskedStaffEmail: null,
          });
        return;
      }

      if (active)
        setState({
          loading: false,
          user,
          roles,
          staffVerificationRequired: true,
          staffVerified: false,
          staffVerificationLoading: true,
          maskedStaffEmail: null,
        });
      try {
        const status = await getVerificationStatus();
        if (active)
          setState({
            loading: false,
            user,
            roles,
            staffVerificationRequired: status.required,
            staffVerified: status.verified,
            staffVerificationLoading: false,
            maskedStaffEmail: "maskedEmail" in status ? (status.maskedEmail ?? null) : null,
          });
      } catch {
        if (active)
          setState({
            loading: false,
            user,
            roles,
            staffVerificationRequired: true,
            staffVerified: false,
            staffVerificationLoading: false,
            maskedStaffEmail: null,
          });
      }
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
  }, [getVerificationStatus, tick]);

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
    staffVerificationRequired: state.staffVerificationRequired,
    staffVerified: state.staffVerified,
    staffVerificationLoading: state.staffVerificationLoading,
    maskedStaffEmail: state.maskedStaffEmail,
    refresh,
  };
}

export async function signOutCleanly(): Promise<void> {
  await supabase.auth.signOut();
}
