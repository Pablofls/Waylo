/** Llamada JSON a las rutas /api. Lanza `ApiClientError` con el mensaje en español que devuelve el servidor. */
export class ApiClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = { ok: true }>(path: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET", data?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method, headers: data === undefined ? undefined : { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data), credentials: "same-origin" });
  } catch {
    throw new ApiClientError(0, "No pudimos conectarnos. Revisa tu conexión.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/login") && !location.pathname.startsWith("/sesion-vencida")) location.href = "/sesion-vencida";
    throw new ApiClientError(res.status, (json as { error?: string }).error ?? "Algo salió mal. Intenta de nuevo.");
  }
  return json as T;
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : "Algo salió mal. Intenta de nuevo.");
