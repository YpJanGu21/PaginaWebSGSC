import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSolicitudes } from "../context/SolicitudesContext";
import { recursos } from "./RecursosPage";
import PlaceholderRecurso from "../components/PlaceholderRecurso";

const estadoColor: Record<string, { bg: string; color: string }> = {
  Disponible: { bg: "rgba(245,197,24,0.15)", color: "#f5c518" },
  Ocupado: { bg: "rgba(229,62,62,0.15)", color: "#e53e3e" },
  Mantenimiento: { bg: "rgba(107,132,166,0.15)", color: "#6b84a6" },
};

export default function InicioPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { solicitudes } = useSolicitudes();

  const estadosActivos = ["Pendiente", "En Espera", "En Revisión", "Aprobada"];
  const activas = solicitudes.filter(
    (s) =>
      estadosActivos.includes(s.estado) &&
      (user?.rol === "supervisor" || s.solicitante === user?.nombre)
  ).length;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text)" }}>
          Bienvenido, {user?.nombre ?? "Usuario"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          CET CHILE · Sistema de Gestión de Solicitudes Corporativas
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Recursos Disponibles", value: String(recursos.length), action: () => navigate("/dashboard/recursos"),
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
          { label: "Mis Solicitudes Activas", value: String(activas), action: () => navigate(user?.rol === "supervisor" ? "/dashboard/gestion" : "/dashboard/solicitudes"),
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
          { label: "Tasa de Ocupación", value: "0%", action: () => navigate("/dashboard/reportes"),
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          { label: "Nueva Solicitud", value: "+", action: () => navigate("/dashboard/solicitud"),
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
        ].map((c) => (
          <button
            key={c.label}
            onClick={c.action}
            className="rounded-xl p-4 text-left transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="mb-2" style={{ color: "var(--teal)" }}>{c.icon}</div>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{c.value}</p>
          </button>
        ))}
      </div>

      {/* Recursos grid */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Recursos disponibles</h2>
        <button
          onClick={() => navigate("/dashboard/recursos")}
          className="text-xs px-3 py-1 rounded-lg transition-opacity hover:opacity-80"
          style={{ color: "var(--teal)", border: "1px solid var(--teal)" }}
        >
          Ver todos
        </button>
      </div>
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
                <img src={r.image} alt={r.nombre} className="w-full h-44 md:h-52 object-cover" />
              ) : (
                <PlaceholderRecurso nombre={r.nombre} className="w-full h-44 md:h-52" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{r.nombre}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
                    {r.estado}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{r.tipo}</p>
                <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>Tasa: <strong style={{ color: "var(--text)" }}>{r.tasa}%</strong></span>
                  <span>Días/mes: <strong style={{ color: "var(--text)" }}>{r.diasUso}</strong></span>
                  <span>⭐ <strong style={{ color: "var(--text)" }}>{r.calificacion}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
