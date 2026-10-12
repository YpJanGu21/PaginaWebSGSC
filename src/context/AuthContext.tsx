import { createContext, useContext, useState, useEffect } from "react";

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

interface AuthState {
  user: Usuario | null;
  usuarios: UsuarioCompleto[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  registerSupervisor: (
    nombres: string,
    apellidos: string,
    email: string,
    password: string,
    anexo?: string
  ) => { ok: boolean; error?: string };
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
  login: () => false,
  logout: () => {},
  registerSupervisor: () => ({ ok: false }),
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

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const usuarios = [...BASE_USERS, ...extraUsers];

  function login(email: string, password: string): boolean {
    const match = usuarios.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!match) return false;
    const { password: _pw, ...userData } = match;
    setUser(userData);
    return true;
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

  return (
    <AuthContext.Provider value={{ user, usuarios, login, logout, registerSupervisor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
