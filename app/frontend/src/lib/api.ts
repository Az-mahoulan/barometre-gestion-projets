// Client minimal de l'API Django. Les cookies de session passent par le même domaine (rewrite Next).

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

async function ensureCsrf(): Promise<string> {
  const existing = readCookie("csrftoken");
  if (existing) return existing;
  const res = await fetch("/api/v1/auth/csrf/", { credentials: "same-origin" });
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as { csrfToken: string };
  return data.csrfToken;
}

// L'hébergement de démonstration met le serveur en veille : pendant son réveil (≈ 1 min), le proxy répond 502 à 504.
const WAKING_STATUSES = [502, 503, 504];

export function isWaking(e: unknown): boolean {
  return e instanceof ApiError && WAKING_STATUSES.includes(e.status);
}

/** Demande au navigateur de visiter directement le serveur Django, ce qui le réveille (voir app/reveil/route.ts). */
export function wakeBackend() {
  fetch("/reveil", { mode: "no-cors", cache: "no-store" }).catch(() => undefined);
}

/** Relance l'appel toutes les 5 s tant que le serveur se réveille (2 min au plus). */
export async function retryWhileWaking<T>(call: () => Promise<T>, onWaiting?: () => void, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call();
    } catch (e) {
      if (!isWaking(e) || attempt >= 24 || signal?.aborted) throw e;
      if (attempt % 3 === 0) wakeBackend();
      onWaiting?.();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function parseError(res: Response): Promise<ApiError> {
  if (WAKING_STATUSES.includes(res.status)) {
    return new ApiError(res.status, "Le serveur démarre. Réessayez dans une minute.");
  }
  let message = "Une erreur est survenue.";
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") message = body.detail;
    else if (body && typeof body === "object") message = Object.values(body).flat().join(" ");
  } catch {
    /* corps vide */
  }
  return new ApiError(res.status, message);
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`/api/v1${path}`, { credentials: "same-origin", signal });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown, method: "POST" | "PATCH" | "DELETE" = "POST"): Promise<T> {
  const csrf = await ensureCsrf();
  const res = await fetch(`/api/v1${path}`, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await parseError(res);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiPost<T>(path, body, "PATCH");
}

export function apiDelete(path: string): Promise<void> {
  return apiPost<void>(path, undefined, "DELETE");
}
