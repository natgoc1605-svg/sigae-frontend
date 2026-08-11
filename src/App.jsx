// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TemaProvider } from './context/TemaContext';
import RutaProtegida, { RutaPorRol } from './components/RutaProtegida';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Solicitudes from './pages/Solicitudes';
import Perfil from './pages/Perfil';
import Edificios from './pages/Edificios';
import Aulas from './pages/Aulas';
import Infraestructura from './pages/Infraestructura';
import Horarios from './pages/Horarios';
import HorarioAula from './components/HorarioAula';
import DirectorReservas from './pages/DirectorReservas';
import ResponsableReservas from './pages/ResponsableReservas';
import Reportes from './pages/Reportes';
import Historial from './pages/Historial';
import Configuracion from './pages/Configuracion';
import Usuarios from './pages/Usuarios';
import Carreras from './pages/Carreras';
import { ROLES } from './utils/auth';

// Componente wrapper para rutas que necesitan layout
function LayoutWrapper({ children }) {
  return <RutaProtegida>{children}</RutaProtegida>;
}

function App() {
  return (
    <AuthProvider>
      <TemaProvider>
        <Router>
        <Routes>
          {/* Ruta pública - Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas con layout completo */}
          <Route 
            path="/" 
            element={
              <RutaProtegida>
                <Dashboard />
              </RutaProtegida>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <RutaProtegida>
                <Dashboard />
              </RutaProtegida>
            } 
          />
          
          <Route 
            path="/perfil" 
            element={
              <RutaProtegida>
                <Perfil />
              </RutaProtegida>
            } 
          />
          
          <Route 
            path="/infraestructura" 
            element={
              <RutaProtegida>
                <Infraestructura />
              </RutaProtegida>
            } 
          />
          
          <Route 
            path="/horario-aula/:id" 
            element={
              <RutaProtegida>
                <HorarioAula />
              </RutaProtegida>
            } 
          />

          {/* Rutas con restricción de roles */}
          <Route 
            path="/edificios" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN, ROLES.DIRECTOR]}>
                <Edificios />
              </RutaPorRol>
            } 
          />
          
          <Route 
            path="/aulas" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN, ROLES.DIRECTOR]}>
                <Aulas />
              </RutaPorRol>
            } 
          />
          
          <Route 
            path="/horarios" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN, ROLES.DIRECTOR]}>
                <Horarios />
              </RutaPorRol>
            } 
          />

          <Route 
            path="/solicitudes" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN]}>
                <Solicitudes />
              </RutaPorRol>
            } 
          />

          <Route 
            path="/director/reservas" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN, ROLES.DIRECTOR]}>
                <DirectorReservas />
              </RutaPorRol>
            } 
          />

          <Route 
            path="/responsable/reservas" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN, ROLES.DIRECTOR]}>
                <ResponsableReservas />
              </RutaPorRol>
            } 
          />

          <Route 
            path="/reportes" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN, ROLES.DIRECTOR]}>
                <Reportes />
              </RutaPorRol>
            } 
          />

          <Route 
            path="/historial" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN, ROLES.DIRECTOR]}>
                <Historial />
              </RutaPorRol>
            } 
          />

          <Route 
            path="/configuracion" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN]}>
                <Configuracion />
              </RutaPorRol>
            } 
          />

          <Route 
            path="/usuarios" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN]}>
                <Usuarios />
              </RutaPorRol>
            } 
          />

          <Route 
            path="/carreras" 
            element={
              <RutaPorRol rolesPermitidos={[ROLES.SUPER_ADMIN]}>
                <Carreras />
              </RutaPorRol>
            } 
          />

          {/* Ruta para acceso denegado (opcional) */}
          <Route path="/acceso-denegado" element={
            <RutaProtegida>
              <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
                <p className="mt-2 text-gray-600">No tienes permisos para acceder a esta página.</p>
              </div>
            </RutaProtegida>
          } />

          {/* Redirección para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Router>
      </TemaProvider>
    </AuthProvider>
  );
}

export default App;