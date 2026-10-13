export type EstadoSolicitud =
  | "Pendiente"
  | "Aprobada"
  | "En Espera"
  | "En Revisión"
  | "Aprobado"
  | "Rechazada"
  | "Declinado"
  | "Cancelada"
  | "Cerrada";

export interface Solicitud {
  id: string;
  recurso: string;
  recursoId?: string;
  solicitante: string;
  departamento: string;
  responsable: string;
  fechaSolicitud: string;
  fechaReserva?: string;
  inicio: string;
  termino: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string;
  estado: EstadoSolicitud;
  observacionCierre?: string;
  adicionales?: Record<string, string | boolean>;
}

export interface NuevaSolicitud {
  recurso: string;
  recursoId?: string;
  solicitante: string;
  departamento: string;
  responsable: string;
  fechaReserva: string;
  inicio: string;
  termino: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string;
  adicionales?: Record<string, string | boolean>;
}

const TIMEOUT_MS = 8000;

let configCache: { base: string; clave: string } | null = null;

export async function obtenerConfigSupabase(): Promise<{ base: string; clave: string }> {
  if (configCache) return configCache;
  let base = (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  let clave = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
  try {
    const respuesta = await fetch("/config.json", { cache: "no-store" });
    if (respuesta.ok) {
      const cuerpo = await respuesta.json();
      if (typeof cuerpo?.supabaseUrl === "string" && cuerpo.supabaseUrl.trim()) {
        base = cuerpo.supabaseUrl.trim().replace(/\/+$/, "");
      }
      if (typeof cuerpo?.supabaseAnonKey === "string" && cuerpo.supabaseAnonKey.trim()) {
        clave = cuerpo.supabaseAnonKey.trim();
      }
    }
  } catch {
    // sin config.json: usamos las variables de entorno del build
  }
  configCache = { base, clave };
  return configCache;
}

export class ApiError extends Error {
  status: number;
  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

interface Fila {
  id: number;
  recurso: string;
  recurso_id: string;
  solicitante: string;
  departamento: string;
  responsable: string;
  fecha_solicitud: string;
  fecha_reserva: string;
  inicio: string;
  termino: string;
  hora_inicio: string;
  hora_fin: string;
  descripcion: string;
  estado: string;
  observacion_cierre: string | null;
  adicionales: Record<string, string | boolean> | null;
}

function filaASolicitud(f: Fila): Solicitud {
  return {
    id: `SOL-${String(f.id).padStart(3, "0")}`,
    recurso: f.recurso,
    recursoId: f.recurso_id || undefined,
    solicitante: f.solicitante,
    departamento: f.departamento,
    responsable: f.responsable,
    fechaSolicitud: f.fecha_solicitud,
    fechaReserva: f.fecha_reserva,
    inicio: f.inicio,
    termino: f.termino,
    horaInicio: f.hora_inicio,
    horaFin: f.hora_fin,
    descripcion: f.descripcion,
    estado: f.estado as EstadoSolicitud,
    observacionCierre: f.observacion_cierre ?? undefined,
    adicionales: f.adicionales ?? {},
  };
}

function hoyISO(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

function idNumerico(id: string): number {
  return Number.parseInt(String(id).replace(/\D+/g, ""), 10);
}

function mensajeError(cuerpo: { message?: string } | null, status: number): string {
  const m = cuerpo?.message ?? "";
  if (m.includes("horas_validas")) return "El horario debe estar entre 08:00 y 17:00 y la hora de inicio debe ser anterior a la de término.";
  if (m.includes("finde_semana")) return "La fecha reservada debe ser de lunes a viernes.";
  if (m.includes("estado_valido")) return "Estado no válido.";
  if (m.includes("violates row-level security") || status === 401 || status === 403) {
    return "Supabase rechazó la operación: revisa supabaseUrl y supabaseAnonKey en config.json.";
  }
  if (m) return m;
  return `Error ${status}`;
}

async function supabaseFetch<T>(path: string, opciones: RequestInit = {}): Promise<T> {
  const { base, clave } = await obtenerConfigSupabase();
  if (!base || !clave) {
    // Sin configurar: el llamador cae en modo local
    throw new Error("Supabase no está configurado.");
  }
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const respuesta = await fetch(`${base}${path}`, {
      ...opciones,
      headers: {
        apikey: clave,
        Authorization: `Bearer ${clave}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(opciones.headers ?? {}),
      },
      signal: control.signal,
    });
    if (!respuesta.ok) {
      let cuerpo: { message?: string } | null = null;
      try {
        cuerpo = await respuesta.json();
      } catch {
        // respuesta sin cuerpo JSON
      }
      throw new ApiError(mensajeError(cuerpo, respuesta.status), respuesta.status);
    }
    if (respuesta.status === 204) return undefined as T;
    return (await respuesta.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // Fallo de red o timeout: el llamador cae en modo local
    throw new Error("Sin conexión con Supabase.");
  } finally {
    clearTimeout(temporizador);
  }
}

export function obtenerSolicitudes(): Promise<Solicitud[]> {
  return supabaseFetch<Fila[]>("/rest/v1/solicitudes?select=*&order=id.desc").then((filas) =>
    filas.map(filaASolicitud)
  );
}

export function crearSolicitud(datos: NuevaSolicitud): Promise<Solicitud> {
  return supabaseFetch<Fila[]>("/rest/v1/solicitudes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      recurso: datos.recurso,
      recurso_id: datos.recursoId ?? "",
      solicitante: datos.solicitante,
      departamento: datos.departamento,
      responsable: datos.responsable,
      fecha_solicitud: hoyISO(),
      fecha_reserva: datos.fechaReserva,
      inicio: datos.inicio,
      termino: datos.termino,
      hora_inicio: datos.horaInicio,
      hora_fin: datos.horaFin,
      descripcion: datos.descripcion,
      estado: "Pendiente",
      adicionales: datos.adicionales ?? {},
    }),
  }).then((filas) => {
    if (!filas.length) throw new ApiError("No se pudo crear la solicitud.", 500);
    return filaASolicitud(filas[0]);
  });
}

export function actualizarEstado(
  id: string,
  nuevoEstado: EstadoSolicitud,
  observacion?: string
): Promise<Solicitud> {
  const cuerpo: Record<string, unknown> = { estado: nuevoEstado };
  if (nuevoEstado === "Cerrada") cuerpo.observacion_cierre = observacion ?? "";
  return supabaseFetch<Fila[]>(`/rest/v1/solicitudes?id=eq.${idNumerico(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(cuerpo),
  }).then((filas) => {
    if (!filas.length) throw new ApiError("Solicitud no encontrada.", 404);
    return filaASolicitud(filas[0]);
  });
}
