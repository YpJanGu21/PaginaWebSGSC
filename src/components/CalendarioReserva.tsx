import { useState } from "react";

const DIAS_CORTOS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function fechaISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function esFinDeSemana(iso: string): boolean {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return true;
  const dia = d.getDay();
  return dia === 0 || dia === 6;
}

function diasDelMes(anio: number, mes: number): Date[] {
  const primero = new Date(anio, mes, 1, 12);
  const offsetLunes = (primero.getDay() + 6) % 7;
  const total = new Date(anio, mes + 1, 0, 12).getDate();

  const dias: Date[] = [];
  for (let i = 0; i < offsetLunes; i++) {
    dias.push(new Date(anio, mes, 1 - (offsetLunes - i), 12));
  }
  for (let d = 1; d <= total; d++) {
    dias.push(new Date(anio, mes, d, 12));
  }
  let siguiente = 1;
  while (dias.length % 7 !== 0) {
    dias.push(new Date(anio, mes + 1, siguiente++, 12));
  }
  return dias;
}

export default function CalendarioReserva({
  value,
  onChange,
  fechasReservadas,
}: {
  value: string;
  onChange: (fecha: string) => void;
  fechasReservadas: Set<string>;
}) {
  const inicial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [anio, setAnio] = useState(inicial.getFullYear());
  const [mes, setMes] = useState(inicial.getMonth());

  const dias = diasDelMes(anio, mes);
  const hoyISO = fechaISO(new Date());

  function mover(delta: number) {
    const nuevo = new Date(anio, mes + delta, 1, 12);
    setAnio(nuevo.getFullYear());
    setMes(nuevo.getMonth());
  }

  return (
    <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => mover(-1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          aria-label="Mes anterior"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {MESES[mes]} {anio}
        </span>
        <button
          type="button"
          onClick={() => mover(1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          aria-label="Mes siguiente"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_CORTOS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dias.map((d, i) => {
          const iso = fechaISO(d);
          const fueraDeMes = d.getMonth() !== mes;
          const finDeSemana = esFinDeSemana(iso);
          const reservada = fechasReservadas.has(iso);
          const pasada = iso < hoyISO;
          const seleccionada = value === iso;
          const deshabilitada = fueraDeMes || finDeSemana || reservada || pasada;

          let bg = "transparent";
          let color = "var(--text)";
          let opacity: number | undefined;

          if (fueraDeMes) {
            color = "var(--border)";
          } else if (reservada) {
            bg = "rgba(229,62,62,0.18)";
            color = "#e53e3e";
          } else if (finDeSemana) {
            bg = "rgba(107,114,128,0.10)";
            color = "var(--text-muted)";
            opacity = 0.6;
          } else if (pasada) {
            color = "var(--text-muted)";
            opacity = 0.45;
          } else if (seleccionada) {
            bg = "var(--teal)";
            color = "#fff";
          }

          const bordeReservada = reservada ? "1px solid rgba(229,62,62,0.55)" : "1px solid transparent";

          return (
            <button
              key={`${iso}-${i}`}
              type="button"
              disabled={deshabilitada}
              onClick={() => onChange(iso)}
              title={
                reservada
                  ? "Fecha ya reservada"
                  : finDeSemana
                    ? "Fin de semana no disponible"
                    : pasada
                      ? "Fecha pasada no disponible"
                      : iso
              }
              className="h-8 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: bg,
                color,
                border: bordeReservada,
                opacity: opacity ?? 1,
                cursor: deshabilitada ? "not-allowed" : "pointer",
                fontWeight: seleccionada ? 700 : 500,
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: "var(--teal)" }} />
          Seleccionada
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded"
            style={{ background: "rgba(229,62,62,0.18)", border: "1px solid rgba(229,62,62,0.55)" }}
          />
          Reservada (no disponible)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: "rgba(107,114,128,0.25)" }} />
          Fin de semana
        </span>
      </div>
    </div>
  );
}
