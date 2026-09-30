import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { AUTHORIZATION_DENIED, hasVerifiedPrivilegedAccess } from "@/lib/authorization.server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const DENIED = AUTHORIZATION_DENIED;

async function rolesOf(userId: string): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as string);
}

/* ----------------------------------------------------------- employee access */

export const requestEmployeeAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ message: z.string().trim().max(1000).optional() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<ActionResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims["email"] as string | undefined) ?? "";
    const pending = await supabaseAdmin
      .from("employee_requests")
      .select("id")
      .eq("user_id", context.userId)
      .eq("status", "pending")
      .maybeSingle();
    if (pending.data) return { ok: false, error: "Ai deja o cerere în așteptare." };

    const { error } = await supabaseAdmin.from("employee_requests").insert({
      user_id: context.userId,
      email,
      message: data.message ?? null,
      status: "pending",
    });
    if (error) return { ok: false, error: "Cererea nu a putut fi trimisă." };
    return { ok: true };
  });

export const decideEmployeeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<ActionResult> => {
    if (!(await hasVerifiedPrivilegedAccess(context.userId, context.claims, "admin"))) {
      return { ok: false, error: DENIED };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { audit } = await import("./rate-limit.server");
    const { data: req } = await supabaseAdmin
      .from("employee_requests")
      .select("id, user_id, email, status")
      .eq("id", data.requestId)
      .maybeSingle();
    if (!req) return { ok: false, error: "Cererea nu există." };
    if (req.status !== "pending") return { ok: false, error: "Cererea a fost deja procesată." };
    if (req.user_id === context.userId)
      return { ok: false, error: "Nu îți poți aproba propria cerere." };

    if (data.decision === "approved") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: req.user_id, role: "employee" }, { onConflict: "user_id,role" });
      if (error) return { ok: false, error: "Rolul nu a putut fi acordat." };
    }

    await supabaseAdmin
      .from("employee_requests")
      .update({
        status: data.decision,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        decision_note: data.note ?? null,
      })
      .eq("id", req.id);

    await audit({
      actorId: context.userId,
      actorEmail: (context.claims["email"] as string | undefined) ?? null,
      action: `employee_request.${data.decision}`,
      entity: "employee_requests",
      entityId: req.id,
      details: { candidate: req.email },
    });
    return { ok: true };
  });

export const setEmployeeSuspension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), revoke: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<ActionResult> => {
    if (!(await hasVerifiedPrivilegedAccess(context.userId, context.claims, "admin"))) {
      return { ok: false, error: DENIED };
    }
    if (data.userId === context.userId)
      return { ok: false, error: "Nu îți poți modifica propriul acces." };

    const targetRoles = await rolesOf(data.userId);
    if (targetRoles.includes("admin") || targetRoles.includes("owner"))
      return { ok: false, error: "Conturile de administrator nu pot fi modificate aici." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { audit } = await import("./rate-limit.server");
    if (data.revoke) {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "employee");
    } else {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "employee" }, { onConflict: "user_id,role" });
    }
    await audit({
      actorId: context.userId,
      action: data.revoke ? "employee.revoked" : "employee.restored",
      entity: "user_roles",
      entityId: data.userId,
    });
    return { ok: true };
  });

/* -------------------------------------------------- administrator promotion */

