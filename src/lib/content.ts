import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContentMap = Record<string, Record<string, unknown>>;

export async function fetchContent(): Promise<ContentMap> {
  const { data, error } = await supabase.from("site_content").select("key,value");
  if (error) throw error;
  const map: ContentMap = {};
  for (const row of data ?? []) {
    map[row.key] = (row.value ?? {}) as Record<string, unknown>;
  }
  return map;
}

export function useContent() {
  return useQuery({ queryKey: ["site_content"], queryFn: fetchContent, staleTime: 30_000 });
}

export function text(
  block: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const v = block?.[key];
  if (typeof v === "string" && v.trim().length > 0) return v;
  if (typeof v === "number") return String(v);
  return null;
}

export function num(
  block: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const v = block?.[key];
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function useCategories(includeHidden = false) {
  return useQuery({
    queryKey: ["categories", includeHidden],
    queryFn: async () => {
      let q = supabase.from("categories").select("*").order("sort_order");
      if (!includeHidden) q = q.eq("is_visible", true);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
