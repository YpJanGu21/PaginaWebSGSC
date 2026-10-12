const ENV_API = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const TIMEOUT_MS = 6000;

let baseCache: string | null = null;

async function cargarBase(): Promise<string> {
  if (baseCache !== null) return baseCache;
  let base = ENV_API;
  try {
    const respuesta = await fetch("/config.json", { cache: "no-store" });
    if (respuesta.ok) {
      const cuerpo = await respuesta.json();
      if (typeof cuerpo?.apiUrl === "string" && cuerpo.apiUrl.trim()) {
        base = cuerpo.apiUrl.trim().replace(/\/+$/, "");
      }
    }
  } catch {
    // sin config.json: usamos la variable de entorno
  }
  baseCache = base;
  return base;
}

export class ApiError extends Error {
  status: number;
  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

async function pedir<T>(path: string, opciones: RequestInit = {}): Promise<T> {
  const base = await cargarBase();
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const respuesta = await fetch(`${base}${path}`, {
      ...opciones,
      headers: { "Content-Type": "application/json", ...(opciones.headers ?? {}) },
      signal: control.signal,
    });
    if (!respuesta.ok) {
      let mensaje = `Error ${respuesta.status}`;
      try {
        const cuerpo = await respuesta.json();
        if (cuerpo?.error) mensaje = cuerpo.error;
      } catch {
        // respuesta sin cuerpo JSON
      }
      throw new ApiError(mensaje, respuesta.status);
    }
    return (await respuesta.json()) as T;
  } finally {
    clearTimeout(temporizador);
  }
}

export function apiGet<T>(path: string) {
  return pedir<T>(path);
}

export function apiPost<T>(path: string, cuerpo: unknown) {
  return pedir<T>(path, { method: "POST", body: JSON.stringify(cuerpo) });
}

export function apiPatch<T>(path: string, cuerpo: unknown) {
  return pedir<T>(path, { method: "PATCH", body: JSON.stringify(cuerpo) });
}
