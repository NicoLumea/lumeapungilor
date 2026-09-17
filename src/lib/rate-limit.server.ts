/** Server-only sliding-window rate limiting backed by public.rate_limits. */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const key = identifier.toLowerCase().slice(0, 200);
  const now = Date.now();

  const { data } = await supabaseAdmin
    .from("rate_limits")
    .select("window_start, hits")
    .eq("bucket", bucket)
    .eq("identifier", key)
    .maybeSingle();

  if (!data) {
    await supabaseAdmin
      .from("rate_limits")
      .upsert(
        { bucket, identifier: key, window_start: new Date(now).toISOString(), hits: 1 },
        { onConflict: "bucket,identifier" },
      );
    return { allowed: true };
  }

  const started = new Date(data.window_start).getTime();
  if (now - started > windowSeconds * 1000) {
    await supabaseAdmin
      .from("rate_limits")
      .update({ window_start: new Date(now).toISOString(), hits: 1 })
      .eq("bucket", bucket)
      .eq("identifier", key);
    return { allowed: true };
  }

  if (data.hits >= limit) return { allowed: false };

  await supabaseAdmin
    .from("rate_limits")
    .update({ hits: data.hits + 1 })
    .eq("bucket", bucket)
    .eq("identifier", key);
  return { allowed: true };
}

/** Server-only audit writer. */
export async function audit(entry: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: entry.actorId ?? null,
    actor_email: entry.actorEmail ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    details: entry.details ?? {},
  });
}
