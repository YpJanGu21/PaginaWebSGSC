import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSolicitudes } from "../context/SolicitudesContext";
import AvisoDatos from "../components/AvisoDatos";

const estadoStyles: Record<string, { bg: string; color: string; dot: string }> = {
  Aprobada: { bg: "rgba(56,161,105,0.15)", color: "#38a169", dot: "#38a169" },
  Aprobado: { bg: "rgba(56,161,105,0.15)", color: "#38a169", dot: "#38a169" },
  "En Espera": { bg: "rgba(245,197,24,0.15)", color: "#f5c518", dot: "#f5c518" },
  Pendiente: { bg: "rgba(245,197,24,0.15)", color: "#f5c518", dot: "#f5c518" },
  "En Revisión": { bg: "rgba(49,130,206,0.15)", color: "#3182ce", dot: "#3182ce" },
  Declinado: { bg: "rgba(229,62,62,0.15)", color: "#e53e3e", dot: "#e53e3e" },
  Rechazada: { bg: "rgba(229,62,62,0.15)", color: "#e53e3e", dot: "#e53e3e" },
  Cancelada: { bg: "rgba(107,114,128,0.15)", color: "#6b7280", dot: "#6b7280" },
  Cerrada: { bg: "rgba(49,130,206,0.15)", color: "#3182ce", dot: "#3182ce" },
};

function StatCard({ label, value, gauge }: { label: string; value: string | number; gauge?: number }) {
  return (
    <div
      className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-xl min-w-0"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="min-w-0">
        <p className="text-[11px] md:text-xs mb-0.5 truncate" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-xl md:text-2xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
      </div>
      {gauge !== undefined && (
        <div className="ml-auto shrink-0 hidden sm:block">
          <GaugeIcon value={gauge} />
        </div>
      )}
    </div>
  );
}

function GaugeIcon({ value }: { value: number }) {
  const r = 20;
  const circ = Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width="48" height="32" viewBox="0 0 48 32">
      <path d="M4 28 A20 20 0 0 1 44 28" fill="none" stroke="var(--border)" strokeWidth="5" strokeLinecap="round"/>
      <path
        d="M4 28 A20 20 0 0 1 44 28"
        fill="none"
        stroke="var(--yellow)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
      />
    </svg>
  );
}

export default function SolicitudesPage() {
  const navigate = useNavigate();
  const { solicitudes, modo } = useSolicitudes();
  const cargando = modo === "cargando";
  const [filtro, setFiltro] = useState("Todos");

  const filtered = filtro === "Todos" ? solicitudes : solicitudes.filter((s) => s.estado === filtro);

  const totalSolicitudes = solicitudes.length;
  const aprobadas = solicitudes.filter((s) => s.estado === "Aprobada").length;
  const enRevision = solicitudes.filter((s) => s.estado === "Pendiente" || s.estado === "En Revisión").length;
  const enEspera = solicitudes.filter((s) => s.estado === "Pendiente").length;

  const pctAprobadas = totalSolicitudes > 0 ? Math.round((aprobadas / totalSolicitudes) * 100) : 0;
  const pctRevision = totalSolicitudes > 0 ? Math.round((enRevision / totalSolicitudes) * 100) : 0;
  const pctEspera = totalSolicitudes > 0 ? Math.round((enEspera / totalSolicitudes) * 100) : 0;

  return (
    <div className="page">
      <div className="mb-5">
        <h1 className="page-title">
          Tabla de seguimiento
        </h1>
        <p className="page-subtitle">
          Seguimiento de solicitudes y su estado actual
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total solicitudes" value={cargando ? "…" : totalSolicitudes} />
        <StatCard label="Aprobadas" value={`${pctAprobadas}%`} gauge={pctAprobadas} />
        <StatCard label="En revisión" value={`${pctRevision}%`} gauge={pctRevision} />
        <StatCard label="En espera" value={`${pctEspera}%`} gauge={pctEspera} />
      </div>

      <AvisoDatos />

      {/* Table card */}
      <div className="card overflow-hidden">
        {/* Table toolbar */}
        <div
          className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex gap-2 flex-wrap">
            {["Todos", "Aprobada", "Pendiente", "En Revisión", "Rechazada"].map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={
                  filtro === f
                    ? { background: "var(--navy)", color: "#fff" }
                    : { background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                }
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/dashboard/solicitud")}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 shrink-0"
            style={{ background: "var(--teal)", color: "#fff" }}
          >
            + Nueva Solicitud
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabla-scroll min-w-[860px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["ID", "Recurso", "Solicitante", "Departamento", "Fecha solicitud", "Fecha reservada", "Horario", "Estado", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    {cargando ? "Cargando solicitudes…" : "No hay solicitudes registradas aún."}
                  </td>
                </tr>
              ) : filtered.map((s, i) => {
                const est = estadoStyles[s.estado] ?? estadoStyles["Pendiente"];
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                    className="transition-colors hover:bg-opacity-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-xs" style={{ color: "var(--text)" }}>
                      {s.recurso}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text)" }}>
                      {s.solicitante}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.departamento}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.fechaSolicitud}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text)" }}>
                      {s.fechaReserva ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.horaInicio} – {s.horaFin}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: est.bg, color: est.color }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: est.dot }}
                        />
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-xs transition-opacity hover:opacity-70"
                        style={{ color: "var(--text-muted)" }}
                      >
                        ···
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          className="px-4 py-2 text-xs tabla-scroll md:hidden"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          Desliza la tabla horizontalmente →
        </div>
      </div>
    </div>
  );
}
