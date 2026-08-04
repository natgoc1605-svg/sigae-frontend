// components/RutaProtegida.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import Toast from './Notificaciones/Toast';

export default function RutaProtegida({ children, redirectTo = '/login' }) {
  const { usuario, cargando } = useAuth();

  // Mientras revisa la sesión, mostrar carga
  if (cargando) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si NO hay usuario, redirigir al login
  if (!usuario) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si hay children (modo wrapper), mostrar con layout
  if (children) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {children}
          </main>
        </div>
        <Toast />
      </div>
    );
  }

  // Si no hay children (modo Outlet), mostrar layout con Outlet
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}

// Componente para rutas con roles específicos
export function RutaPorRol({ children, rolesPermitidos, redirectTo = '/dashboard' }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!rolesPermitidos.includes(usuario.rol)) {
    console.warn(`Usuario con rol ${usuario.rol} intentó acceder a ruta que requiere ${rolesPermitidos.join(', ')}`);
    return <Navigate to={redirectTo} replace />;
  }

  // Si tiene permiso, mostrar con layout
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
}