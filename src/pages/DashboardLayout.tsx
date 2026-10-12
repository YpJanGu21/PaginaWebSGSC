import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import cetChileLogo from "../imports/cetchileCla.png";
import cetChileLogoClaro from "../imports/cetchileCla-claro.png";
import type { Rol } from "../context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  roles: Rol[];
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    to: "/dashboard/inicio",
    label: "Inicio",
    roles: ["usuario", "supervisor"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: "/dashboard/recursos",
    label: "Recursos",
    roles: ["usuario", "supervisor"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    to: "/dashboard/solicitudes",
    label: "Mis Solicitudes",
    roles: ["usuario"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    to: "/dashboard/gestion",
    label: "Gestión",
    roles: ["supervisor"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    to: "/dashboard/reportes",
    label: "Reportes",
    roles: ["supervisor"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    to: "/dashboard/registro-usuario",
    label: "Registro Usuario",
    roles: ["supervisor"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
  },
  {
    to: "/dashboard/cuenta",
    label: "Cuenta",
    roles: ["usuario"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

const rolLabel: Record<Rol, { label: string; bg: string; color: string }> = {
  usuario:    { label: "Usuario",    bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
  supervisor: { label: "Supervisor", bg: "rgba(49,130,206,0.15)",  color: "#3182ce" },
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  if (!user) return <Navigate to="/" replace />;

  const visibleNav = navItems.filter((item) => item.roles.includes(user.rol));
  const rl = rolLabel[user.rol];

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="h-dvh flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Top header */}
      <header
        className="flex items-center justify-between gap-2 px-3 md:px-6 py-2.5 md:py-3 shrink-0 safe-top"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={() => setMenuAbierto(true)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
            aria-label="Abrir menú"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <img
            src={dark ? cetChileLogo : cetChileLogoClaro}
            alt="CET CHILE"
            className="h-7 md:h-9 w-auto object-contain shrink-0"
          />
          <span className="text-sm hidden sm:block" style={{ color: "var(--border)" }}>|</span>
          <span className="text-xs lg:text-sm hidden lg:block truncate" style={{ color: "var(--text-muted)" }}>
            Sistema de Gestión de Solicitudes Corporativas
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* User info */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-semibold leading-none" style={{ color: "var(--text)" }}>{user.nombre}</p>
              <span
                className="inline-flex mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ background: rl.bg, color: rl.color }}
              >
                {rl.label}
              </span>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--navy)", color: "#fff" }}
            >
              {user.nombre.charAt(0)}
            </div>
          </div>

          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
            aria-label="Cambiar tema"
          >
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
            aria-label="Cerrar sesión"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Overlay móvil */}
        {menuAbierto && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => setMenuAbierto(false)}
            aria-hidden
          />
        )}

        {/* Left sidebar nav */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-60 md:w-52 shrink-0 flex flex-col justify-between p-4 transition-transform duration-200 md:translate-x-0 safe-top safe-bottom ${
            menuAbierto ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3 md:hidden">
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>Menú</span>
            <button
              onClick={() => setMenuAbierto(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
              aria-label="Cerrar menú"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <nav className="space-y-1">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuAbierto(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "active-nav" : ""}`
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--navy)" : "transparent",
                  color: isActive ? "#fff" : "var(--text-muted)",
                })}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Bottom logo */}
          <div className="hidden md:flex items-center justify-center px-2 py-1">
            <img
              src={dark ? cetChileLogo : cetChileLogoClaro}
              alt="CET CHILE"
              className="h-10 w-auto object-contain"
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
