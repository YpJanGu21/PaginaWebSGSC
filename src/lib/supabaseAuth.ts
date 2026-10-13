import { obtenerConfigSupabase } from "./api";

const TIMEOUT_MS = 10000;

export interface UsuarioSupabase {
  id: string;
  email?: string;
  user_metadata?: { nombre?: string; departamento?: string };
}

export interface SesionSupabase {
  access_token: string;
  refresh_token?: string;
  user: UsuarioSupabase;
}

function traducirError(msg: string): string {
  const m = (msg || "").toLowerCase();
  if (!msg) return "No se pudo completar la operación.";
  if (m.includes("user already") || m.includes("already registered") || m.includes("already exists")) {
    return "Ya existe una cuenta con ese correo.";
  }
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Debes verificar tu correo antes de iniciar sesión.";
  if (m.includes("token has expired") || m.includes("invalid") && m.includes("token") || m.includes("otp")) {
    return "El código es incorrecto o expiró. Solicita uno nuevo.";
  }
  if (m.includes("request this after") || m.includes("rate limit") || m.includes("too many") || m.includes("over email rate limit")) {
    return "Se superó el límite de envíos. Espera unos minutos y reintenta.";
  }
  if (m.includes("password")) return "La contraseña no cumple los requisitos (mínimo 8 caracteres).";
  return msg;
}

async function pedir<T>(path: string, cuerpo: unknown): Promise<T> {
  const { base, clave } = await obtenerConfigSupabase();
  if (!base || !clave) {
    throw new Error("La autenticación no está configurada: completa supabaseUrl y supabaseAnonKey en config.json.");
  }
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const respuesta = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        apikey: clave,
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuerpo),
      signal: control.signal,
    });
    const texto = await respuesta.text();
    let json: unknown = null;
    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      // respuesta sin cuerpo JSON
    }
    if (!respuesta.ok) {
      const cuerpoError = json as { msg?: string; error_description?: string; message?: string } | null;
      const msg = cuerpoError?.msg ?? cuerpoError?.error_description ?? cuerpoError?.message ?? `Error ${respuesta.status}`;
      throw new Error(traducirError(String(msg)));
    }
    return json as T;
  } catch (e) {
    if (e instanceof TypeError || (e instanceof DOMException && e.name === "AbortError")) {
      throw new Error("Sin conexión con Supabase. Revisa tu internet e intenta de nuevo.");
    }
    throw e;
  } finally {
    clearTimeout(temporizador);
  }
}

export function registrarse(email: string, password: string, nombre: string, departamento: string): Promise<unknown> {
  return pedir("/auth/v1/signup", {
    email,
    password,
    data: { nombre, departamento },
  });
}

export function verificarCodigo(email: string, token: string): Promise<SesionSupabase> {
  return pedir<SesionSupabase>("/auth/v1/verify", { type: "signup", email, token });
}

export function reenviarCodigo(email: string): Promise<unknown> {
  return pedir("/auth/v1/resend", { type: "signup", email });
}

export function iniciarSesion(email: string, password: string): Promise<SesionSupabase> {
  return pedir<SesionSupabase>("/auth/v1/token?grant_type=password", { email, password });
}
