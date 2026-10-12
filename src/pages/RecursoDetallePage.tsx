import { useParams, useNavigate } from "react-router-dom";
import { recursos } from "./RecursosPage";
import PlaceholderRecurso from "../components/PlaceholderRecurso";

function DonutChart({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="8"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--yellow)"
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function RecursoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recurso = recursos.find((r) => r.id === id) ?? recursos[0];

  const estadoColor =
    recurso.estado === "Disponible"
      ? "#f5c518"
      : recurso.estado === "Ocupado"
      ? "var(--red)"
      : "var(--text-muted)";

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => navigate("/dashboard/recursos")}
        className="flex items-center gap-2 text-sm mb-4 transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver a Recursos
      </button>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Card header label */}
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {recurso.nombre}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-0">
          {/* Left: image */}
          <div className="lg:w-1/2 p-5">
            {recurso.image ? (
              <img
                src={recurso.image}
                alt={recurso.nombre}
                className="w-full h-48 md:h-72 object-cover rounded-xl"
              />
            ) : (
              <PlaceholderRecurso nombre={recurso.nombre} className="w-full h-48 md:h-72" />
            )}
          </div>

          {/* Right: info */}
          <div className="lg:w-1/2 p-5 flex flex-col gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight" style={{ color: "var(--text)" }}>
                {recurso.nombre.split(" ").slice(0, -1).join("\n")}
                <br />
                {recurso.nombre.split(" ").slice(-1)}
              </h1>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {recurso.descripcion}
            </p>

            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <span className="text-base font-semibold" style={{ color: "var(--text)" }}>
                Estado:
              </span>
              <span className="text-base font-bold" style={{ color: estadoColor }}>
                {recurso.estado}
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tasa de reserva donut */}
              <div
                className="rounded-xl p-4 flex flex-col items-center gap-2"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 self-start">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <DonutChart value={recurso.tasa} size={84} />
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Tasa de Reserva: {recurso.tasa}%
                </p>
              </div>

              {/* Días de uso */}
              <div
                className="rounded-xl p-4 flex flex-col justify-between"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Días de Uso (mes):
                  </span>
                </div>
                <p className="text-3xl font-bold mt-3" style={{ color: "var(--text)" }}>
                  {recurso.diasUso}
                </p>
              </div>

              {/* Solicitar Reserva */}
              <button
                onClick={() => navigate(`/dashboard/solicitud?recurso=${recurso.id}`)}
                className="col-span-2 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: "var(--yellow)", color: "#1a1a1a" }}
              >
                Solicitar Reserva
              </button>

              {/* Calificación */}
              <div
                className="rounded-xl p-4 col-span-2 flex items-center gap-3"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--yellow)" stroke="var(--yellow)" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Calificación Promedio
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
                    {recurso.calificacion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
