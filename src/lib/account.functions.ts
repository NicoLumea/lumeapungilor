import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { AUTHORIZATION_DENIED, hasPrivilegedAccess } from "@/lib/authorization.server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const DENIED = AUTHORIZATION_DENIED;

async function rolesOf(userId: string): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as string);
}

/* ----------------------------------------------------------- employee access */

export const setEmployeeSuspension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), revoke: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<ActionResult> => {
    if (!(await hasPrivilegedAccess(context.userId, "admin"))) {
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

/* -------------------------------------------------- direct staff promotion */

export const promoteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        candidateEmail: z
          .string()
          .trim()
          .email()
          .max(200)
          .transform((email) => email.toLowerCase()),
        role: z.enum(["employee", "admin"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<ActionResult> => {
    if (!(await hasPrivilegedAccess(context.userId, "admin"))) {
      return { ok: false, error: DENIED };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { audit } = await import("./rate-limit.server");
    // Profiles are customer-editable, so verify the selected email against Auth.
    const { data: profiles, error: lookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.candidateEmail);
    if (lookupError) return { ok: false, error: "Contul nu a putut fi verificat." };
    let candidate: { id: string; email?: string } | undefined;
    for (const profile of profiles ?? []) {
      const { data: authData, error } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (!error && authData.user?.email?.toLowerCase() === data.candidateEmail) {
        if (!authData.user.email_confirmed_at) {
          return {
            ok: false,
            error: "Contul trebuie să confirme adresa de e-mail înainte de promovare.",
          };
        }
        candidate = authData.user;
        break;
      }
    }
    if (!candidate) return { ok: false, error: "Nu există un cont verificat cu acest e-mail." };
    if (candidate.id === context.userId) {
      return { ok: false, error: "Nu îți poți modifica propriul acces." };
    }
    const targetRoles = await rolesOf(candidate.id);
    if (targetRoles.includes("owner") || targetRoles.includes("admin")) {
      return { ok: false, error: "Contul are deja acces de administrator." };
    }
    if (targetRoles.includes(data.role)) {
      return { ok: false, error: "Contul are deja acest rol." };
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: candidate.id, role: data.role }, { onConflict: "user_id,role" });
    if (error) return { ok: false, error: "Rolul nu a putut fi acordat." };
    await audit({
      actorId: context.userId,
      actorEmail: (context.claims["email"] as string | undefined) ?? null,
      action: "account.promoted",
      entity: "user_roles",
      entityId: candidate.id,
      details: { candidate: candidate.email, role: data.role },
    });
    return { ok: true };
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
