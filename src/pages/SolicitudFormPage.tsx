import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSolicitudes } from "../context/SolicitudesContext";
import { recursos } from "./RecursosPage";
import CalendarioReserva, { esFinDeSemana } from "../components/CalendarioReserva";

const tipoRecurso: Record<string, string> = {
  "cancha-manuel-mont": "cancha",
  "cancha-pedro-de-valdivia": "cancha",
  "escenario-pedro-de-valdivia": "escenario",
  auditorio: "auditorio",
  "gimnasio-manuel-mont": "gimnasio",
};

function tipoDeRecurso(id: string, nombre: string): string {
  if (tipoRecurso[id]) return tipoRecurso[id];
  const n = nombre.toLowerCase();
  if (n.includes("cancha")) return "cancha";
  if (n.includes("escenario")) return "escenario";
  if (n.includes("sala")) return "sala";
  if (n.includes("auditorio")) return "auditorio";
  if (n.includes("laboratorio")) return "laboratorio";
  if (n.includes("gimnasio")) return "gimnasio";
  return "equipamiento";
}

const ACTIVIDADES_DEPORTIVAS = ["Entrenamiento", "Torneo", "Partido Amistoso", "Clases deportivas"];
const CON_FERIA_ESCOLAR = new Set(["cancha-manuel-mont", "cancha-pedro-de-valdivia", "gimnasio-manuel-mont"]);
const CON_ACTIVIDADES_DEPORTIVAS = new Set(["cancha-manuel-mont", "cancha-pedro-de-valdivia"]);

function opcionesTipoActividad(recursoId: string): string[] {
  const ops = ["Charla Educativa"];
  if (CON_FERIA_ESCOLAR.has(recursoId)) ops.push("Feria Escolar");
  if (CON_ACTIVIDADES_DEPORTIVAS.has(recursoId)) ops.push(...ACTIVIDADES_DEPORTIVAS);
  ops.push("Otro");
  return ops;
}

const HORAS: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 17; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 17) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

const OPCIONES_SILLAS = ["10", "20", "30", "40", "50", "75", "100", "150", "200", "250", "300", "Más de 300"];

const camposAdicionales: Record<string, { label: string; tipo: "text" | "number" | "select" | "checkbox"; opciones?: string[] }[]> = {
  cancha: [
    { label: "Número de participantes", tipo: "number" },
    { label: "Material deportivo requerido", tipo: "text" },
  ],
  gimnasio: [
    { label: "Número de participantes", tipo: "number" },
    { label: "¿Requiere implementos adicionales?", tipo: "checkbox" },
    { label: "Implementos requeridos", tipo: "text" },
  ],
  sala: [
    { label: "Número de participantes", tipo: "number" },
    { label: "Equipamiento audiovisual", tipo: "select", opciones: ["Sin requerimiento", "Proyector", "Proyector + Audio", "Videoconferencia", "Pizarrón digital"] },
    { label: "Disposición del mobiliario", tipo: "select", opciones: ["Auditorio", "Mesa redonda", "En U", "Clase", "Libre"] },
    { label: "¿Requiere coffee break?", tipo: "checkbox" },
  ],
  auditorio: [
    { label: "Número de asistentes", tipo: "number" },
    { label: "Equipamiento requerido", tipo: "select", opciones: ["Proyector + micrófono", "Transmisión en vivo", "Sonido + Iluminación", "Básico"] },
    { label: "¿Requiere personal de apoyo?", tipo: "checkbox" },
  ],
  escenario: [
    { label: "Número de asistentes esperados", tipo: "number" },
    { label: "¿Requiere sonido profesional?", tipo: "checkbox" },
    { label: "¿Requiere iluminación especial?", tipo: "checkbox" },
    { label: "¿Requiere camerino?", tipo: "checkbox" },
  ],
  laboratorio: [
    { label: "Número de equipos requeridos", tipo: "number" },
    { label: "Software requerido", tipo: "text" },
    { label: "Asignatura / Actividad académica", tipo: "text" },
    { label: "¿Requiere impresoras?", tipo: "checkbox" },
  ],
  equipamiento: [
    { label: "Lugar de uso del equipamiento", tipo: "text" },
    { label: "Descripción del uso previsto", tipo: "text" },
    { label: "¿Requiere instalación técnica?", tipo: "checkbox" },
  ],
};

const inputStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: "8px",
  padding: "9px 13px",
  width: "100%",
  fontSize: "13px",
  outline: "none",
  transition: "border-color 0.15s",
};

