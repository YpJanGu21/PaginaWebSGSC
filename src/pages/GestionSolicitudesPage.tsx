import { useState } from "react";
import { useSolicitudes } from "../context/SolicitudesContext";
import type { Solicitud, EstadoSolicitud } from "../context/SolicitudesContext";
import AvisoDatos from "../components/AvisoDatos";

const estadoStyles: Record<string, { bg: string; color: string }> = {
  Pendiente:  { bg: "rgba(245,197,24,0.15)",  color: "#d4a017" },
  Aprobada:   { bg: "rgba(56,161,105,0.15)",  color: "#38a169" },
  Rechazada:  { bg: "rgba(229,62,62,0.15)",   color: "#e53e3e" },
  Cancelada:  { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
  Cerrada:    { bg: "rgba(49,130,206,0.15)",  color: "#3182ce" },
};

const estadosTransicion: Record<string, string[]> = {
  Pendiente: ["Aprobada", "Rechazada", "Cancelada"],
  Aprobada:  ["Cerrada", "Cancelada"],
  Rechazada: [],
  Cancelada: [],
  Cerrada:   [],
};

export default function GestionSolicitudesPage() {
  const { solicitudes, updateEstado, modo } = useSolicitudes();
  const cargando = modo === "cargando";
  const [filtro, setFiltro] = useState<string>("Todos");
  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  const [observacion, setObservacion] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [errorCambio, setErrorCambio] = useState<string | null>(null);

  const filtered = filtro === "Todos" ? solicitudes : solicitudes.filter((s) => s.estado === filtro);

  function abrirDetalle(s: Solicitud) {
    setSeleccionada(s);
    setNuevoEstado("");
    setObservacion(s.observacionCierre ?? "");
    setErrorCambio(null);
    setShowModal(true);
  }

  async function aplicarCambio() {
    if (!seleccionada || !nuevoEstado) return;
    setErrorCambio(null);
    try {
      await updateEstado(
        seleccionada.id,
        nuevoEstado as EstadoSolicitud,
        nuevoEstado === "Cerrada" ? observacion : undefined
      );
      setShowModal(false);
    } catch (err) {
      setErrorCambio(err instanceof Error ? err.message : "No se pudo actualizar la solicitud.");
    }
  }

  const transiciones = seleccionada ? (estadosTransicion[seleccionada.estado] ?? []) : [];

  return (
    <div className="p-4 md:p-6">
      {/* Modal detalle */}
      {showModal && seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div
            className="rounded-2xl p-4 md:p-6 w-full max-w-lg mx-4 max-h-[88dvh] overflow-y-auto"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  Detalle — {seleccionada.id}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{seleccionada.recurso}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
              {[
                ["Solicitante", seleccionada.solicitante],
                ["Responsable", seleccionada.responsable],
                ["Departamento", seleccionada.departamento],
                ["Fecha solicitud", seleccionada.fechaSolicitud],
                ["Fecha reserva", seleccionada.fechaReserva ?? "—"],
                ["Horario", `${seleccionada.horaInicio} – ${seleccionada.horaFin}`],
                ["Inicio", seleccionada.inicio],
                ["Término", seleccionada.termino],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>{k}</p>
                  <p style={{ color: "var(--text)" }}>{v}</p>
                </div>
              ))}
            </div>
            {seleccionada.adicionales && Object.keys(seleccionada.adicionales).length > 0 && (
              <div className="mb-4 text-xs">
                <p className="font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
                  Detalles de la actividad
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(seleccionada.adicionales)
                    .filter(([, v]) => v !== "" && v !== false)
                    .map(([k, v]) => (
                      <span
                        key={k}
                        className="px-2 py-1 rounded-lg"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                      >
                        <strong>{k}:</strong> {String(v)}
                      </span>
                    ))}
                </div>
              </div>
            )}
            <div className="mb-4 text-xs">
              <p className="font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>Descripción</p>
              <p style={{ color: "var(--text)" }}>{seleccionada.descripcion}</p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Estado actual:</span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: (estadoStyles[seleccionada.estado] ?? estadoStyles["Pendiente"]).bg, color: (estadoStyles[seleccionada.estado] ?? estadoStyles["Pendiente"]).color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: (estadoStyles[seleccionada.estado] ?? estadoStyles["Pendiente"]).color }} />
                {seleccionada.estado}
              </span>
            </div>

            {transiciones.length > 0 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Cambiar estado a
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {transiciones.map((t) => (
                      <button
                        key={t}
                        onClick={() => setNuevoEstado(t)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={
                          nuevoEstado === t
                            ? { background: (estadoStyles[t] ?? estadoStyles["Pendiente"]).color, color: "#fff" }
                            : { background: (estadoStyles[t] ?? estadoStyles["Pendiente"]).bg, color: (estadoStyles[t] ?? estadoStyles["Pendiente"]).color, border: `1px solid ${(estadoStyles[t] ?? estadoStyles["Pendiente"]).color}40` }
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {nuevoEstado === "Cerrada" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Observaciones de cierre <span style={{ color: "var(--teal)" }}>*</span>
                    </label>
                    <textarea
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      rows={4}
                      placeholder="Ej: Equipamiento entregado correctamente. Sin incidencias durante la actividad…"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        borderRadius: "8px",
                        padding: "9px 13px",
                        width: "100%",
                        fontSize: "13px",
                        outline: "none",
                        resize: "vertical",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Registra el estado del recurso: equipamiento, daños, faltantes o incidencias.
                    </p>
                  </div>
                )}

                {errorCambio && (
                  <div
                    className="rounded-lg px-3 py-2 text-xs font-medium"
                    style={{ background: "rgba(229,62,62,0.12)", border: "1px solid rgba(229,62,62,0.4)", color: "#e53e3e" }}
                  >
                    {errorCambio}
                  </div>
                )}

                {nuevoEstado && (
                  <button
                    onClick={aplicarCambio}
                    disabled={nuevoEstado === "Cerrada" && !observacion.trim()}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: "var(--yellow)", color: "#1a1a1a" }}
                  >
                    Confirmar cambio
                  </button>
                )}
              </div>
            )}

            {seleccionada.observacionCierre && (
              <div className="mt-4 rounded-lg p-3" style={{ background: "rgba(49,130,206,0.08)", border: "1px solid rgba(49,130,206,0.2)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#3182ce" }}>
                  Observaciones de cierre
                </p>
                <p className="text-xs" style={{ color: "var(--text)" }}>{seleccionada.observacionCierre}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text)" }}>Gestión de Solicitudes</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Revisa, aprueba y gestiona el estado de las solicitudes en curso
        </p>
      </div>

      <AvisoDatos />

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap mb-5">
        {(["Todos", "Pendiente", "Aprobada", "Rechazada", "Cancelada", "Cerrada"] as const).map((f) => {
          const count = f === "Todos" ? solicitudes.length : solicitudes.filter((s) => s.estado === f).length;
          const st = f !== "Todos" ? estadoStyles[f] : null;
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={
                filtro === f
                  ? { background: "var(--navy)", color: "#fff" }
                  : { background: st ? st.bg : "var(--surface-2)", color: st ? st.color : "var(--text-muted)", border: "1px solid var(--border)" }
              }
            >
              {f}
              <span className="rounded-full px-1.5 py-0.5 text-xs font-bold" style={{ background: "rgba(255,255,255,0.15)" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabla-scroll min-w-[920px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["ID", "Recurso", "Solicitante", "Responsable", "Inicio", "Término", "Estado", "Acciones"].map((h) => (
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
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    {cargando ? "Cargando solicitudes…" : "No hay solicitudes para mostrar."}
                  </td>
                </tr>
              ) : filtered.map((s, i) => {
                const est = estadoStyles[s.estado] ?? estadoStyles["Pendiente"];
                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{s.id}</td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text)" }}>{s.recurso}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text)" }}>{s.solicitante}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{s.responsable}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{s.inicio}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{s.termino}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: est.bg, color: est.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: est.color }} />
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => abrirDetalle(s)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
