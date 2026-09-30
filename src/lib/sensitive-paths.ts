/** Reject direct requests for local configuration, even when path segments are encoded. */
export function isSensitivePath(rawPath: string): boolean {
  let path = rawPath;
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    } catch {
      return true;
    }
  }

  return path
    .replaceAll("\\", "/")
    .toLowerCase()
    .split("/")
    .some(
      (segment) =>
        segment === ".env" ||
        segment.startsWith(".env.") ||
        segment === ".dev.vars" ||
        segment.startsWith(".dev.vars.") ||
        segment === ".git" ||
        segment === ".npmrc" ||
        segment === ".yarnrc.yml" ||
        /\.(?:pem|key|p12|pfx|crt|cer|der)$/.test(segment),
    );
}