export const requestAdminPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ candidateEmail: z.string().trim().email().max(200) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<ActionResult> => {
    if (!(await hasVerifiedPrivilegedAccess(context.userId, context.claims, "admin"))) {
      return { ok: false, error: DENIED };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { audit } = await import("./rate-limit.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .ilike("email", data.candidateEmail)
      .maybeSingle();
    if (!profile) return { ok: false, error: "Nu există un cont cu acest e-mail." };

    const { data: request, error } = await supabaseAdmin
      .from("role_change_requests")
      .insert({
        candidate_user_id: profile.id,
        candidate_email: profile.email ?? data.candidateEmail,
        requested_role: "admin",
        requested_by: context.userId,
        requester_email: (context.claims["email"] as string | undefined) ?? null,
        status: "pending_owner_approval",
      })
      .select("id")
      .single();
    if (error || !request) return { ok: false, error: "Cererea nu a putut fi înregistrată." };

    await audit({
      actorId: context.userId,
      action: "admin_promotion.requested",
      entity: "role_change_requests",
      entityId: request.id,
      details: { candidate: profile.email },
    });
    return { ok: true };
  });

/**
 * Only an authenticated account that already has the owner role can finalise
 * an administrator promotion. The bootstrap secret is never accepted here.
 */
export const decideAdminPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<ActionResult> => {
    const roles = await rolesOf(context.userId);
    if (!(await hasVerifiedPrivilegedAccess(context.userId, context.claims, "owner")))
      return { ok: false, error: "Doar proprietarul proiectului poate aproba această cerere." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { audit } = await import("./rate-limit.server");
    const { data: req } = await supabaseAdmin
      .from("role_change_requests")
      .select("id, candidate_user_id, candidate_email, requested_by, status")
      .eq("id", data.requestId)
      .maybeSingle();
    if (!req) return { ok: false, error: "Cererea nu există." };
    if (req.status !== "pending_owner_approval")
      return { ok: false, error: "Cererea a fost deja procesată." };
    if (req.candidate_user_id === context.userId && !roles.includes("owner"))
      return { ok: false, error: "Nu îți poți aproba propria promovare." };

    if (data.decision === "approved") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: req.candidate_user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) return { ok: false, error: "Rolul nu a putut fi acordat." };
    }

    await supabaseAdmin
      .from("role_change_requests")
      .update({
        status: data.decision,
        decided_by: context.userId,
        decided_at: new Date().toISOString(),
        decision_note: data.note ?? null,
      })
      .eq("id", req.id);

    await audit({
      actorId: context.userId,
      action: `admin_promotion.${data.decision}`,
      entity: "role_change_requests",
      entityId: req.id,
      details: { candidate: req.candidate_email },
    });
    return { ok: true };
  });

/* ------------------------------------------------------- guest order support */

export const guestOrderEligibility = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().trim().email().max(200) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ allowed: boolean; reason?: string }> => {
    const { checkRateLimit } = await import("./rate-limit.server");
    const limit = await checkRateLimit("guest_eligibility", data.email, 20, 600);
    if (!limit.allowed)
      return { allowed: false, reason: "Prea multe verificări. Încearcă mai târziu." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: used } = await supabaseAdmin
      .from("guest_checkout_usage")
      .select("email")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (used)
      return {
        allowed: false,
        reason:
          "Această adresă a folosit deja comanda fără cont. Creează un cont sau autentifică-te pentru a comanda din nou.",
      };
    return { allowed: true };
  });

/* ---------------------------------------------- contact messages */

export const submitContactRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(200),
        subject: z.string().trim().max(160).optional(),
        message: z.string().trim().min(10).max(3000),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<ActionResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { checkRateLimit } = await import("./rate-limit.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");

    let userId: string | null = null;
    let email = data.email.toLowerCase();
    let name = data.name;
    const authHeader = getRequestHeader("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: authUser } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
      if (authUser.user) {
        userId = authUser.user.id;
        email = authUser.user.email?.toLowerCase() ?? email;
        name = (authUser.user.user_metadata["full_name"] as string | undefined)?.trim() || name;
      }
    }

    const limit = await checkRateLimit("contact", email, 5, 3600);
    if (!limit.allowed)
      return { ok: false, error: "Ai trimis prea multe mesaje. Te rugăm să reîncerci mai târziu." };

    const { error } = await supabaseAdmin.from("contact_requests").insert({
      user_id: userId,
      name,
      email,
      subject: data.subject ?? null,
      message: data.message,
    });
    if (error) return { ok: false, error: "Mesajul nu a putut fi trimis." };
    return { ok: true };
  });
