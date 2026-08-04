// api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
  withCredentials: false
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({ mensaje: 'No se pudo conectar con el servidor' });
    }
    
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('socket_session_id');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return Promise.reject({ 
        mensaje: error.response.data?.detail || 'Sesion expirada o credenciales incorrectas' 
      });
    }
    
    if (error.response.status === 403) {
      return Promise.reject({ 
        mensaje: error.response.data?.detail || 'No tienes permisos para realizar esta accion' 
      });
    }
    
    if (error.response.status === 400) {
      return Promise.reject({ 
        mensaje: error.response.data?.detail || 'Datos enviados no validos' 
      });
    }
    
    if (error.response.status === 404) {
      return Promise.reject({ 
        mensaje: 'Recurso o ruta no encontrada' 
      });
    }
    
    if (error.response.status === 500) {
      return Promise.reject({ 
        mensaje: 'Error interno del servidor. Por favor, intente mas tarde.' 
      });
    }
    
    return Promise.reject({ 
      mensaje: error.response.data?.detail || 'Error en el servidor' 
    });
  }
);

export default api;