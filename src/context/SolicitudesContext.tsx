import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiGet, apiPost, apiPatch, ApiError } from "../lib/api";

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

export type ModoDatos = "cargando" | "api" | "local";

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

interface SolicitudesState {
  solicitudes: Solicitud[];
  modo: ModoDatos;
  errorApi: string | null;
  addSolicitud: (s: NuevaSolicitud) => Promise<void>;
  updateEstado: (id: string, nuevoEstado: EstadoSolicitud, observacion?: string) => Promise<void>;
}

const SolicitudesContext = createContext<SolicitudesState | null>(null);

const STORAGE_KEY = "sgsc_solicitudes_local";

function cargarLocal(): Solicitud[] {
  try {
    const crudo = localStorage.getItem(STORAGE_KEY);
    if (!crudo) return [];
    const parsed = JSON.parse(crudo);
    return Array.isArray(parsed) ? (parsed as Solicitud[]) : [];
  } catch {
    return [];
  }
}

function guardarLocal(lista: Solicitud[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {
    // almacenamiento no disponible
  }
}

function siguienteCodigo(lista: Solicitud[]): string {
  let max = 0;
  for (const s of lista) {
    const n = Number.parseInt(String(s.id).replace(/\D+/g, ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `SOL-${String(max + 1).padStart(3, "0")}`;
}

function hoyISO(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

export function SolicitudesProvider({ children }: { children: React.ReactNode }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [modo, setModo] = useState<ModoDatos>("cargando");
  const [errorApi, setErrorApi] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const data = await apiGet<Solicitud[]>("/api/solicitudes");
        if (!vivo) return;
        setSolicitudes(data);
        setModo("api");
        setErrorApi(null);
      } catch {
        if (!vivo) return;
        setSolicitudes(cargarLocal());
        setModo("local");
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const addSolicitud = useCallback(
    async (s: NuevaSolicitud) => {
      if (modo === "api") {
        try {
          const creada = await apiPost<Solicitud>("/api/solicitudes", s);
          setSolicitudes((prev) => [creada, ...prev]);
          setErrorApi(null);
          return;
        } catch (e) {
          if (e instanceof ApiError) {
            setErrorApi(e.message);
            throw e;
          }
          setModo("local");
        }
      }

      setSolicitudes((prev) => {
        const nueva: Solicitud = {
          ...s,
          id: siguienteCodigo(prev),
          estado: "Pendiente",
          fechaSolicitud: hoyISO(),
        };
        guardarLocal([nueva, ...prev]);
        return [nueva, ...prev];
      });
    },
    [modo]
  );

  const updateEstado = useCallback(
    async (id: string, nuevoEstado: EstadoSolicitud, observacion?: string) => {
      if (modo === "api") {
        try {
          const actualizada = await apiPatch<Solicitud>(`/api/solicitudes/${encodeURIComponent(id)}`, {
            estado: nuevoEstado,
            ...(nuevoEstado === "Cerrada" ? { observacionCierre: observacion ?? "" } : {}),
          });
          setSolicitudes((prev) => prev.map((s) => (s.id === id || s.id === actualizada.id ? actualizada : s)));
          setErrorApi(null);
          return;
        } catch (e) {
          if (e instanceof ApiError) {
            setErrorApi(e.message);
            throw e;
          }
          setModo("local");
        }
      }

      setSolicitudes((prev) => {
        const lista = prev.map((s) =>
          s.id === id
            ? {
                ...s,
                estado: nuevoEstado,
                observacionCierre: nuevoEstado === "Cerrada" ? observacion : s.observacionCierre,
              }
            : s
        );
        guardarLocal(lista);
        return lista;
      });
    },
    [modo]
  );

  return (
    <SolicitudesContext.Provider value={{ solicitudes, modo, errorApi, addSolicitud, updateEstado }}>
      {children}
    </SolicitudesContext.Provider>
  );
}

export function useSolicitudes() {
  const ctx = useContext(SolicitudesContext);
  if (!ctx) throw new Error("useSolicitudes must be used within SolicitudesProvider");
  return ctx;
}
