import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let DatabaseSync;
try {
  ({ DatabaseSync } = await import("node:sqlite"));
} catch {
  console.error(
    `No se pudo cargar "node:sqlite". Requiere Node.js 22.13 o superior (actual: ${process.version}).`
  );
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const API_PORT = Number(process.env.API_PORT || process.env.PORT || 3001);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "sgsc.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS solicitudes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    recurso TEXT NOT NULL,
    recurso_id TEXT NOT NULL DEFAULT '',
    solicitante TEXT NOT NULL,
    departamento TEXT NOT NULL DEFAULT '',
    responsable TEXT NOT NULL DEFAULT '',
    fecha_solicitud TEXT NOT NULL,
    fecha_reserva TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    inicio TEXT NOT NULL,
    termino TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    observacion_cierre TEXT,
    adicionales TEXT NOT NULL DEFAULT '{}'
  );
`);

const ESTADOS = [
  "Pendiente",
  "En Espera",
  "En Revisión",
  "Aprobada",
  "Aprobado",
  "Rechazada",
  "Declinado",
  "Cancelada",
  "Cerrada",
];

const HORA_MIN = "08:00";
const HORA_MAX = "17:00";

function toRow(s) {
  return {
    codigo: s.codigo,
    id: s.id,
    recurso: s.recurso,
    recursoId: s.recurso_id,
    solicitante: s.solicitante,
    departamento: s.departamento,
    responsable: s.responsable,
    fechaSolicitud: s.fecha_solicitud,
    fechaReserva: s.fecha_reserva,
    inicio: s.inicio,
    termino: s.termino,
    horaInicio: s.hora_inicio,
    horaFin: s.hora_fin,
    descripcion: s.descripcion,
    estado: s.estado,
    observacionCierre: s.observacion_cierre ?? undefined,
    adicionales: safeParse(s.adicionales),
  };
}

function safeParse(json) {
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {};
  }
}

function esFinDeSemana(fecha) {
  const d = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(d.getTime())) return true;
  const dia = d.getDay();
  return dia === 0 || dia === 6;
}

function validarReserva({ fechaReserva, horaInicio, horaFin }) {
  if (!fechaReserva || !/^\d{4}-\d{2}-\d{2}$/.test(fechaReserva)) {
    return "Fecha de reserva inválida.";
  }
  if (esFinDeSemana(fechaReserva)) {
    return "La fecha reservada debe ser de lunes a viernes.";
  }
  if (!horaInicio || !horaFin || !/^\d{2}:\d{2}$/.test(horaInicio) || !/^\d{2}:\d{2}$/.test(horaFin)) {
    return "Horas inválidas.";
  }
  if (horaInicio < HORA_MIN || horaInicio > HORA_MAX || horaFin < HORA_MIN || horaFin > HORA_MAX) {
    return "El horario debe estar entre 08:00 y 17:00.";
  }
  if (horaInicio >= horaFin) {
    return "La hora de inicio debe ser anterior a la hora de término.";
  }
  return null;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/salud", (_req, res) => {
  res.json({ ok: true, servicio: "sgsc-api", baseDatos: "sqlite" });
});

app.get("/api/solicitudes", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM solicitudes ORDER BY id DESC")
    .all()
    .map(toRow);
  res.json(rows);
});

app.post("/api/solicitudes", (req, res) => {
  const b = req.body ?? {};
  const recurso = String(b.recurso ?? "").trim();
  const solicitante = String(b.solicitante ?? "").trim();

  if (!recurso || !solicitante) {
    return res.status(400).json({ error: "Faltan datos obligatorios (recurso, solicitante)." });
  }

  const fechaReserva = String(b.fechaReserva ?? "").trim();
  const horaInicio = String(b.horaInicio ?? "").trim();
  const horaFin = String(b.horaFin ?? "").trim();
  const errorValidacion = validarReserva({ fechaReserva, horaInicio, horaFin });
  if (errorValidacion) {
    return res.status(400).json({ error: errorValidacion });
  }

  const ahora = new Date();
  const fechaSolicitud = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(
    ahora.getDate()
  ).padStart(2, "0")}`;

  const insert = db.prepare(`
    INSERT INTO solicitudes (
      codigo, recurso, recurso_id, solicitante, departamento, responsable,
      fecha_solicitud, fecha_reserva, hora_inicio, hora_fin, inicio, termino,
      descripcion, estado, adicionales
    ) VALUES (
      '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?
    )
  `);

  const result = insert.run(
    recurso,
    String(b.recursoId ?? "").trim(),
    solicitante,
    String(b.departamento ?? "").trim(),
    String(b.responsable ?? solicitante).trim() || solicitante,
    fechaSolicitud,
    fechaReserva,
    horaInicio,
    horaFin,
    b.inicio ? String(b.inicio) : `${fechaReserva} ${horaInicio}`,
    b.termino ? String(b.termino) : `${fechaReserva} ${horaFin}`,
    String(b.descripcion ?? "").trim(),
    JSON.stringify(b.adicionales ?? {})
  );

  const id = Number(result.lastInsertRowid);
  const codigo = `SOL-${String(id).padStart(3, "0")}`;
  db.prepare("UPDATE solicitudes SET codigo = ? WHERE id = ?").run(codigo, id);

  const row = db.prepare("SELECT * FROM solicitudes WHERE id = ?").get(id);
  res.status(201).json(toRow(row));
});

app.patch("/api/solicitudes/:id", (req, res) => {
  const idParam = String(req.params.id);
  const row = db
    .prepare("SELECT * FROM solicitudes WHERE codigo = ? OR id = ?")
    .get(idParam, Number(idParam) || -1);

  if (!row) {
    return res.status(404).json({ error: "Solicitud no encontrada." });
  }

  const { estado, observacionCierre } = req.body ?? {};
  if (estado !== undefined) {
    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({ error: `Estado no válido: ${estado}` });
    }
    db.prepare("UPDATE solicitudes SET estado = ? WHERE id = ?").run(estado, row.id);
  }
  if (observacionCierre !== undefined) {
    db.prepare("UPDATE solicitudes SET observacion_cierre = ? WHERE id = ?").run(
      String(observacionCierre ?? "").trim(),
      row.id
    );
  }

  const actualizada = db.prepare("SELECT * FROM solicitudes WHERE id = ?").get(row.id);
  res.json(toRow(actualizada));
});

const distDir = path.join(ROOT, "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(API_PORT, "0.0.0.0", () => {
  console.log(`API SGSC escuchando en http://localhost:${API_PORT}`);
  console.log(`Base de datos SQLite: ${path.join(DATA_DIR, "sgsc.db")}`);
});
