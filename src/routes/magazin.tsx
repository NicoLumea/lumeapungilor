import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/magazin")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301, replace: true, search: (previous) => previous });
  },
});
