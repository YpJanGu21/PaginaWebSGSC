import { useAuth } from "../context/AuthContext";

export default function CuentaPage() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.nombre
    .split(" ")
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-4 md:p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text)" }}>Cuenta</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Información de tu perfil institucional</p>
      </div>

      <div className="rounded-xl p-6 space-y-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ background: "#0a1628" }}>
            {initials}
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>{user.nombre}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email}</p>
          </div>
        </div>

        {[
          { label: "Departamento", value: user.departamento },
          { label: "Rol", value: user.rol === "supervisor" ? "Supervisor" : "Usuario" },
        ].map((f) => (
          <div key={f.label} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
            <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{f.label}</p>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
