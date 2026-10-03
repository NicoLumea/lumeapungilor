// Cloudflare-only outer handler. Lovable continues using its existing server entry.
export function configurationMatches(env, build) {
  return (
    env.DEPLOYMENT_ENVIRONMENT === build.target &&
    env.SUPABASE_URL === build.supabaseUrl &&
    env.SUPABASE_PUBLISHABLE_KEY === build.publishableKey &&
    typeof env.SUPABASE_SERVICE_ROLE_KEY === "string" &&
    env.SUPABASE_SERVICE_ROLE_KEY.length > 20
  );
}

export function createCloudflareHandler(loadApp, build) {
  let app;
  return {
    async fetch(request, env, context) {
      const url = new URL(request.url);
      const preview = build.target === "preview" || url.origin !== build.siteOrigin;
      if (preview && url.pathname === "/robots.txt") {
        return new Response("User-agent: *\nDisallow: /\n", {
          headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" },
        });
      }
      if (!configurationMatches(env, build)) {
        console.error("Cloudflare runtime configuration mismatch", {
          environmentMatches: env.DEPLOYMENT_ENVIRONMENT === build.target,
          databaseMatches: env.SUPABASE_URL === build.supabaseUrl,
          publicKeyMatches: env.SUPABASE_PUBLISHABLE_KEY === build.publishableKey,
          serverKeyPresent: typeof env.SUPABASE_SERVICE_ROLE_KEY === "string" && env.SUPABASE_SERVICE_ROLE_KEY.length > 20,
        });
        return new Response("Site configuration is incomplete. Contact the site administrator.", {
          status: 503,
          headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
        });
      }
      app ??= loadApp();
      const response = await (await app).fetch(request, env, context);
      if (!preview) return response;
      const result = new Response(response.body, response);
      result.headers.set("X-Robots-Tag", "noindex, nofollow");
      return result;
    },
  };
}