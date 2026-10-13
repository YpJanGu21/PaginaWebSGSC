import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import PanelAcceso from "../components/PanelAcceso";

export default function LoginPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const resultado = await login(email, password);
    setLoading(false);
    if (resultado.ok) {
      navigate("/dashboard/inicio");
    } else {
      setError(resultado.error ?? "Correo o contraseña incorrectos. Verifica tus credenciales.");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left panel */}
      <PanelAcceso />

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: "var(--surface)" }}>
        <button
          onClick={toggle}
          className="absolute top-5 right-5 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          aria-label="Cambiar tema"
        >
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        <div className="w-full max-w-[360px]">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--teal)" }}>
            Acceso Institucional
          </p>
          <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
            Inicia sesión
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Usa tu correo institucional para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                Correo institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="correo@cetchile.cl"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: `1px solid ${error ? "#e53e3e" : "var(--border)"}`,
                  color: "var(--text)",
                }}
                onFocus={(e) => (e.target.style.borderColor = error ? "#e53e3e" : "var(--teal)")}
                onBlur={(e) => (e.target.style.borderColor = error ? "#e53e3e" : "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: `1px solid ${error ? "#e53e3e" : "var(--border)"}`,
                  color: "var(--text)",
                }}
                onFocus={(e) => (e.target.style.borderColor = error ? "#e53e3e" : "var(--teal)")}
                onBlur={(e) => (e.target.style.borderColor = error ? "#e53e3e" : "var(--border)")}
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ background: "rgba(229,62,62,0.1)", color: "#e53e3e", border: "1px solid rgba(229,62,62,0.3)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "var(--navy)" }}
                />
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Recordarme</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--navy)" }}
            >
              {loading ? "Verificando…" : "Ingresar al sistema →"}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: "var(--text-muted)" }}>
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              onClick={() => navigate("/registro")}
              className="font-semibold transition-opacity hover:opacity-80"
              style={{ color: "var(--teal)" }}
            >
              Regístrate aquí
            </button>
          </p>

          <p className="text-center text-xs mt-8" style={{ color: "var(--text-muted)" }}>
            CET Chile · Sistema de Gestión de Solicitudes Corporativas
          </p>
        </div>
      </div>
    </div>
  );
}
