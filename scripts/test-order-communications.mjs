// Install @electric-sql/pglite in a temporary folder; pass its absolute entry as
// PGLITE_TEST_MODULE. This runs entirely in memory, never against Supabase.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(
  process.env.PGLITE_TEST_MODULE
    ? pathToFileURL(process.env.PGLITE_TEST_MODULE).href
    : "@electric-sql/pglite"
);
const db = new PGlite();
const staff = "00000000-0000-4000-8000-000000000001",
  other = "00000000-0000-4000-8000-000000000002",
  customer = "00000000-0000-4000-8000-000000000003",
  order = "00000000-0000-4000-8000-000000000004";
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 insert into auth.users values('${staff}'),('${other}'),('${customer}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
 create function public.is_staff() returns boolean language sql stable as $$ select auth.uid() in ('${staff}'::uuid,'${other}'::uuid) $$;
 create table public.orders(id uuid primary key,status text,payment_status text,internal_notes text,updated_at timestamptz default now(),total numeric default 130);
 create table public.site_content(key text primary key,value jsonb);
 insert into public.site_content values('terms','{"body":"Original terms and withdrawal information"}');
 create table public.audit_logs(actor_id uuid,action text,entity text,entity_id text,details jsonb);
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 grant usage on schema public to authenticated;
 grant update(status,payment_status,internal_notes) on public.orders to authenticated;
 `);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/20261003120000_order_communications.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    `insert into public.orders(id,status,payment_status) values('${order}','nou','in_asteptare');`,
  );
  const version = (await db.query(`select updated_at::text as v from orders where id='${order}'`))
    .rows[0].v;
  assert.equal(
    (await db.query("select source from order_legal_snapshots")).rows[0].source,
    "checkout",
  );
  await db.exec(`update site_content set value='{"body":"Changed terms"}';`);
  assert.match(
    (await db.query("select terms from order_legal_snapshots")).rows[0].terms,
    /Original/,
  );
  const auth = async (user) =>
    db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [user]);
  const save = (status, draft = null, confirmed = false, v = version) =>
    db.query(`select public.save_order_operations($1,$2,$3,'in_asteptare','note',$4,$5)`, [
      order,
      v,
      status,
      draft,
      confirmed,
    ]);
  await auth(customer);
  await assert.rejects(save("confirmat"), /FORBIDDEN/);
  await auth("");
  await assert.rejects(save("confirmat"), /FORBIDDEN/);
  await auth(staff);
  await assert.rejects(save("confirmat"), /EMAIL_CONFIRMATION_REQUIRED/);
  await assert.rejects(save("in_livrare"), /ACCEPTANCE_REQUIRED/);
  await assert.rejects(save("finalizat"), /DISPATCH_REQUIRED/);
  const draft = async (kind, actor = staff) =>
    (
      await db.query(
        `insert into order_email_drafts(order_id,kind,actor_id,actor_email,order_version,recipient,subject,body) values($1,$2,$3,'staff@example.test',$4,'customer@example.test','subject','body') returning id`,
        [order, kind, actor, version],
      )
    ).rows[0].id;
  const wrongActor = await draft("acceptance", other);
  await assert.rejects(save("confirmat", wrongActor, true), /EMAIL_CONFIRMATION_REQUIRED/);
  const acceptance = await draft("acceptance");
  await assert.rejects(save("confirmat", acceptance, false), /EMAIL_CONFIRMATION_REQUIRED/);
  await assert.rejects(save("confirmat", acceptance, true, "2000-01-01"), /ORDER_CHANGED_RELOAD/);
  await save("confirmat", acceptance, true);
  assert.equal((await db.query(`select total from orders`)).rows[0].total, "130");
  assert.equal((await db.query(`select actor_id from audit_logs`)).rows[0].actor_id, staff);
  await assert.rejects(save("in_livrare", acceptance, true), /EMAIL_CONFIRMATION_REQUIRED/);
  const dispatch = await draft("dispatch");
  await save("in_livrare", dispatch, true); // no invoice necessary
  assert.equal(
    (await db.query(`select count(*) from order_email_drafts where declared_sent_at is not null`))
      .rows[0].count,
    2,
  );
  await db.exec("set role authenticated");
  await assert.rejects(db.query(`update orders set status='nou'`), /permission denied/);
  await assert.rejects(db.query("select * from order_invoices"), /permission denied/);
  await assert.rejects(db.query("select * from order_email_drafts"), /permission denied/);
  await db.exec("reset role");
  const inv = (
    await db.query(
      `insert into order_invoices(order_id,storage_path,invoice_number,uploaded_by) values($1,'private/path.pdf','INV-1',$2) returning id`,
      [order, staff],
    )
  ).rows[0].id;
  const invoiceDraft = await draft("invoice");
  await db.query(`update order_email_drafts set invoice_id=$1 where id=$2`, [inv, invoiceDraft]);
  await auth(other);
  await assert.rejects(
    db.query("select confirm_invoice_email($1)", [invoiceDraft]),
    /INVALID_DRAFT/,
  );
  await auth(staff);
  await db.query("select confirm_invoice_email($1)", [invoiceDraft]);
  await assert.rejects(
    db.query("select confirm_invoice_email($1)", [invoiceDraft]),
    /INVALID_DRAFT/,
  );
  console.log(
    "PASS: migration, terms snapshot, staff/customer permissions, direct-write denial, required confirmations, stale versions, wrong actor/kind, dispatch without invoice, unchanged total, invoice audit and replay protection.",
  );
} finally {
  await db.close();
}
