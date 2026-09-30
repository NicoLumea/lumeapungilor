// Browser storage can be blocked (private mode, embedded previews, strict
// privacy settings) and then throws on access. These helpers never throw.
type Kind = "local" | "session";

function store(kind: Kind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function storageGet(kind: Kind, key: string): string | null {
  try {
    return store(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function storageSet(kind: Kind, key: string, value: string): void {
  try {
    store(kind)?.setItem(key, value);
  } catch {
    /* storage unavailable or full */
  }
}