const selectStyle = {
  ...inputStyle,
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b84a6' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: "32px",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label} {required && <span style={{ color: "var(--teal)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      <span className="text-xs font-bold uppercase tracking-widest px-2" style={{ color: "var(--teal)" }}>
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}

function focusHandlers(e: React.FocusEvent<HTMLElement>, active: boolean) {
  e.target.style.borderColor = active ? "var(--teal)" : "var(--border)";
}

export default function SolicitudFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addSolicitud, solicitudes } = useSolicitudes();

  const recursoInicial = searchParams.get("recurso");
  const [recursoId, setRecursoId] = useState(
    recursos.some((r) => r.id === recursoInicial) ? recursoInicial! : recursos[0].id
  );
  const [responsable, setResponsable] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaReserva, setFechaReserva] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [tipoActividad, setTipoActividad] = useState("");
  const [detalleActividad, setDetalleActividad] = useState("");
  const [sillas, setSillas] = useState("");
  const [arbitro, setArbitro] = useState("");
  const [adicionales, setAdicionales] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const recursoActual = recursos.find((r) => r.id === recursoId) ?? recursos[0];
  const camposExtra = camposAdicionales[tipoDeRecurso(recursoActual.id, recursoActual.nombre)] ?? [];
  const opcionesActividad = opcionesTipoActividad(recursoActual.id);
  const loggedUser = { nombre: user?.nombre ?? "", email: user?.email ?? "", departamento: user?.departamento ?? "" };

  function fechasReservadasDe(nombreRecurso: string): Set<string> {
    const set = new Set<string>();
    for (const s of solicitudes) {
      if (s.recurso !== nombreRecurso) continue;
      if (s.estado !== "Aprobada" && s.estado !== "Aprobado") continue;
      const fecha = s.fechaReserva ?? s.inicio?.split(" ")[0];
      if (fecha) set.add(fecha);
    }
    return set;
  }

  const fechasReservadas = useMemo(
    () => fechasReservadasDe(recursoActual.nombre),
    [solicitudes, recursoActual.nombre]
  );

  function handleAdicional(label: string, value: string | boolean) {
    setAdicionales((prev) => ({ ...prev, [label]: value }));
  }

  function cambiarRecurso(nuevoId: string) {
    setRecursoId(nuevoId);
    setAdicionales({});
    setTipoActividad("");
    setDetalleActividad("");
    setSillas("");
    setArbitro("");
    const nuevo = recursos.find((r) => r.id === nuevoId);
    if (nuevo && fechasReservadasDe(nuevo.nombre).has(fechaReserva)) {
      setFechaReserva("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!responsable.trim()) return setError("Indica el responsable de la actividad.");
    if (!fechaReserva) return setError("Selecciona la fecha reservada en el calendario.");
    if (esFinDeSemana(fechaReserva)) return setError("La fecha reservada debe ser de lunes a viernes.");
    if (fechasReservadas.has(fechaReserva)) return setError("Esa fecha ya está reservada para este recurso. Elige otro día.");
    if (!horaInicio || !horaFin) return setError("Selecciona la hora de inicio y de término.");
    if (horaInicio < "08:00" || horaInicio > "17:00" || horaFin < "08:00" || horaFin > "17:00") {
      return setError("El horario debe estar dentro del rango de 08:00 a 17:00.");
    }
    if (horaInicio >= horaFin) return setError("La hora de inicio debe ser anterior a la hora de término.");
    if (!tipoActividad) return setError("Selecciona el tipo de actividad.");
    if (tipoActividad === "Otro" && !detalleActividad.trim()) {
      return setError("Describe el tipo de actividad que se realizará.");
    }
    if (tipoActividad === "Charla Educativa" && !sillas) {
      return setError("Selecciona la cantidad de sillas necesarias.");
    }
    if (ACTIVIDADES_DEPORTIVAS.includes(tipoActividad) && !arbitro) {
      return setError("Indica si la actividad requiere árbitro.");
    }

    const adicionalesFinales: Record<string, string | boolean> = { ...adicionales };
    adicionalesFinales["Tipo de actividad"] = tipoActividad;
    if (tipoActividad === "Otro") adicionalesFinales["Detalle de la actividad"] = detalleActividad.trim();
    if (tipoActividad === "Charla Educativa") adicionalesFinales["Cantidad de sillas"] = sillas;
    if (ACTIVIDADES_DEPORTIVAS.includes(tipoActividad)) adicionalesFinales["¿Requiere árbitro?"] = arbitro;

    setEnviando(true);
    try {
      await addSolicitud({
        recurso: recursoActual.nombre,
        recursoId: recursoActual.id,
        solicitante: loggedUser.nombre,
        departamento: loggedUser.departamento,
        responsable: responsable.trim() || loggedUser.nombre,
        fechaReserva,
        inicio: `${fechaReserva} ${horaInicio}`,
        termino: `${fechaReserva} ${horaFin}`,
        horaInicio,
        horaFin,
        descripcion,
        adicionales: adicionalesFinales,
      });
      setSubmitted(true);
      const target = user?.rol === "supervisor" ? "/dashboard/gestion" : "/dashboard/solicitudes";
      setTimeout(() => navigate(target), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {submitted && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(56,161,105,0.2)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38a169" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>¡Solicitud enviada!</h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Redirigiendo a seguimiento…</p>
          </div>
        </div>
      )}

      <div className="mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm mb-4 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text)" }}>Registro de Solicitud</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Completa los datos para solicitar la reserva de un recurso
        </p>
      </div>

      <div className="rounded-2xl p-4 md:p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Sección: Recurso */}
          <SectionTitle>Recurso a solicitar</SectionTitle>
          <Field label="Recurso a solicitar" required>
            <select
              value={recursoId}
              onChange={(e) => cambiarRecurso(e.target.value)}
              style={selectStyle}
              onFocus={(e) => focusHandlers(e, true)}
              onBlur={(e) => focusHandlers(e, false)}
            >
              {recursos.map((r) => (
                <option key={r.id} value={r.id} style={{ background: "var(--surface)" }}>{r.nombre}</option>
              ))}
            </select>
          </Field>

          {/* Sección: Datos del solicitante */}
          <SectionTitle>Datos del solicitante</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Solicitante" required>
              <input
                type="text"
                value={loggedUser.nombre}
                readOnly
                style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }}
              />
            </Field>
            <Field label="Correo electrónico" required>
              <input
                type="email"
                value={loggedUser.email}
                readOnly
                style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Responsable de la actividad" required>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Nombre del responsable"
                style={inputStyle}
                onFocus={(e) => focusHandlers(e, true)}
                onBlur={(e) => focusHandlers(e, false)}
              />
            </Field>
          </div>

          {/* Sección: Fecha y hora */}
          <SectionTitle>Fecha y horario</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Fecha reservada" required>
              <CalendarioReserva
                value={fechaReserva}
                onChange={setFechaReserva}
                fechasReservadas={fechasReservadas}
              />
              <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                Solo lunes a viernes. Las fechas en rojo ya están reservadas y no pueden volver a usarse.
              </p>
            </Field>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Hora inicio" required>
                  <select
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    style={selectStyle}
                    onFocus={(e) => focusHandlers(e, true)}
                    onBlur={(e) => focusHandlers(e, false)}
                  >
                    <option value="" style={{ background: "var(--surface)" }}>Seleccionar…</option>
                    {HORAS.map((h) => (
                      <option key={h} value={h} style={{ background: "var(--surface)" }}>{h}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Hora término" required>
                  <select
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    style={selectStyle}
                    onFocus={(e) => focusHandlers(e, true)}
                    onBlur={(e) => focusHandlers(e, false)}
                  >
                    <option value="" style={{ background: "var(--surface)" }}>Seleccionar…</option>
                    {HORAS.map((h) => (
                      <option key={h} value={h} style={{ background: "var(--surface)" }}>{h}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div
                className="rounded-lg px-3 py-2.5 text-xs"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                Horario permitido: <strong style={{ color: "var(--text)" }}>08:00 a 17:00</strong>. La reserva solo se registra de lunes a viernes.
              </div>
              {fechaReserva && (
                <div
                  className="rounded-lg px-3 py-2.5 text-xs"
                  style={{ background: "var(--teal-light)", border: "1px solid var(--teal)", color: "var(--text)" }}
                >
                  Fecha seleccionada: <strong>{fechaReserva}</strong>
                  {horaInicio && horaFin && (
                    <> · {horaInicio} a {horaFin}</>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sección: Actividad */}
          <SectionTitle>Datos de la actividad</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tipo de actividad" required>
              <select
                value={tipoActividad}
                onChange={(e) => {
                  setTipoActividad(e.target.value);
                  setDetalleActividad("");
                  setSillas("");
                  setArbitro("");
                }}
                style={selectStyle}
                onFocus={(e) => focusHandlers(e, true)}
                onBlur={(e) => focusHandlers(e, false)}
              >
                <option value="" style={{ background: "var(--surface)" }}>Seleccionar…</option>
                {opcionesActividad.map((o) => (
                  <option key={o} value={o} style={{ background: "var(--surface)" }}>{o}</option>
                ))}
              </select>
            </Field>

            {tipoActividad === "Otro" && (
              <Field label="Especifique el tipo de actividad" required>
                <input
                  type="text"
                  value={detalleActividad}
                  onChange={(e) => setDetalleActividad(e.target.value)}
                  placeholder="Describe el tipo de actividad…"
                  style={inputStyle}
                  onFocus={(e) => focusHandlers(e, true)}
                  onBlur={(e) => focusHandlers(e, false)}
                />
              </Field>
            )}

            {tipoActividad === "Charla Educativa" && (
              <Field label="Cantidad de sillas necesarias" required>
                <select
                  value={sillas}
                  onChange={(e) => setSillas(e.target.value)}
                  style={selectStyle}
                  onFocus={(e) => focusHandlers(e, true)}
                  onBlur={(e) => focusHandlers(e, false)}
                >
                  <option value="" style={{ background: "var(--surface)" }}>Seleccionar cantidad…</option>
                  {OPCIONES_SILLAS.map((o) => (
                    <option key={o} value={o} style={{ background: "var(--surface)" }}>{o}</option>
                  ))}
                </select>
              </Field>
            )}

            {ACTIVIDADES_DEPORTIVAS.includes(tipoActividad) && (
              <Field label="¿Requiere árbitro?" required>
                <select
                  value={arbitro}
                  onChange={(e) => setArbitro(e.target.value)}
                  style={selectStyle}
                  onFocus={(e) => focusHandlers(e, true)}
                  onBlur={(e) => focusHandlers(e, false)}
                >
                  <option value="" style={{ background: "var(--surface)" }}>Seleccionar…</option>
                  <option value="Sí" style={{ background: "var(--surface)" }}>Sí</option>
                  <option value="No" style={{ background: "var(--surface)" }}>No</option>
                </select>
              </Field>
            )}
          </div>

          <Field label="Descripción de la actividad" required>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe brevemente la actividad a realizar…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => focusHandlers(e, true)}
              onBlur={(e) => focusHandlers(e, false)}
            />
          </Field>

          {/* Campos adicionales dinámicos */}
          {camposExtra.length > 0 && (
            <>
              <SectionTitle>Requerimientos de {recursoActual.nombre}</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {camposExtra.map((campo) => (
                  <div key={campo.label} className={campo.tipo === "checkbox" ? "flex items-center gap-3 col-span-1" : "col-span-1"}>
                    {campo.tipo === "checkbox" ? (
                      <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={!!adicionales[campo.label]}
                          onChange={(e) => handleAdicional(campo.label, e.target.checked)}
                          className="sr-only"
                        />
                        <div className="checkbox-box w-5 h-5 rounded border-2 flex items-center justify-center transition-all" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                          <svg className="w-3 h-3 text-white opacity-0 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-sm" style={{ color: "var(--text)" }}>{campo.label}</span>
                      </label>
                    ) : campo.tipo === "select" ? (
                      <Field label={campo.label}>
                        <select
                          value={(adicionales[campo.label] as string) ?? ""}
                          onChange={(e) => handleAdicional(campo.label, e.target.value)}
                          style={selectStyle}
                          onFocus={(e) => focusHandlers(e, true)}
                          onBlur={(e) => focusHandlers(e, false)}
                        >
                          <option value="" style={{ background: "var(--surface)" }}>Seleccionar…</option>
                          {campo.opciones?.map((o) => (
                            <option key={o} value={o} style={{ background: "var(--surface)" }}>{o}</option>
                          ))}
                        </select>
                      </Field>
                    ) : (
                      <Field label={campo.label}>
                        <input
                          type={campo.tipo}
                          value={(adicionales[campo.label] as string) ?? ""}
                          onChange={(e) => handleAdicional(campo.label, e.target.value)}
                          style={inputStyle}
                          onFocus={(e) => focusHandlers(e, true)}
                          onBlur={(e) => focusHandlers(e, false)}
                        />
                      </Field>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "rgba(229,62,62,0.12)", border: "1px solid rgba(229,62,62,0.4)", color: "#e53e3e" }}
            >
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--yellow)", color: "#1a1a1a" }}
            >
              {enviando ? "Enviando…" : "Enviar Solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
