import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import PanelAcceso from "../components/PanelAcceso";

export default function RegistroPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const { iniciarRegistro, verificarRegistro, reenviarRegistro, cancelarRegistro } = useAuth();

  const [paso, setPaso] = useState<"datos" | "codigo">("datos");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [loading, setLoading] = useState(false);
  const [esperaReenvio, setEsperaReenvio] = useState(0);

  function iniciarContadorReenvio() {
    setEsperaReenvio(60);
    const intervalo = setInterval(() => {
      setEsperaReenvio((s) => {
        if (s <= 1) {
          clearInterval(intervalo);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function handleDatos(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const resultado = await iniciarRegistro({ nombre, email, password, confirmar });
    setLoading(false);
    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo iniciar el registro.");
      return;
    }
    if (resultado.verificado) {
      navigate("/dashboard/inicio");
      return;
    }
    setPaso("codigo");
    setAviso("");
    iniciarContadorReenvio();
  }

  async function handleCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const resultado = await verificarRegistro(codigo);
    setLoading(false);
    if (!resultado.ok) {
      setError(resultado.error ?? "El código es incorrecto. Revisa tu correo e intenta de nuevo.");
      setCodigo("");
      return;
    }
    navigate("/dashboard/inicio");
  }

  async function handleReenviar() {
    setError("");
    setAviso("");
    const resultado = await reenviarRegistro();
    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo reenviar el código.");
      return;
    }
    setAviso("Código reenviado. Revisa tu correo (y spam).");
    iniciarContadorReenvio();
  }

  function handleVolver() {
    cancelarRegistro();
    setPaso("datos");
    setCodigo("");
    setError("");
    setAviso("");
  }

  const inputClase = "w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all";
  const bordeConError = (tieneError: boolean) => (tieneError ? "#e53e3e" : "var(--border)");

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
            {paso === "datos" ? "Registro Institucional" : "Verificación de correo"}
          </p>
          <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
            {paso === "datos" ? "Crea tu cuenta" : "Revisa tu correo"}
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            {paso === "datos"
              ? "Solo se permiten correos institucionales de CET Chile."
              : <>Enviamos un código de 6 dígitos a <strong style={{ color: "var(--text)" }}>{email}</strong>.</>}
          </p>

          {paso === "datos" ? (
            <form onSubmit={handleDatos} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); setError(""); }}
                  placeholder="Ej: Juan Pérez"
                  required
                  autoComplete="name"
                  className={inputClase}
                  style={{
                    background: "var(--surface-2)",
                    border: `1px solid ${bordeConError(!!error)}`,
                    color: "var(--text)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                  onBlur={(e) => (e.target.style.borderColor = bordeConError(!!error))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                  Correo institucional
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="correo@alumnos.cetchile.cl"
                  required
                  autoComplete="email"
                  className={inputClase}
                  style={{
                    background: "var(--surface-2)",
                    border: `1px solid ${bordeConError(!!error)}`,
                    color: "var(--text)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                  onBlur={(e) => (e.target.style.borderColor = bordeConError(!!error))}
                />
                <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                  Aceptados: @cetchile.cl y @alumnos.cetchile.cl
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
                  className={inputClase}
                  style={{
                    background: "var(--surface-2)",
                    border: `1px solid ${bordeConError(!!error)}`,
                    color: "var(--text)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                  onBlur={(e) => (e.target.style.borderColor = bordeConError(!!error))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                  Repetir contraseña
                </label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => { setConfirmar(e.target.value); setError(""); }}
                  placeholder="Repite la contraseña"
                  required
                  autoComplete="new-password"
                  className={inputClase}
                  style={{
                    background: "var(--surface-2)",
                    border: `1px solid ${confirmar && confirmar !== password ? "#e53e3e" : "var(--border)"}`,
                    color: "var(--text)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = confirmar !== password ? "#e53e3e" : "var(--teal)")}
                  onBlur={(e) => (e.target.style.borderColor = confirmar !== password ? "#e53e3e" : "var(--border)")}
                />
                {confirmar && confirmar !== password && (
                  <p className="text-xs mt-1" style={{ color: "#e53e3e" }}>Las contraseñas no coinciden</p>
                )}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--navy)" }}
              >
                {loading ? "Enviando código…" : "Continuar →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodigo} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                  Código de verificación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  placeholder="000000"
                  required
                  autoFocus
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg text-center text-2xl font-mono tracking-[0.5em] outline-none transition-all"
                  style={{
                    background: "var(--surface-2)",
                    border: `1px solid ${error ? "#e53e3e" : "var(--border)"}`,
                    color: "var(--text)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
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
                  <span>{error} Puedes reintentar las veces que necesites.</span>
                </div>
              )}

              {aviso && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: "rgba(56,161,105,0.1)", color: "#38a169", border: "1px solid rgba(56,161,105,0.3)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {aviso}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || codigo.length !== 6}
                className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--navy)" }}
              >
                {loading ? "Verificando…" : "Verificar y crear cuenta"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleReenviar}
                  disabled={esperaReenvio > 0}
                  className="transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: "var(--teal)" }}
                >
                  {esperaReenvio > 0 ? `Reenviar código (${esperaReenvio}s)` : "Reenviar código"}
                </button>
                <button
                  type="button"
                  onClick={handleVolver}
                  className="transition-opacity hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  ← Volver
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            {paso === "datos" ? (
              <>
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => { cancelarRegistro(); navigate("/"); }}
                  className="font-semibold transition-opacity hover:opacity-80"
                  style={{ color: "var(--teal)" }}
                >
                  Inicia sesión
                </button>
              </>
            ) : (
              "El código expira en 1 hora. Si no llega, revisa tu carpeta de spam."
            )}
          </p>

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
            CET Chile · Sistema de Gestión de Solicitudes Corporativas
          </p>
        </div>
      </div>
    </div>
  );
}
