import { createContext, useContext, useState, useEffect } from "react";
import { registrarse, verificarCodigo, reenviarCodigo, iniciarSesion } from "../lib/supabaseAuth";

export type Rol = "usuario" | "supervisor";

export interface Usuario {
  nombre: string;
  email: string;
  rol: Rol;
  departamento: string;
  anexo?: string;
}

export interface UsuarioCompleto extends Usuario {
  password: string;
}

export const DOMINIOS_INSTITUCIONALES = ["@cetchile.cl", "@alumnos.cetchile.cl"];

export function esCorreoInstitucional(email: string): boolean {
  const limpio = email.trim().toLowerCase();
  return DOMINIOS_INSTITUCIONALES.some((d) => limpio.endsWith(d) && limpio.length > d.length);
}

function departamentoDeEmail(email: string): string {
  return email.trim().toLowerCase().endsWith("@alumnos.cetchile.cl") ? "Alumnos" : "CET Chile";
}

function usuarioDeSupabase(
  email: string,
  metadata: { nombre?: string; departamento?: string } | undefined,
  nombreFallback: string
): Usuario {
  return {
    nombre: metadata?.nombre?.trim() || nombreFallback,
    email,
    // El rol nunca se toma del cliente: los registros públicos siempre son "usuario"
    rol: "usuario",
    departamento: metadata?.departamento?.trim() || departamentoDeEmail(email),
  };
}

export interface ResultadoAuth {
  ok: boolean;
  error?: string;
  verificado?: boolean;
}

interface AuthState {
  user: Usuario | null;
  usuarios: UsuarioCompleto[];
  login: (email: string, password: string) => Promise<ResultadoAuth>;
  logout: () => void;
  registerSupervisor: (
    nombres: string,
    apellidos: string,
    email: string,
    password: string,
    anexo?: string
  ) => { ok: boolean; error?: string };
  registroPendiente: { email: string; nombre: string } | null;
  iniciarRegistro: (datos: {
    nombre: string;
    email: string;
    password: string;
    confirmar: string;
  }) => Promise<ResultadoAuth>;
  verificarRegistro: (codigo: string) => Promise<ResultadoAuth>;
  reenviarRegistro: () => Promise<ResultadoAuth>;
  cancelarRegistro: () => void;
}

const BASE_USERS: UsuarioCompleto[] = [
  {
    nombre: "Yojan Gutierrez",
    email: "yojan.gutierrez.ordaz@alumnos.cetchile.cl",
    password: "27751",
    rol: "usuario",
    departamento: "Alumnos",
  },
  {
    nombre: "Roderick Valenzuela",
    email: "rvalenzuela@cetchile.cl",
    password: "Admin.1234",
    rol: "supervisor",
    departamento: "Administración",
  },
];

const AuthContext = createContext<AuthState>({
  user: null,
  usuarios: BASE_USERS,
  login: async () => ({ ok: false }),
  logout: () => {},
  registerSupervisor: () => ({ ok: false }),
  registroPendiente: null,
  iniciarRegistro: async () => ({ ok: false }),
  verificarRegistro: async () => ({ ok: false }),
  reenviarRegistro: async () => ({ ok: false }),
  cancelarRegistro: () => {},
});

const SESSION_KEY = "cet_session";
const USERS_KEY = "cet_users";

