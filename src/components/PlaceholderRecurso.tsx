export default function PlaceholderRecurso({
  nombre,
  className = "w-full h-52",
}: {
  nombre: string;
  className?: string;
}) {
  return (
    <div
      className={`${className} flex flex-col items-center justify-center gap-2`}
      style={{
        background: "var(--surface-2)",
        border: "2px dashed var(--border)",
        borderRadius: "8px",
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
        Espacio para imagen
      </p>
      <p className="text-[11px]" style={{ color: "var(--text-muted)", opacity: 0.75 }}>
        {nombre}
      </p>
    </div>
  );
}
