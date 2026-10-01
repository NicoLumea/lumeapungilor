import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import listMyOrders from "./tools/list-my-orders";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "lumea-packaging-hub",
  title: "Lumea Packaging Hub",
  version: "0.1.0",
  instructions:
    "Tools for the Lumea Pungilor packaging shop. Use `search_products` to browse the catalogue and `list_my_orders` to see the signed-in customer's orders.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProducts, listMyOrders],
});
