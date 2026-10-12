export default function ReportesPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text)" }}>
          Reportes y Estadísticas
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Panel de control — Indicadores del uso de Recursos y rendimiento del sistema
        </p>
      </div>

      <div
        className="rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center text-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", minHeight: "320px" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
          Aún no hay reportes disponibles
        </h2>
        <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
          Los indicadores aparecerán cuando existan solicitudes en el sistema.
        </p>
      </div>
    </div>
  );
}
