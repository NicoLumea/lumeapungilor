import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Search } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  exportAdminUsersCsv,
  getAdminInterest,
  getAdminUsers,
  type AdminUserRow,
  type AccountsPayload,
  type AdminUsersFailure,
  type InterestRow,
  type InterestPayload,
} from "@/lib/admin-users.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/utilizatori")({
  component: AdminUsersPage,
});

type Tab = "accounts" | "interest";
type Filters = {
  search: string;
  role: "all" | "customer" | "employee" | "admin";
  source: "all" | "account" | "order" | "restock";
  status: "all" | "active" | "disabled" | "pending";
  dateFrom: string;
  dateTo: string;
  sort: "newest" | "latest_login" | "latest_order" | "email";
};

const INITIAL_FILTERS: Filters = {
  search: "",
  role: "all",
  source: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
  sort: "newest",
};

const ROLE_LABEL = { customer: "Client", employee: "Angajat", admin: "Administrator" } as const;
const STATUS_LABEL = { active: "Activ", disabled: "Dezactivat", pending: "În așteptare" } as const;

function startOfDay(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
}

function endExclusive(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

function requestFilters(filters: Filters) {
  return {
    search: filters.search || undefined,
    role: filters.role === "all" ? undefined : filters.role,
    source: filters.source === "all" ? undefined : filters.source,
    status: filters.status === "all" ? undefined : filters.status,
    dateFrom: startOfDay(filters.dateFrom),
    dateTo: endExclusive(filters.dateTo),
    sort: filters.sort,
  };
}

function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>("accounts");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const loadAccounts = useServerFn(getAdminUsers);
  const loadInterest = useServerFn(getAdminInterest);
  const exportCsv = useServerFn(exportAdminUsersCsv);
  const normalized = requestFilters(filters);

  const accounts = useQuery({
    queryKey: ["admin-users", normalized, page],
    queryFn: () => loadAccounts({ data: { ...normalized, page } }),
    enabled: tab === "accounts",
    placeholderData: keepPreviousData,
  });
  const interest = useQuery({
    queryKey: [
      "admin-interest",
      normalized.search,
      normalized.source,
      normalized.dateFrom,
      normalized.dateTo,
      page,
    ],
    queryFn: () =>
      loadInterest({
        data: {
          search: normalized.search,
          source: normalized.source,
          dateFrom: normalized.dateFrom,
          dateTo: normalized.dateTo,
          page,
        },
      }),
    enabled: tab === "interest",
    placeholderData: keepPreviousData,
  });

  const accountPayload = accounts.data?.ok ? accounts.data.data : undefined;
  const interestPayload = interest.data?.ok ? interest.data.data : undefined;
  const activeCount =
    tab === "accounts" ? accountPayload?.filteredCount : interestPayload?.filteredCount;
  const totalPages = Math.max(1, Math.ceil((activeCount ?? 0) / 25));

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  async function downloadCsv() {
    setExporting(true);
    try {
      const result = await exportCsv({ data: normalized });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(
        `Au fost exportate ${result.rowCount} rânduri și acțiunea a fost înregistrată.`,
      );
      if (result.truncated)
        toast.warning("Exportul a fost limitat la primele 10.000 de rezultate filtrate.");
    } catch {
      toast.error("Exportul nu a putut fi generat.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="display text-3xl">Utilizatori și interes</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Conturi înregistrate și acțiuni comerciale explicite. Autentificarea singură nu este
            tratată drept intenție de cumpărare.
          </p>
        </div>
        <Button variant="outline" onClick={downloadCsv} disabled={exporting || tab !== "accounts"}>
          <Download className="size-4" /> {exporting ? "Se exportă…" : "Exportă CSV"}
        </Button>
      </div>

      {accountPayload ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Total conturi" value={accountPayload.stats.total_accounts} />
          <Stat label="Clienți" value={accountPayload.stats.customers} />
          <Stat label="Angajați" value={accountPayload.stats.employees} />
          <Stat label="Administratori" value={accountPayload.stats.administrators} />
          <Stat
            label="Comandă sau semnal activ"
            value={accountPayload.stats.accounts_with_signal}
          />
        </div>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as Tab);
          setPage(1);
        }}
        className="mt-8"
      >
        <TabsList>
          <TabsTrigger value="accounts">Conturi înregistrate</TabsTrigger>
          <TabsTrigger value="interest">Interes comercial</TabsTrigger>
        </TabsList>

        <FiltersBar tab={tab} filters={filters} update={update} />

        <TabsContent value="accounts">
          <AccountsTable
            response={accounts.data}
            loading={accounts.isLoading || accounts.isFetching}
          />
        </TabsContent>
        <TabsContent value="interest">
          <InterestTable
            response={interest.data}
            loading={interest.isLoading || interest.isFetching}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 text-sm">
        <span className="text-muted-foreground">
          {activeCount ?? 0} rezultate · pagina {Math.min(page, totalPages)} din {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Următor
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border p-4">
      <p className="micro-sm text-muted-foreground">{label}</p>
      <p className="display mt-2 text-2xl">{value}</p>
    </div>
  );
}

function FiltersBar({
  tab,
  filters,
  update,
}: {
  tab: Tab;
  filters: Filters;
  update: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
}) {
  return (
    <div className="mt-6 grid gap-3 border-y border-border py-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <label className="relative sm:col-span-2">
        <span className="sr-only">Caută după e-mail</span>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Caută după e-mail"
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          className="pl-9"
        />
      </label>
      {tab === "accounts" ? (
        <>
          <FilterSelect
            value={filters.role}
            onChange={(value) => update("role", value as Filters["role"])}
            label="Rol"
          >
            <SelectItem value="all">Toate rolurile</SelectItem>
            <SelectItem value="customer">Client</SelectItem>
            <SelectItem value="employee">Angajat</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </FilterSelect>
          <FilterSelect
            value={filters.status}
            onChange={(value) => update("status", value as Filters["status"])}
            label="Status cont"
          >
            <SelectItem value="all">Toate statusurile</SelectItem>
            <SelectItem value="active">Activ</SelectItem>
            <SelectItem value="disabled">Dezactivat</SelectItem>
            <SelectItem value="pending">În așteptare</SelectItem>
          </FilterSelect>
        </>
      ) : null}
      <FilterSelect
        value={filters.source}
        onChange={(value) => update("source", value as Filters["source"])}
        label="Sursă"
      >
        <SelectItem value="all">Toate sursele</SelectItem>
        <SelectItem value="account">Cont înregistrat</SelectItem>
        <SelectItem value="order">Comandă</SelectItem>
        <SelectItem value="restock">Revenire în stoc</SelectItem>
      </FilterSelect>
      <Input
        aria-label="De la data"
        type="date"
        value={filters.dateFrom}
        onChange={(event) => update("dateFrom", event.target.value)}
      />
      <Input
        aria-label="Până la data"
        type="date"
        value={filters.dateTo}
        onChange={(event) => update("dateTo", event.target.value)}
      />
      {tab === "accounts" ? (
        <FilterSelect
          value={filters.sort}
          onChange={(value) => update("sort", value as Filters["sort"])}
          label="Sortare"
        >
          <SelectItem value="newest">Conturi noi</SelectItem>
          <SelectItem value="latest_login">Ultima autentificare</SelectItem>
          <SelectItem value="latest_order">Ultima comandă</SelectItem>
          <SelectItem value="email">E-mail</SelectItem>
        </FilterSelect>
      ) : null}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function AccountsTable({
  response,
  loading,
}: {
  response: { ok: true; data: AccountsPayload } | AdminUsersFailure | undefined;
  loading: boolean;
}) {
  if (loading && !response) return <StateMessage>Se încarcă conturile…</StateMessage>;
  if (response && !response.ok) return <StateMessage error>{response.error}</StateMessage>;
  const rows = response?.ok ? response.data.rows : [];
  if (!rows.length)
    return <StateMessage>Nu există conturi pentru filtrele selectate.</StateMessage>;
  return (
    <div className={`mt-4 overflow-x-auto ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
      <table className="min-w-[1180px] w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {[
              "E-mail",
              "Rol",
              "Creat",
              "Confirmare",
              "Ultima autentificare",
              "Status",
              "Comenzi",
              "Ultima comandă",
              "Coș",
              "Revenire stoc",
              "Sursă/status",
            ].map((label) => (
              <th
                key={label}
                className="micro-sm whitespace-nowrap px-2 py-3 font-normal text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AccountRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccountRow({ row }: { row: AdminUserRow }) {
  return (
    <tr className="border-b border-border/60 align-top">
      <td className="px-2 py-3 font-medium">{row.email}</td>
      <td className="px-2 py-3">{ROLE_LABEL[row.role]}</td>
      <td className="px-2 py-3 text-muted-foreground">{formatDate(row.created_at)}</td>
      <td className="px-2 py-3">{row.email_confirmed ? "Confirmat" : "Neconfirmat"}</td>
      <td className="px-2 py-3 text-muted-foreground">{formatDate(row.last_sign_in_at, true)}</td>
      <td className="px-2 py-3">
        <Badge variant="outline">{STATUS_LABEL[row.account_status]}</Badge>
      </td>
      <td className="px-2 py-3">{row.order_count}</td>
      <td className="px-2 py-3 text-muted-foreground">{formatDate(row.latest_order_at)}</td>
      <td className="px-2 py-3" title="Coșurile sunt locale în versiunea curentă">
        {row.cart_item_count ?? "—"}
      </td>
      <td className="px-2 py-3">{row.restock_count}</td>
      <td className="px-2 py-3">
        <Badge variant="secondary">{row.source_label}</Badge>
      </td>
    </tr>
  );
}

function InterestTable({
  response,
  loading,
}: {
  response: { ok: true; data: InterestPayload } | AdminUsersFailure | undefined;
  loading: boolean;
}) {
  if (loading && !response) return <StateMessage>Se încarcă activitatea…</StateMessage>;
  if (response && !response.ok) return <StateMessage error>{response.error}</StateMessage>;
  const rows = response?.ok ? response.data.rows : [];
  if (!rows.length)
    return <StateMessage>Nu există acțiuni comerciale pentru filtrele selectate.</StateMessage>;
  return (
    <div className={`mt-4 overflow-x-auto ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
      <table className="min-w-[780px] w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {[
              "E-mail",
              "Sursa interesului",
              "Produs sau sumar coș/comandă",
              "Ultima activitate",
              "Status comandă/cerere",
            ].map((label) => (
              <th key={label} className="micro-sm px-2 py-3 font-normal text-muted-foreground">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: InterestRow) => (
            <tr key={row.id} className="border-b border-border/60 align-top">
              <td className="px-2 py-3 font-medium">{row.email}</td>
              <td className="px-2 py-3">
                <Badge variant="secondary">{row.source_label}</Badge>
              </td>
              <td className="max-w-md px-2 py-3 text-muted-foreground">{row.summary ?? "—"}</td>
              <td className="px-2 py-3 text-muted-foreground">
                {formatDate(row.activity_at, true)}
              </td>
              <td className="px-2 py-3">{row.order_status ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StateMessage({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mt-8 border border-border p-8 text-center text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
    >
      {children}
    </p>
  );
}

function formatDate(value: string | null, time = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(
    "ro-RO",
    time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" },
  ).format(new Date(value));
}
