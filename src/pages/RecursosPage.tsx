import { useNavigate } from "react-router-dom";
import PlaceholderRecurso from "../components/PlaceholderRecurso";
import canchaMM from "../imports/canchaMM.jpeg";
import canchaPV from "../imports/CanchaPV.jpeg";
import escenarioPV from "../imports/Escenario_PV.jpeg";

const recursos = [
  {
    id: "cancha-manuel-mont",
    nombre: "Cancha Manuel Mont",
    tipo: "Espacio Deportivo",
    estado: "Disponible",
    descripcion: "Cancha disponible para actividades recreativas o eventos grandes de la institución, con concierto o copas deportivas.",
    tasa: 85,
    diasUso: 24,
    calificacion: 4.8,
    image: canchaMM,
  },
  {
    id: "cancha-pedro-de-valdivia",
    nombre: "Cancha Pedro de Valdivia",
    tipo: "Espacio Deportivo",
    estado: "Disponible",
    descripcion: "Cancha techada con amplio espacio para actividades deportivas y eventos institucionales.",
    tasa: 78,
    diasUso: 20,
    calificacion: 4.6,
    image: canchaPV,
  },
  {
    id: "escenario-pedro-de-valdivia",
    nombre: "Escenario Pedro de Valdivia",
    tipo: "Escenario",
    estado: "Disponible",
    descripcion: "Escenario techado con pantalla de proyección y espacio para presentaciones y actos institucionales.",
    tasa: 62,
    diasUso: 14,
    calificacion: 4.5,
    image: escenarioPV,
  },
  {
    id: "auditorio",
    nombre: "Auditorio",
    tipo: "Auditorio",
    estado: "Disponible",
    descripcion: "Auditorio institucional para charlas, conferencias, ceremonias y actos académicos de la comunidad escolar.",
    tasa: 50,
    diasUso: 10,
    calificacion: 4.4,
    image: undefined,
  },
  {
    id: "gimnasio-manuel-mont",
    nombre: "Gimnasio Manuel Mont",
    tipo: "Espacio Deportivo",
    estado: "Disponible",
    descripcion: "Gimnasio cubierto para actividades deportivas, entrenamientos, torneos y ferias escolares.",
    tasa: 70,
    diasUso: 18,
    calificacion: 4.7,
    image: undefined,
  },
];

const estadoColor: Record<string, { bg: string; color: string }> = {
  Disponible: { bg: "rgba(245,197,24,0.15)", color: "#f5c518" },
  Ocupado: { bg: "rgba(229,62,62,0.15)", color: "#e53e3e" },
  Mantenimiento: { bg: "rgba(107,132,166,0.15)", color: "#6b84a6" },
};

export default function RecursosPage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text)" }}>
          Recursos
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Espacios y activos disponibles para reserva
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {recursos.map((r) => {
          const s = estadoColor[r.estado] ?? estadoColor["Disponible"];
          return (
            <div
              key={r.id}
              onClick={() => navigate(`/dashboard/recursos/${r.id}`)}
              className="rounded-xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {r.image ? (
                <img
                  src={r.image}
                  alt={r.nombre}
                  className="w-full h-44 md:h-52 object-cover"
                />
              ) : (
                <PlaceholderRecurso nombre={r.nombre} className="w-full h-44 md:h-52" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {r.nombre}
                  </h3>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {r.estado}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  {r.tipo}
                </p>
                <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>Tasa: <strong style={{ color: "var(--text)" }}>{r.tasa}%</strong></span>
                  <span>Días/mes: <strong style={{ color: "var(--text)" }}>{r.diasUso}</strong></span>
                  <span>⭐ <strong style={{ color: "var(--text)" }}>{r.calificacion}</strong></span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/solicitud?recurso=${r.id}`);
                  }}
                  className="mt-3 w-full py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "var(--yellow)", color: "#1a1a1a" }}
                >
                  Solicitar Reserva
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { recursos };
