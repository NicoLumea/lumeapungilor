import { createFileRoute, redirect } from "@tanstack/react-router";

// The storefront lives at /magazin; the root URL sends visitors straight there.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/magazin", replace: true });
  },
});
