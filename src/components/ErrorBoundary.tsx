import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error de render:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        className="min-h-dvh flex items-center justify-center p-6"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(229,62,62,0.15)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-lg font-bold mb-2">Algo salió mal</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            La página encontró un error inesperado. Puedes recargar para volver a intentarlo.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--teal)", color: "#fff" }}
            >
              Recargar página
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
            >
              Ir al inicio
            </button>
          </div>
          {this.state.error.message && (
            <p className="mt-5 text-xs font-mono break-words" style={{ color: "var(--text-muted)" }}>
              {this.state.error.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}
