import { createHmac } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { trustedClientIp } from "./auth-security.server";
import { consumeRequestBudget } from "./request-rate-limit-core";

/** Atomic fixed-window limits for the identifier and trusted client IP. */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean }> {
  return consumeRequestBudget(bucket, identifier, limit, windowSeconds, {
    clientIp: () => trustedClientIp(getRequest()),
    hash: (value) => {
      const pepper =
        process.env["LOGIN_RATE_LIMIT_PEPPER"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];
      if (!pepper || pepper.length < 24) throw new Error("Rate limit secret is not configured");
      return createHmac("sha256", pepper).update(value).digest("hex");
    },
    consume: async (budget) => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      return supabaseAdmin.rpc("consume_request_rate_limit", budget);
    },
  });
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
    details: JSON.parse(JSON.stringify(entry.details ?? {})),
  });
}
