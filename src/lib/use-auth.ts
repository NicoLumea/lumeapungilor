import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getStaffVerificationStatus } from "@/lib/staff-mfa.functions";
import { effectiveRole, requiresStaffEmailVerification, type AppRole } from "@/lib/authorization";

export type { AppRole } from "@/lib/authorization";

export type AuthState = {
  loading: boolean;
  user: User | null;
  roles: AppRole[];
  effectiveRole: AppRole;
  isCustomer: boolean;
  isEmployee: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isStaff: boolean;
  staffVerificationRequired: boolean;
  staffVerified: boolean;
  staffVerificationLoading: boolean;
  maskedStaffEmail: string | null;
  error: string | null;
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
  error: string | null;
};

const SIGNED_OUT_STATE: InternalAuthState = {
  loading: false,
  user: null,
  roles: [],
  staffVerificationRequired: false,
  staffVerified: false,
  staffVerificationLoading: false,
  maskedStaffEmail: null,
  error: null,
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
    error: null,
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
      if (active)
        setState({
          loading: true,
          user,
          roles: [],
          staffVerificationRequired: false,
          staffVerified: false,
          staffVerificationLoading: true,
          maskedStaffEmail: null,
          error: null,
        });
      try {
        const status = await getVerificationStatus();
        if ("error" in status && status.error) throw new Error(status.error);
        const roleValues: string[] = status.roles;
        const roles = roleValues.filter(
          (role): role is AppRole =>
            role === "customer" || role === "employee" || role === "admin" || role === "owner",
        );
        if (active)
          setState({
            loading: false,
            user,
            roles,
            staffVerificationRequired: status.required || requiresStaffEmailVerification(roles),
            staffVerified: status.verified,
            staffVerificationLoading: false,
            maskedStaffEmail: "maskedEmail" in status ? (status.maskedEmail ?? null) : null,
            error: null,
          });
      } catch {
        if (active)
          setState({
            loading: false,
            user,
            roles: [],
            staffVerificationRequired: true,
            staffVerified: false,
            staffVerificationLoading: false,
            maskedStaffEmail: null,
            error: "Rolul sau sesiunea nu au putut fi verificate. Reîncearcă.",
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
    effectiveRole: effectiveRole(roles),
    isCustomer: !!state.user,
    isEmployee,
    isAdmin,
    isOwner,
    isStaff: isEmployee,
    staffVerificationRequired: state.staffVerificationRequired,
    staffVerified: state.staffVerified,
    staffVerificationLoading: state.staffVerificationLoading,
    maskedStaffEmail: state.maskedStaffEmail,
    error: state.error,
    refresh,
  };
}

export async function signOutCleanly(): Promise<void> {
  await supabase.auth.signOut();
}
