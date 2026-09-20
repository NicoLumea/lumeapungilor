import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MethodEntry = { label: string; description: string; enabled: boolean };

export type MethodKey = "payment_methods" | "delivery_methods";

export function parseMethods(value: unknown): MethodEntry[] {
  const list = (value as { methods?: unknown } | null)?.methods;
  if (!Array.isArray(list)) return [];
  return list
    .map((m) => m as Record<string, unknown>)
    .filter((m) => typeof m["label"] === "string" && String(m["label"]).trim().length > 0)
    .map((m) => ({
      label: String(m["label"]).trim(),
      description: typeof m["description"] === "string" ? m["description"] : "",
      enabled: m["enabled"] === true,
    }));
}

async function fetchMethods(key: MethodKey): Promise<MethodEntry[]> {
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return parseMethods(data?.value);
}

/** Only methods an administrator has explicitly confirmed are shown to customers. */
export function useMethods(key: MethodKey) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: () => fetchMethods(key),
  });
}

export function useEnabledMethods(key: MethodKey) {
  const q = useMethods(key);
  return { ...q, data: (q.data ?? []).filter((m) => m.enabled) };
}
