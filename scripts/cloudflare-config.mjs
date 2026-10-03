export function resolveBuildConfig(env, trackedLiveUrl, requestedTarget) {
  const branch = env.WORKERS_CI_BRANCH;
  const target =
    requestedTarget ?? (branch ? (branch === "main" ? "production" : "preview") : null);
  if (!["production", "preview"].includes(target)) {
    throw new Error("Choose --target=preview or --target=production outside Cloudflare Builds.");
  }
  if (branch && (branch === "main") !== (target === "production")) {
    throw new Error("Build target does not match the Cloudflare Git branch.");
  }
  const prefix = target.toUpperCase();
  const required = (suffix) => {
    const name = `${prefix}_${suffix}`;
    const value = env[name]?.trim();
    if (!value) throw new Error(`Set ${name} in Cloudflare Build variables first.`);
    return value;
  };
  const origin = (value) => {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    ) {
      throw new Error(
        "Connection and site URLs must be HTTPS origins without paths or credentials.",
      );
    }
    return url.origin;
  };
  const supabaseUrl = origin(required("SUPABASE_URL"));
  const publishableKey = required("SUPABASE_PUBLISHABLE_KEY");
  let publicKey = publishableKey.startsWith("sb_publishable_");
  try {
    const claims = JSON.parse(Buffer.from(publishableKey.split(".")[1], "base64url").toString());
    publicKey ||= claims.role === "anon";
  } catch {
    /* Opaque publishable keys have no JWT claims. */
  }
  if (!publicKey)
    throw new Error(`${prefix}_SUPABASE_PUBLISHABLE_KEY must be a public publishable/anon key.`);
  const projectId = required("SUPABASE_PROJECT_ID");
  const siteOrigin = origin(required("SITE_URL"));
  if (target === "preview") {
    const productionUrl = origin(requiredProduction(env));
    if ([productionUrl, origin(trackedLiveUrl)].includes(supabaseUrl)) {
      throw new Error(
        "Preview must use a separate Supabase project, not the production or existing Lovable database.",
      );
    }
  }
  return { target, supabaseUrl, publishableKey, projectId, siteOrigin };
}

function requiredProduction(env) {
  if (!env.PRODUCTION_SUPABASE_URL?.trim()) {
    throw new Error("Set PRODUCTION_SUPABASE_URL so preview isolation can be checked.");
  }
  return env.PRODUCTION_SUPABASE_URL.trim();
}
