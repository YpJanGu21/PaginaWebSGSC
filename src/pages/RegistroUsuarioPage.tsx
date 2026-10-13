import { useState } from "react";
import { useAuth } from "../context/AuthContext";

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

const perfilColor: Record<string, { bg: string; color: string }> = {
  supervisor: { bg: "rgba(43,191,175,0.15)", color: "#2bbfaf" },
  usuario: { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
};

export default function RegistroUsuarioPage() {
  const { usuarios, registerSupervisor } = useAuth();
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [anexo, setAnexo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (confirmar !== contrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    const result = registerSupervisor(nombres, apellidos, email, contrasena, anexo);
    if (!result.ok) {
      setError(result.error ?? "No se pudo crear el usuario.");
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setNombres(""); setApellidos(""); setEmail(""); setAnexo("");
      setContrasena(""); setConfirmar("");
    }, 2000);
  }

  return (
    <div className="page">
      {submitted && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(43,191,175,0.2)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2bbfaf" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>¡Usuario supervisor registrado!</h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>El usuario ha sido creado exitosamente.</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="page-title">Registro de Usuarios</h1>
        <p className="page-subtitle">
          Administra los accesos al sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Usuarios registrados — izquierda */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Usuarios del sistema</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm tabla-scroll min-w-[520px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Nombre", "Correo", "Anexo", "Perfil"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => {
                  const pc = perfilColor[u.rol] ?? perfilColor["usuario"];
                  const perfilLabel = u.rol === "supervisor" ? "Supervisor" : "Usuario";
                  return (
                    <tr key={u.email} style={{ borderBottom: i < usuarios.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text)" }}>
                        {u.nombre}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{u.anexo ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: pc.bg, color: pc.color }}>
                          {perfilLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Formulario — derecha */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>Nuevo usuario Supervisor</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nombres" required>
                  <input type="text" value={nombres} onChange={(e) => setNombres(e.target.value)}
                    placeholder="Ej: Juan Carlos"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                </Field>
                <Field label="Apellidos" required>
                  <input type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Ej: Rodríguez"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                </Field>
              </div>

              <Field label="Correo electrónico" required>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@cetchile.cl"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </Field>

              <Field label="Anexo telefónico">
                <input type="text" value={anexo} onChange={(e) => setAnexo(e.target.value)}
                  placeholder="Ej: 2201"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </Field>

              <Field label="Contraseña" required>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    style={{ ...inputStyle, paddingRight: "40px" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}>
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </Field>

              <Field label="Confirmar contraseña" required>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repite la contraseña"
                  style={{
                    ...inputStyle,
                    borderColor: confirmar && confirmar !== contrasena ? "#e53e3e" : "var(--border)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = contrasena === confirmar ? "var(--teal)" : "#e53e3e")}
                  onBlur={(e) => (e.target.style.borderColor = confirmar && confirmar !== contrasena ? "#e53e3e" : "var(--border)")}
                />
                {confirmar && confirmar !== contrasena && (
                  <p className="text-xs mt-1" style={{ color: "#e53e3e" }}>Las contraseñas no coinciden</p>
                )}
              </Field>

              {error && (
                <p className="text-xs" style={{ color: "#e53e3e" }}>{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 mt-2"
                style={{ background: "var(--teal)", color: "#fff" }}
              >
                Crear Usuario Supervisor
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
