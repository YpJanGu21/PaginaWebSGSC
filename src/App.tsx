import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { Rol } from "./context/AuthContext";
import { SolicitudesProvider } from "./context/SolicitudesContext";
import LoginPage from "./pages/LoginPage";
import RegistroPage from "./pages/RegistroPage";
import DashboardLayout from "./pages/DashboardLayout";
import InicioPage from "./pages/InicioPage";
import RecursosPage from "./pages/RecursosPage";
import RecursoDetallePage from "./pages/RecursoDetallePage";
import SolicitudesPage from "./pages/SolicitudesPage";
import SolicitudFormPage from "./pages/SolicitudFormPage";
import CuentaPage from "./pages/CuentaPage";
import RegistroUsuarioPage from "./pages/RegistroUsuarioPage";
import GestionSolicitudesPage from "./pages/GestionSolicitudesPage";

// recharts pesa ~400 kB: se carga solo al abrir Reportes
const ReportesPage = lazy(() => import("./pages/ReportesPage"));

function ProtectedRoute({ roles, children }: { roles: Rol[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.rol)) return <Navigate to="/dashboard/inicio" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard/inicio" replace /> : <LoginPage />;
}

function RegistroRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard/inicio" replace /> : <RegistroPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/registro" element={<RegistroRoute />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<InicioPage />} />
        <Route path="inicio" element={<InicioPage />} />

        {/* Ambos roles */}
        <Route path="recursos" element={<RecursosPage />} />
        <Route path="recursos/:id" element={<RecursoDetallePage />} />
        <Route path="solicitud" element={<SolicitudFormPage />} />

        {/* Solo usuario estándar */}
        <Route
          path="solicitudes"
          element={<ProtectedRoute roles={["usuario"]}><SolicitudesPage /></ProtectedRoute>}
        />
        <Route
          path="cuenta"
          element={<ProtectedRoute roles={["usuario"]}><CuentaPage /></ProtectedRoute>}
        />

        {/* Solo supervisor */}
        <Route
          path="gestion"
          element={<ProtectedRoute roles={["supervisor"]}><GestionSolicitudesPage /></ProtectedRoute>}
        />
        <Route
          path="reportes"
          element={
            <ProtectedRoute roles={["supervisor"]}>
              <Suspense
                fallback={
                  <div className="page flex items-center justify-center" style={{ minHeight: "320px" }}>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cargando reportes…</p>
                  </div>
                }
              >
                <ReportesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="registro-usuario"
          element={<ProtectedRoute roles={["supervisor"]}><RegistroUsuarioPage /></ProtectedRoute>}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SolicitudesProvider>
          <AppRoutes />
        </SolicitudesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
