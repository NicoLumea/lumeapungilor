import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReturnRequest = {
  id: string;
  order_number: string | null;
  email: string;
  kind: string;
  message: string;
  status: string;
  resolution: string | null;
  created_at: string;
};

export type ContactRequest = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

export const RETURN_KIND_LABEL: Record<string, string> = {
  retur: "Retur",
  retragere: "Retragere din contract",
  reclamatie: "Reclamație",
  defect: "Produs defect",
};

export function useReturnRequests() {
  return useQuery({
    queryKey: ["dashboard", "returns"],
    queryFn: async (): Promise<ReturnRequest[]> => {
      const { data, error } = await supabase
        .from("return_requests")
        .select("id,order_number,email,kind,message,status,resolution,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReturnRequest[];
    },
  });
}

export function useContactRequests() {
  return useQuery({
    queryKey: ["dashboard", "messages"],
    queryFn: async (): Promise<ContactRequest[]> => {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("id,name,email,subject,message,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactRequest[];
    },
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["dashboard", "audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id,actor_id,actor_email,action,entity,entity_id,details,created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEmployeeRequests() {
  return useQuery({
    queryKey: ["dashboard", "employee-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_requests")
        .select("id,user_id,email,message,status,reviewed_at,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRoleChangeRequests() {
  return useQuery({
    queryKey: ["dashboard", "role-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_change_requests")
        .select("id,candidate_email,requester_email,requested_role,status,decided_at,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeam() {
  return useQuery({
    queryKey: ["dashboard", "team"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id,role")
        .in("role", ["employee", "admin", "owner"]);
      if (error) throw error;
      const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
      if (ids.length === 0) return [] as { user_id: string; email: string | null; roles: string[] }[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,email")
        .in("id", ids);
      return ids.map((id) => ({
        user_id: id,
        email: (profiles ?? []).find((p) => p.id === id)?.email ?? null,
        roles: (roles ?? []).filter((r) => r.user_id === id).map((r) => r.role as string),
      }));
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["dashboard", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,company_name,city,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGuestCartLimit() {
  return useQuery({
    queryKey: ["settings", "guest_cart_max_distinct_products"],
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "guest_cart_max_distinct_products")
        .maybeSingle();
      const raw = (data?.value ?? {}) as Record<string, unknown>;
      return typeof raw["value"] === "number" ? (raw["value"] as number) : 3;
    },
  });
}

export function useMyOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ["account", "orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,status,payment_status,total,created_at,order_items(product_name,quantity,line_total)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyReturns(userId: string | undefined) {
  return useQuery({
    queryKey: ["account", "returns", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ReturnRequest[]> => {
      const { data, error } = await supabase
        .from("return_requests")
        .select("id,order_number,email,kind,message,status,resolution,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReturnRequest[];
    },
  });
}

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["account", "profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
