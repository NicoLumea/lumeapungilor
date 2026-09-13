import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdminProducts, useAdminOrders } from "@/lib/admin-data";
import { useCategories } from "@/lib/content";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border p-6">
      <p className="micro-sm text-muted-foreground">{label}</p>
      <p className="display mt-3 text-3xl">{value}</p>
    </div>
  );
}

function AdminHome() {
  const { data: products } = useAdminProducts();
  const { data: orders } = useAdminOrders();
  const { data: categories } = useCategories(true);

  const published = (products ?? []).filter((p) => p.status === "published" && !p.is_archived).length;
  const drafts = (products ?? []).filter((p) => p.status === "draft").length;
  const newOrders = (orders ?? []).filter((o) => o.status === "nou").length;

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="display text-3xl">Panou</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        De aici administrezi tot ce apare pe site: produse, fotografii, categorii, texte și comenzi.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Produse publicate" value={published} />
        <Stat label="Ciorne" value={drafts} />
        <Stat label="Categorii" value={(categories ?? []).length} />
        <Stat label="Comenzi noi" value={newOrders} />
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          to="/admin/products"
          className="micro border border-foreground bg-foreground px-6 py-3 text-background"
        >
          Adaugă un produs
        </Link>
        <Link to="/admin/content" className="micro border border-foreground px-6 py-3">
          Editează textele site-ului
        </Link>
        <Link to="/admin/guide" className="micro border border-foreground px-6 py-3">
          Ghid pas cu pas
        </Link>
      </div>
    </div>
  );
}