function loadExtraUsers(): UsuarioCompleto[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveExtraUsers(users: UsuarioCompleto[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [extraUsers, setExtraUsers] = useState<UsuarioCompleto[]>(loadExtraUsers);
  const [registroPendiente, setRegistroPendiente] = useState<{ email: string; nombre: string } | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const usuarios = [...BASE_USERS, ...extraUsers];

  async function login(email: string, password: string): Promise<ResultadoAuth> {
    const cleanEmail = email.trim().toLowerCase();
    const local = usuarios.find((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (local) {
      if (local.password !== password) {
        return { ok: false, error: "Correo o contraseña incorrectos. Verifica tus credenciales." };
      }
      const { password: _pw, ...userData } = local;
      setUser(userData);
      return { ok: true };
    }

    try {
      const sesion = await iniciarSesion(cleanEmail, password);
      setUser(
        usuarioDeSupabase(
          sesion.user.email ?? cleanEmail,
          sesion.user.user_metadata,
          cleanEmail.split("@")[0] || "Usuario"
        )
      );
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Correo o contraseña incorrectos." };
    }
  }

  function logout() {
    setUser(null);
  }

  function registerSupervisor(
    nombres: string,
    apellidos: string,
    email: string,
    password: string,
    anexo?: string
  ): { ok: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!nombres.trim() || !apellidos.trim() || !cleanEmail || !password) {
      return { ok: false, error: "Completa los campos obligatorios." };
    }
    if (password.length < 8) {
      return { ok: false, error: "La contraseña debe tener mínimo 8 caracteres." };
    }
    if (usuarios.some((u) => u.email.trim().toLowerCase() === cleanEmail)) {
      return { ok: false, error: "Ya existe un usuario con ese correo." };
    }
    const nuevo: UsuarioCompleto = {
      nombre: `${nombres.trim()} ${apellidos.trim()}`,
      email: cleanEmail,
      password,
      rol: "supervisor",
      departamento: "Administración",
      anexo: anexo?.trim() || undefined,
    };
    const updated = [...extraUsers, nuevo];
    setExtraUsers(updated);
    saveExtraUsers(updated);
    return { ok: true };
  }

  async function iniciarRegistro(datos: {
    nombre: string;
    email: string;
    password: string;
    confirmar: string;
  }): Promise<ResultadoAuth> {
    const nombre = datos.nombre.trim();
    const email = datos.email.trim().toLowerCase();
    if (!nombre) return { ok: false, error: "Ingresa tu nombre completo." };
    if (!email) return { ok: false, error: "Ingresa tu correo institucional." };
    if (!esCorreoInstitucional(email)) {
      return { ok: false, error: "Solo se permiten correos institucionales (@cetchile.cl o @alumnos.cetchile.cl)." };
    }
    if (usuarios.some((u) => u.email.trim().toLowerCase() === email)) {
      return { ok: false, error: "Ya existe una cuenta con ese correo. Inicia sesión." };
    }
    if (datos.password.length < 8) {
      return { ok: false, error: "La contraseña debe tener mínimo 8 caracteres." };
    }
    if (datos.password !== datos.confirmar) {
      return { ok: false, error: "Las contraseñas no coinciden." };
    }

    try {
      const respuesta = (await registrarse(email, datos.password, nombre, departamentoDeEmail(email))) as {
        access_token?: string;
        user?: { email?: string; user_metadata?: { nombre?: string; departamento?: string } };
      };
      // Si la confirmación de correo está desactivada, Supabase devuelve la sesión directamente
      if (respuesta?.access_token && respuesta.user) {
        setUser(
          usuarioDeSupabase(respuesta.user.email ?? email, respuesta.user.user_metadata, nombre)
        );
        return { ok: true, verificado: true };
      }
      setRegistroPendiente({ email, nombre });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "No se pudo iniciar el registro." };
    }
  }

  async function verificarRegistro(codigo: string): Promise<ResultadoAuth> {
    if (!registroPendiente) {
      return { ok: false, error: "No hay un registro en proceso. Vuelve a intentarlo." };
    }
    const limpio = codigo.trim();
    if (!/^\d{6}$/.test(limpio)) {
      return { ok: false, error: "El código debe tener 6 dígitos." };
    }
    try {
      const sesion = await verificarCodigo(registroPendiente.email, limpio);
      setUser(
        usuarioDeSupabase(
          sesion.user.email ?? registroPendiente.email,
          sesion.user.user_metadata,
          registroPendiente.nombre
        )
      );
      setRegistroPendiente(null);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "El código es incorrecto o expiró." };
    }
  }

  async function reenviarRegistro(): Promise<ResultadoAuth> {
    if (!registroPendiente) {
      return { ok: false, error: "No hay un registro en proceso. Vuelve a intentarlo." };
    }
    try {
      await reenviarCodigo(registroPendiente.email);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "No se pudo reenviar el código." };
    }
  }

  function cancelarRegistro() {
    setRegistroPendiente(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        usuarios,
        login,
        logout,
        registerSupervisor,
        registroPendiente,
        iniciarRegistro,
        verificarRegistro,
        reenviarRegistro,
        cancelarRegistro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
