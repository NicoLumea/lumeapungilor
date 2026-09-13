import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminState = {
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
};

export function useAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({ loading: true, user: null, isAdmin: false });

  useEffect(() => {
    let active = true;

    async function resolve(user: User | null) {
      if (!user) {
        if (active) setState({ loading: false, user: null, isAdmin: false });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active) setState({ loading: false, user, isAdmin: !!data });
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
  }, []);

  return state;
}
