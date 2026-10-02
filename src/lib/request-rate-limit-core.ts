export type RequestBudget = {
  p_bucket: string;
  p_identifier_hash: string;
  p_ip_hash: string;
  p_limit: number;
  p_ip_limit: number;
  p_window_seconds: number;
};

export async function consumeRequestBudget(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
  dependencies: {
    clientIp: () => string;
    hash: (value: string) => string;
    consume: (budget: RequestBudget) => Promise<{ data: unknown; error: unknown }>;
  },
): Promise<{ allowed: boolean }> {
  try {
    const ip = dependencies.clientIp();
    if (!ip) return { allowed: false };
    const { data, error } = await dependencies.consume({
      p_bucket: bucket,
      p_identifier_hash: dependencies.hash(`${bucket}:identity:${identifier.trim().toLowerCase()}`),
      p_ip_hash: dependencies.hash(`${bucket}:ip:${ip}`),
      p_limit: limit,
      p_ip_limit: Math.max(20, limit * 5),
      p_window_seconds: windowSeconds,
    });
    return {
      allowed:
        !error &&
        typeof data === "object" &&
        data !== null &&
        "allowed" in data &&
        data.allowed === true,
    };
  } catch {
    // Missing IP/secret, malformed responses and database errors fail closed.
    return { allowed: false };
  }
}
