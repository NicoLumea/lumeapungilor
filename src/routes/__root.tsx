import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { OrganizationStructuredData } from "@/components/site/OrganizationStructuredData";
import { BackToTop } from "@/components/site/BackToTop";
import { SupportWidget } from "@/components/site/SupportWidget";
import { Toaster } from "@/components/ui/sonner";
import { getSeoContent } from "@/lib/seo-catalog.functions";
import { safeGoogleVerificationToken } from "@/lib/seo-meta";

function NotFoundComponent() {
  return (
    <div className="site-container flex min-h-[60vh] items-center justify-center py-20">
      <div className="max-w-lg text-center">
        <p className="micro-sm text-muted-foreground">Eroare 404</p>
        <h1 className="display mt-4 text-3xl md:text-4xl">Pagina nu a fost găsită</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Adresa pe care ai deschis-o nu există sau a fost mutată. Poți reveni în magazin sau poți
          căuta produsul direct în catalog.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/magazin"
            className="micro inline-flex min-h-11 items-center justify-center border border-foreground bg-foreground px-6 py-3 text-background transition-opacity hover:opacity-85"
          >
            Înapoi la magazin
          </Link>
          <Link
            to="/produse"
            className="micro inline-flex min-h-11 items-center justify-center border border-foreground px-6 py-3 transition-colors hover:bg-foreground hover:text-background"
          >
            Vezi catalogul
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error("[client] Application error:", (error as Error)?.name, (error as Error)?.message);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error as Error, { boundary: "tanstack_root_error_component" });
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
          <a
            href="/magazin"
            className="micro border border-border px-6 py-3 transition-colors hover:bg-accent"
          >
            Acasă
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: () => getSeoContent({ data: { key: "seo" } }),
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...(safeGoogleVerificationToken(loaderData?.["google_site_verification"])
        ? [
            {
              name: "google-site-verification",
              content: safeGoogleVerificationToken(loaderData?.["google_site_verification"])!,
            },
          ]
        : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico?v=lumea-pungilor-1", sizes: "any" },
      { rel: "icon", href: "/lumea-pungilor-icon.svg", type: "image/svg+xml" },
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
  const isInternalDashboard = pathname.startsWith("/n7q4-v2m9");
  const isGateway = pathname === "/";

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {isInternalDashboard || isGateway ? <Outlet /> : <PublicSiteFrame pathname={pathname} />}
        <Toaster position="bottom-right" />
      </CartProvider>
    </QueryClientProvider>
  );
}

function PublicSiteFrame({ pathname }: { pathname: string }) {
  // Long pages only: the control must never sit over the checkout actions.
  const showBackToTop =
    pathname === "/produse" ||
    pathname === "/despre" ||
    pathname === "/magazin" ||
    pathname.startsWith("/categorie/");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <OrganizationStructuredData />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      {showBackToTop ? <BackToTop /> : null}
      {!pathname.startsWith("/staff") ? <SupportWidget /> : null}
    </div>
  );
}

