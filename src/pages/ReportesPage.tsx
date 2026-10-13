import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useSolicitudes } from "../context/SolicitudesContext";
import type { Solicitud } from "../context/SolicitudesContext";
import AvisoDatos from "../components/AvisoDatos";

type Periodo = "semana" | "mes";

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const COLORES_ESTADO: Record<string, string> = {
  "Aprobada": "#38a169",
  "En espera": "#f5c518",
  "Rechazada": "#e53e3e",
  "Cancelada": "#6b7280",
  "Cerrada": "#3182ce",
};

function grupoEstado(estado: string): string {
  if (estado === "Aprobada" || estado === "Aprobado") return "Aprobada";
  if (estado === "Pendiente" || estado === "En Espera" || estado === "En Revisión") return "En espera";
  if (estado === "Rechazada" || estado === "Declinado") return "Rechazada";
  if (estado === "Cerrada") return "Cerrada";
  return "Cancelada";
}

function parseISO(fecha: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha ?? "");
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function diasDesde(fecha: string, hoy: Date): number | null {
  const f = parseISO(fecha);
  if (!f) return null;
  return Math.round((hoy.getTime() - f.getTime()) / 86_400_000);
}

function isoDe(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function leerTema() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    texto: v("--text", "#1a2744"),
    muted: v("--text-muted", "#6b7c99"),
    borde: v("--border", "#d8d2c8"),
    superficie: v("--surface", "#ffffff"),
    teal: v("--teal", "#1a9e93"),
  };
}

