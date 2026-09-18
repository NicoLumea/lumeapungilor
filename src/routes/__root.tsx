import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { OrganizationStructuredData } from "@/components/site/OrganizationStructuredData";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="micro-sm text-muted-foreground">404</p>
        <h1 className="display mt-4 text-3xl">Pagina nu a fost găsită</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Linkul nu mai există sau a fost mutat.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="micro inline-flex items-center justify-center border border-foreground px-6 py-3 transition-colors hover:bg-foreground hover:text-background"
          >
            Înapoi acasă
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="display text-2xl">Pagina nu s-a încărcat</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A apărut o eroare. Încearcă din nou sau revino la pagina principală.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="micro border border-foreground px-6 py-3 transition-colors hover:bg-foreground hover:text-background"
          >
            Încearcă din nou
          </button>
          <a href="/" className="micro border border-border px-6 py-3 transition-colors hover:bg-accent">
            Acasă
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lumea Pungilor — Ambalaje pentru afaceri" },
      {
        name: "description",
        content:
          "Pungi de plastic, pungi de hârtie, fețe de masă și folie cu bule pentru afaceri din România.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {isAdmin ? (
          <Outlet />
        ) : (
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <OrganizationStructuredData />
            <main className="flex-1">
              {/* Required: nested routes render here. */}
              <Outlet />
            </main>
            <SiteFooter />
          </div>
        )}
        <Toaster position="bottom-right" />
      </CartProvider>
    </QueryClientProvider>
  );
}
