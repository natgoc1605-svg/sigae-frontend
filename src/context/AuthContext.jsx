import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import socket from '../api/socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setCargando(false);
          return;
        }

        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user && (user.id_usuario || user.id)) {
              const userConId = {
                ...user,
                id_usuario: user.id_usuario || user.id,
                id: user.id || user.id_usuario
              };
              setUsuario(userConId);
              setCargando(false);
              await verificarToken(token);
              return;
            }
          } catch (e) {
            console.error('Error al parsear usuario:', e);
            localStorage.removeItem('user');
          }
        }

        await obtenerUsuarioDesdeToken(token);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUsuario(null);
        setError(error.message);
        setCargando(false);
      }
    };

    cargarUsuario();
  }, []);

  const verificarToken = async (token) => {
    try {
      await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('Token inválido:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUsuario(null);
      setError('Sesión expirada');
      return false;
    }
  };

  const obtenerUsuarioDesdeToken = async (token) => {
    try {
      const res = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data) {
        let user = res.data;
        
        if (typeof user === 'object' && user !== null) {
          if (user.id_usuario === undefined || user.id_usuario === null) {
            if (user.id !== undefined && user.id !== null) {
              user.id_usuario = user.id;
            } else if (user.idUser !== undefined && user.idUser !== null) {
              user.id_usuario = user.idUser;
            } else {
              throw new Error('Usuario sin ID');
            }
          }
          
          if (user.id === undefined || user.id === null) {
            user.id = user.id_usuario;
          }
          
          localStorage.setItem('user', JSON.stringify(user));
          setUsuario(user);
          setError(null);
        } else {
          throw new Error('No se recibieron datos del usuario');
        }
      } else {
        throw new Error('No se recibieron datos del usuario');
      }
    } catch (error) {
      console.error('Error obteniendo usuario desde token:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUsuario(null);
      setError(error.message || 'Error al obtener usuario');
      throw error;
    } finally {
      setCargando(false);
    }
  };

  const iniciarSesion = async (email, password) => {
    try {
      setError(null);
      const res = await api.post('/api/auth/login', { email, password });
      
      if (!res.data) {
        return { 
          success: false, 
          error: 'Error en la respuesta del servidor' 
        };
      }
      
      const token = res.data.token || res.data.access_token;
      let user = res.data.user || res.data.usuario;
      
      if (!token) {
        return { 
          success: false, 
          error: 'No se recibió token de autenticación' 
        };
      }
      
      if (!user) {
        return { 
          success: false, 
          error: 'No se recibieron datos del usuario' 
        };
      }
      
      if (user.id_usuario === undefined || user.id_usuario === null) {
        if (user.id !== undefined && user.id !== null) {
          user.id_usuario = user.id;
        } else if (user.idUser !== undefined && user.idUser !== null) {
          user.id_usuario = user.idUser;
        } else {
          return { 
            success: false, 
            error: 'Error en la autenticación: usuario sin ID' 
          };
        }
      }
      
      if (user.id === undefined || user.id === null) {
        user.id = user.id_usuario;
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUsuario(user);
      setError(null);
      
      if (socket && socket.disconnected) {
        socket.connect();
      }
      
      return { success: true, user };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      let mensajeError = 'Error al iniciar sesión';
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.mensaje) {
        mensajeError = error.mensaje;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      setError(mensajeError);
      return { 
        success: false, 
        error: mensajeError 
      };
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUsuario(null);
    setError(null);
    if (socket && socket.connected) {
      socket.disconnect();
    }
  };

  const actualizarUsuario = (cambios) => {
    setUsuario(prev => {
      const actualizado = { ...prev, ...cambios };
      localStorage.setItem('user', JSON.stringify(actualizado));
      return actualizado;
    });
  };

  const tieneRol = (rolesPermitidos) => {
    if (!usuario || !usuario.rol) return false;
    return rolesPermitidos.includes(usuario.rol);
  };

  const esSuperAdmin = () => usuario?.rol === 'superadmin';
  const esDirector = () => usuario?.rol === 'director';
  const esDocente = () => usuario?.rol === 'docente';
  const esConsulta = () => usuario?.rol === 'consulta';

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      cargando, 
      error,
      iniciarSesion, 
      cerrarSesion,
      actualizarUsuario,
      verificarToken,
      tieneRol, 
      esSuperAdmin,
      esDirector,
      esDocente,
      esConsulta,
      isAuthenticated: !!usuario
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};