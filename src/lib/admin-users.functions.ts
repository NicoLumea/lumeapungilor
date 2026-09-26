import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const filtersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  role: z.enum(["customer", "employee", "admin"]).optional(),
  source: z.enum(["account", "order", "restock"]).optional(),
  status: z.enum(["active", "disabled", "pending"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sort: z.enum(["newest", "latest_login", "latest_order", "email"]).default("newest"),
});

const pageSchema = filtersSchema.extend({
  page: z.number().int().min(1).max(100_000).default(1),
});

const interestPageSchema = filtersSchema
  .pick({ search: true, source: true, dateFrom: true, dateTo: true })
  .extend({ page: z.number().int().min(1).max(100_000).default(1) });

export type AdminUserRow = {
  id: string;
  email: string;
  role: "customer" | "employee" | "admin";
  created_at: string;
  email_confirmed: boolean;
  last_sign_in_at: string | null;
  account_status: "active" | "disabled" | "pending";
  order_count: number;
  latest_order_at: string | null;
  cart_item_count: number | null;
  restock_count: number;
  latest_signal_at: string | null;
  source_label: string;
};

export type AccountStats = {
  total_accounts: number;
  customers: number;
  employees: number;
  administrators: number;
  accounts_with_signal: number;
};

export type InterestRow = {
  id: string;
  email: string;
  source: "account" | "order" | "restock";
  source_label: string;
  summary: string | null;
  activity_at: string;
  order_status: string | null;
};

export type AccountsPayload = {
  rows: AdminUserRow[];
  filteredCount: number;
  stats: AccountStats;
};

export type InterestPayload = { rows: InterestRow[]; filteredCount: number };
export type AdminUsersFailure = { ok: false; kind: "forbidden" | "error"; error: string };

async function verifyAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error("Rolul contului nu a putut fi verificat.");
  return (data ?? []).some((entry) => entry.role === "admin" || entry.role === "owner");
}

function rpcArgs(filters: z.infer<typeof filtersSchema>) {
  return {
    _sort: filters.sort,
    ...(filters.search ? { _search: filters.search } : {}),
    ...(filters.role ? { _role: filters.role } : {}),
    ...(filters.source ? { _source: filters.source } : {}),
    ...(filters.status ? { _status: filters.status } : {}),
    ...(filters.dateFrom ? { _date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { _date_to: filters.dateTo } : {}),
  };
}

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => pageSchema.parse(input))
  .handler(
    async ({ data, context }): Promise<{ ok: true; data: AccountsPayload } | AdminUsersFailure> => {
      if (!(await verifyAdmin(context.supabase, context.userId))) {
        return { ok: false, kind: "forbidden", error: "Acces interzis." };
      }
      const { data: payload, error } = await context.supabase.rpc("admin_users_dashboard", {
        ...rpcArgs(data),
        _page: data.page,
        _page_size: 25,
      });
      if (error || !payload) {
        return { ok: false, kind: "error", error: "Conturile nu au putut fi încărcate." };
      }
      return { ok: true, data: payload as unknown as AccountsPayload };
    },
  );

export const getAdminInterest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => interestPageSchema.parse(input))
  .handler(
    async ({ data, context }): Promise<{ ok: true; data: InterestPayload } | AdminUsersFailure> => {
      if (!(await verifyAdmin(context.supabase, context.userId))) {
        return { ok: false, kind: "forbidden", error: "Acces interzis." };
      }
      const { data: payload, error } = await context.supabase.rpc("admin_interest_dashboard", {
        _page: data.page,
        _page_size: 25,
        ...(data.search ? { _search: data.search } : {}),
        ...(data.source ? { _source: data.source } : {}),
        ...(data.dateFrom ? { _date_from: data.dateFrom } : {}),
        ...(data.dateTo ? { _date_to: data.dateTo } : {}),
      });
      if (error || !payload) {
        return { ok: false, kind: "error", error: "Interesul comercial nu a putut fi încărcat." };
      }
      return { ok: true, data: payload as unknown as InterestPayload };
    },
  );

function csvCell(value: string | number | boolean | null): string {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

export const exportAdminUsersCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => filtersSchema.parse(input))
  .handler(
    async ({
      data,
      context,
    }): Promise<
      | { ok: true; csv: string; rowCount: number; truncated: boolean; filename: string }
      | AdminUsersFailure
    > => {
      if (!(await verifyAdmin(context.supabase, context.userId))) {
        return { ok: false, kind: "forbidden", error: "Acces interzis." };
      }
      const { data: payload, error } = await context.supabase.rpc(
        "admin_users_export",
        rpcArgs(data),
      );
      if (error || !payload) {
        return { ok: false, kind: "error", error: "Exportul nu a putut fi generat." };
      }
      const exportPayload = payload as unknown as {
        rows: AdminUserRow[];
        rowCount: number;
        truncated: boolean;
      };
      const header = [
        "Email",
        "Rol",
        "Creat la",
        "Email confirmat",
        "Ultima autentificare",
        "Status cont",
        "Număr comenzi",
        "Ultima comandă",
        "Articole coș autentificat",
        "Cereri revenire în stoc",
        "Sursă/status",
      ];
      const lines = exportPayload.rows.map((row) =>
        [
          row.email,
          row.role,
          row.created_at,
          row.email_confirmed,
          row.last_sign_in_at,
          row.account_status,
          row.order_count,
          row.latest_order_at,
          row.cart_item_count,
          row.restock_count,
          row.source_label,
        ]
          .map(csvCell)
          .join(","),
      );
      return {
        ok: true,
        csv: `\uFEFF${header.map(csvCell).join(",")}\r\n${lines.join("\r\n")}`,
        rowCount: exportPayload.rowCount,
        truncated: exportPayload.truncated,
        filename: `utilizatori-${new Date().toISOString().slice(0, 10)}.csv`,
      };
    },
  );
