import cetChileLogo from "../imports/cetchileCla.png";

export default function PanelAcceso() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between panel-login shrink-0 p-8 xl:p-10 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a2040 0%, #0d3068 60%, #0a1628 100%)" }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(var(--teal) 1px, transparent 1px), linear-gradient(90deg, var(--teal) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative z-10">
        <img src={cetChileLogo} alt="CET CHILE" className="h-16 w-auto object-contain" />
      </div>
      <div className="relative z-10">
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-6"
          style={{ background: "rgba(43,191,175,0.15)", color: "var(--teal)", border: "1px solid rgba(43,191,175,0.3)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          S6SC v1.0
        </span>
        <h1 className="text-white text-4xl font-bold leading-tight mb-4">
          Sistema de Gestión de Solicitudes Corporativas
        </h1>
        <p className="text-white/60 text-base leading-relaxed">
          Coordina espacios, activos, personal y materiales desde un solo panel. Diseñado para el flujo interno de CET Chile.
        </p>
      </div>
      <p className="relative z-10 text-white/30 text-xs">
        © 2026 Corporación Educacional Tecnológica de Chile
      </p>
    </div>
  );
}
