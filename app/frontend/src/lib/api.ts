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

async function parseError(res: Response): Promise<ApiError> {
  // L'hébergement de démonstration met le serveur en veille : le premier appel peut échouer le temps qu'il redémarre.
  if ([502, 503, 504].includes(res.status)) {
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

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const csrf = await ensureCsrf();
  const res = await fetch(`/api/v1${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await parseError(res);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
