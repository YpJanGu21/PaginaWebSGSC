import { useSolicitudes } from "../context/SolicitudesContext";

export default function AvisoDatos() {
  const { modo, errorApi } = useSolicitudes();

  if (modo === "local") {
    return (
      <div
        className="rounded-lg px-4 py-3 text-xs md:text-sm mb-4"
        style={{
          background: "rgba(245,197,24,0.12)",
          border: "1px solid rgba(245,197,24,0.45)",
          color: "var(--text)",
        }}
      >
        <strong>Modo local:</strong> no se encontró la API de solicitudes, así que los registros se guardan en este
        dispositivo. Para guardarlos en la base de datos SQLite, ejecuta <code>npm run server</code> en tu equipo o
        define la variable <code>VITE_API_URL</code> apuntando a tu servidor desplegado.
      </div>
    );
  }

  if (errorApi && modo === "api") {
    return (
      <div
        className="rounded-lg px-4 py-3 text-xs md:text-sm mb-4"
        style={{ background: "rgba(229,62,62,0.12)", border: "1px solid rgba(229,62,62,0.4)", color: "#e53e3e" }}
      >
        {errorApi}
      </div>
    );
  }

  return null;
}
