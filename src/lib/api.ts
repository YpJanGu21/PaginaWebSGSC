const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const TIMEOUT_MS = 6000;

export class ApiError extends Error {
  status: number;
  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

async function pedir<T>(path: string, opciones: RequestInit = {}): Promise<T> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const respuesta = await fetch(`${API_BASE}${path}`, {
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