function TooltipGrafico({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number | string; color?: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs shadow-lg"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
    >
      <p className="font-semibold mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "var(--text-muted)" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

function StatReporte({
  label,
  valor,
  pct,
  color,
}: {
  label: string;
  valor: number | string;
  pct?: number;
  color?: string;
}) {
  const circ = Math.PI * 20;
  const dash = pct !== undefined ? (Math.min(100, Math.max(0, pct)) / 100) * circ : 0;
  return (
    <div className="card px-4 py-3 flex items-center gap-3 min-w-0">
      <div className="min-w-0">
        <p className="text-[11px] mb-0.5 truncate" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-xl md:text-2xl font-bold" style={{ color: color || "var(--text)" }}>{valor}</p>
      </div>
      {pct !== undefined && (
        <svg className="ml-auto shrink-0" width="48" height="32" viewBox="0 0 48 32">
          <path d="M4 28 A20 20 0 0 1 44 28" fill="none" stroke="var(--border)" strokeWidth="5" strokeLinecap="round" />
          <path
            d="M4 28 A20 20 0 0 1 44 28"
            fill="none"
            stroke={color || "var(--yellow)"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
          />
        </svg>
      )}
    </div>
  );
}

function BarraProgreso({ label, valor, total, color }: { label: string; valor: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="py-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium truncate" style={{ color: "var(--text)" }}>{label}</span>
        <span className="shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
          {valor} · {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function exportarCSV(solicitudes: Solicitud[]) {
  const columnas = [
    "ID", "Recurso", "Solicitante", "Departamento", "Responsable",
    "Fecha Solicitud", "Fecha Reserva", "Inicio", "Término", "Estado",
  ];
  const filas = solicitudes.map((s) => [
    s.id, s.recurso, s.solicitante, s.departamento, s.responsable,
    s.fechaSolicitud, s.fechaReserva ?? "", s.inicio, s.termino, s.estado,
  ]);
  const csv = [columnas, ...filas]
    .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `solicitudes-${isoDe(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportesPage() {
  const { solicitudes, modo } = useSolicitudes();
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const cargando = modo === "cargando";
  const tema = leerTema();

  const dias = periodo === "semana" ? 7 : 30;

  const datos = useMemo(() => {
    const hoy = new Date();
    const enRango = (s: Solicitud) => {
      const d = diasDesde(s.fechaSolicitud, hoy);
      return d !== null && d >= 0 && d < dias;
    };
    const recientes = solicitudes.filter(enRango);

    const total = solicitudes.length;
    const aprobadas = solicitudes.filter((s) => grupoEstado(s.estado) === "Aprobada").length;
    const espera = solicitudes.filter((s) => grupoEstado(s.estado) === "En espera").length;
    const rechazadas = solicitudes.filter((s) => grupoEstado(s.estado) === "Rechazada").length;
    const tasaAprobacion = aprobadas + rechazadas > 0 ? Math.round((aprobadas / (aprobadas + rechazadas)) * 100) : 0;

    const porRecursoMap = new Map<string, number>();
    for (const s of recientes) {
      porRecursoMap.set(s.recurso, (porRecursoMap.get(s.recurso) ?? 0) + 1);
    }
    const porRecurso = [...porRecursoMap.entries()]
      .map(([nombre, cantidad]) => ({ nombre: nombre.length > 18 ? nombre.slice(0, 16) + "…" : nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const porDia = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy0);
      d.setDate(d.getDate() - (6 - i));
      const iso = isoDe(d);
      const cantidad = solicitudes.filter((s) => (s.fechaSolicitud ?? "").slice(0, 10) === iso).length;
      return { dia: DIAS_CORTOS[d.getDay()], cantidad };
    });

    const porHoraMap = new Map<string, number>();
    for (const s of recientes) {
      const h = (s.horaInicio ?? "").slice(0, 2);
      if (h) porHoraMap.set(h, (porHoraMap.get(h) ?? 0) + 1);
    }
    const porHora = Array.from({ length: 10 }, (_, i) => {
      const h = String(i + 8).padStart(2, "0");
      return { hora: `${h}:00`, cantidad: porHoraMap.get(h) ?? 0 };
    });

    const porEstadoMap = new Map<string, number>();
    for (const s of solicitudes) {
      const g = grupoEstado(s.estado);
      porEstadoMap.set(g, (porEstadoMap.get(g) ?? 0) + 1);
    }
    const porEstado = [...porEstadoMap.entries()]
      .map(([nombre, cantidad]) => ({ nombre, cantidad, color: COLORES_ESTADO[nombre] ?? "#6b7280" }))
      .filter((e) => e.cantidad > 0);

    const porDeptoMap = new Map<string, number>();
    for (const s of recientes) {
      const d = s.departamento || "Sin departamento";
      porDeptoMap.set(d, (porDeptoMap.get(d) ?? 0) + 1);
    }
    const porDepartamento = [...porDeptoMap.entries()]
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);

    return { total, aprobadas, espera, rechazadas, tasaAprobacion, porRecurso, porDia, porHora, porEstado, porDepartamento, recientes };
  }, [solicitudes, dias]);

  if (cargando) {
    return (
      <div className="page">
        <div className="mb-6">
          <h1 className="page-title">Reportes y Estadísticas</h1>
          <p className="page-subtitle">Panel de control — Indicadores del uso de Recursos y rendimiento del sistema</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card px-4 py-5 animate-pulse" style={{ background: "var(--surface-2)" }} />
          ))}
        </div>
        <div className="card p-10 flex items-center justify-center" style={{ minHeight: "300px" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cargando estadísticas…</p>
        </div>
      </div>
    );
  }

  if (datos.total === 0) {
    return (
      <div className="page">
        <div className="mb-6">
          <h1 className="page-title">Reportes y Estadísticas</h1>
          <p className="page-subtitle">Panel de control — Indicadores del uso de Recursos y rendimiento del sistema</p>
        </div>
        <AvisoDatos />
        <div className="card p-6 md:p-10 flex flex-col items-center justify-center text-center" style={{ minHeight: "320px" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>Aún no hay reportes disponibles</h2>
          <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
            Los indicadores aparecerán cuando existan solicitudes en el sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Reportes y Estadísticas</h1>
          <p className="page-subtitle">Panel de control — Indicadores del uso de Recursos y rendimiento del sistema</p>
        </div>
        <button
          onClick={() => exportarCSV(solicitudes)}
          className="px-4 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 shrink-0"
          style={{ background: "var(--teal)", color: "#fff" }}
        >
          Exportar CSV
        </button>
      </div>

      <AvisoDatos />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatReporte
          label="Total solicitudes"
          valor={datos.total}
          pct={datos.total > 0 ? Math.round(((datos.aprobadas + datos.espera + datos.rechazadas) / datos.total) * 100) : 0}
          color={tema.teal}
        />
        <StatReporte label="En espera" valor={datos.espera} pct={datos.total > 0 ? Math.round((datos.espera / datos.total) * 100) : 0} color="#f5c518" />
        <StatReporte label="Aprobadas" valor={datos.aprobadas} pct={datos.total > 0 ? Math.round((datos.aprobadas / datos.total) * 100) : 0} color="#38a169" />
        <StatReporte label="Rechazadas" valor={datos.rechazadas} pct={datos.total > 0 ? Math.round((datos.rechazadas / datos.total) * 100) : 0} color="#e53e3e" />
      </div>

      {/* Toggle de periodo */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Periodo:
        </span>
        {(["semana", "mes"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={
              periodo === p
                ? { background: "var(--navy)", color: "#fff" }
                : { background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }
            }
          >
            {p === "semana" ? "Esta semana (7 días)" : "Este mes (30 días)"}
          </button>
        ))}
      </div>

      {/* Uso por recurso + Donut estados */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>
            Uso por recurso · {periodo === "semana" ? "últimos 7 días" : "últimos 30 días"}
          </h2>
          {datos.porRecurso.length === 0 ? (
            <p className="text-xs py-10 text-center" style={{ color: "var(--text-muted)" }}>
              Sin solicitudes en este periodo.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={datos.porRecurso} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={tema.borde} vertical={false} />
                <XAxis dataKey="nombre" tick={{ fill: tema.muted, fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />
                <YAxis tick={{ fill: tema.muted, fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<TooltipGrafico />} cursor={{ fill: "rgba(127,127,127,0.08)" }} />
                <Bar dataKey="cantidad" name="Solicitudes" fill={tema.teal} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Distribución por estado</h2>
          {datos.porEstado.length === 0 ? (
            <p className="text-xs py-10 text-center" style={{ color: "var(--text-muted)" }}>Sin datos.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={datos.porEstado}
                      dataKey="cantidad"
                      nameKey="nombre"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {datos.porEstado.map((e) => (
                        <Cell key={e.nombre} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipGrafico />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>{datos.total}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>total</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-1">
                {datos.porEstado.map((e) => (
                  <BarraProgreso key={e.nombre} label={e.nombre} valor={e.cantidad} total={datos.total} color={e.color} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Días + horas pico */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Solicitudes de los últimos 7 días</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={datos.porDia} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tema.borde} vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: tema.muted, fontSize: 11 }} />
              <YAxis tick={{ fill: tema.muted, fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<TooltipGrafico />} cursor={{ fill: "rgba(127,127,127,0.08)" }} />
              <Bar dataKey="cantidad" name="Solicitudes" fill="#63b3ed" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>
            Horas pico de uso · {periodo === "semana" ? "7 días" : "30 días"}
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={datos.porHora} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tema.borde} vertical={false} />
              <XAxis dataKey="hora" tick={{ fill: tema.muted, fontSize: 10 }} interval={0} />
              <YAxis tick={{ fill: tema.muted, fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<TooltipGrafico />} cursor={{ fill: "rgba(127,127,127,0.08)" }} />
              <Bar dataKey="cantidad" name="Reservas iniciadas" fill="#f5c518" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Departamentos + tasa de aprobación */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-sm font-bold mb-2" style={{ color: "var(--text)" }}>
            Top departamentos · {periodo === "semana" ? "7 días" : "30 días"}
          </h2>
          {datos.porDepartamento.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: "var(--text-muted)" }}>Sin datos en este periodo.</p>
          ) : (
            datos.porDepartamento.map((d, i) => (
              <BarraProgreso
                key={d.nombre}
                label={d.nombre}
                valor={d.cantidad}
                total={datos.porDepartamento[0].cantidad}
                color={[tema.teal, "#63b3ed", "#f5c518", "#68d391", "#b794f4", "#fc8181"][i % 6]}
              />
            ))
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Tasa de aprobación</h2>
          <div className="flex items-center gap-5">
            <svg width="120" height="70" viewBox="0 0 120 70" className="shrink-0">
              <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
              <path
                d="M10 62 A50 50 0 0 1 110 62"
                fill="none"
                stroke="#38a169"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(datos.tasaAprobacion / 100) * Math.PI * 50} ${Math.PI * 50}`}
              />
              <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="700" fill={tema.texto}>
                {datos.tasaAprobacion}%
              </text>
            </svg>
            <div className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
              <p>
                <strong style={{ color: "#38a169" }}>{datos.aprobadas}</strong> aprobadas de{" "}
                <strong style={{ color: "var(--text)" }}>{datos.aprobadas + datos.rechazadas}</strong> resueltas
              </p>
              <p>Calculado sobre solicitudes aprobadas + rechazadas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
