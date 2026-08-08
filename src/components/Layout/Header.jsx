import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Header() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [menuNotifAbierto, setMenuNotifAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargandoNotif, setCargandoNotif] = useState(false);
  const [toast, setToast] = useState(null);
  
  const notifRef = useRef(null);
  const perfilRef = useRef(null);
  const toastTimer = useRef(null);

  // Escuchar notificaciones en tiempo real por socket
  useEffect(() => {
    const handler = (event) => {
      const data = event.detail || {};
      console.log('Notificacion en tiempo real:', data);
      setToast({
        tipo: data.tipo || 'info',
        mensaje: data.mensaje || 'Tienes una nueva notificacion'
      });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 5000);
      cargarNotificaciones();
    };
    window.addEventListener('nueva-notificacion', handler);
    return () => {
      window.removeEventListener('nueva-notificacion', handler);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setMenuNotifAbierto(false);
      }
      if (perfilRef.current && !perfilRef.current.contains(event.target)) {
        setMenuPerfilAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para cargar notificaciones
  const cargarNotificaciones = async () => {
    try {
      setCargandoNotif(true);
      console.log('=== Cargando notificaciones ===');
      console.log('Usuario:', usuario);
      console.log('ID Usuario:', usuario?.id_usuario);
      
      const res = await api.get('/api/notificaciones');
      console.log('Respuesta del servidor:', res);
      console.log('Datos de notificaciones:', res.data);
      
      const lista = res.data || [];
      setNotificaciones(lista);
      
      // Calcular notificaciones no leídas
      const noLeidasCount = lista.filter(n => !n.leida).length;
      setNoLeidas(noLeidasCount);
      console.log(`Notificaciones cargadas: ${lista.length}, ${noLeidasCount} no leidas`);
      
      // Actualizar el badge en el título de la pestaña
      if (noLeidasCount > 0) {
        document.title = `(${noLeidasCount}) SIGAE UTVT`;
      } else {
        document.title = 'SIGAE UTVT';
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      console.error('Detalles del error:', err.response?.data);
      setNotificaciones([]);
      setNoLeidas(0);
    } finally {
      setCargandoNotif(false);
    }
  };

  // Cargar notificaciones al montar y cada 30 segundos
  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarNotificaciones();
      const intervalo = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(intervalo);
    }
  }, [usuario]);

  const marcarLeida = async (id) => {
    try {
      await api.put(`/api/notificaciones/${id}/leida`);
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
      setNoLeidas(prev => {
        const nuevo = Math.max(0, prev - 1);
        // Actualizar título
        if (nuevo > 0) {
          document.title = `(${nuevo}) SIGAE UTVT`;
        } else {
          document.title = 'SIGAE UTVT';
        }
        return nuevo;
      });
    } catch (err) {
      console.error('Error al marcar notificación:', err);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.put('/api/notificaciones/marcar-todas');
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
      document.title = 'SIGAE UTVT';
    } catch (err) {
      console.error('Error al marcar todas:', err);
    }
  };

  const abrirNotificacion = async (notif) => {
    if (!notif.leida) {
      await marcarLeida(notif.id);
    }
    setMenuNotifAbierto(false);
    if (notif.id_solicitud) {
      const tipo = notif.tipo || '';
      if (tipo === 'propuesta_horario' || tipo === 'aprobacion' || tipo === 'rechazo') {
        navigate('/director/reservas', { state: { idSolicitud: notif.id_solicitud } });
      } else {
        navigate('/responsable/reservas', { state: { idSolicitud: notif.id_solicitud } });
      }
    }
  };

  const getInitials = (nombre) => {
    if (!nombre) return 'U';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  };

  const formatearFecha = (fecha) => {
    try {
      if (!fecha) return 'Fecha no disponible';
      return new Date(fecha).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  };

  return (
    <header className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 px-4 sm:px-6 py-3 flex justify-between items-center relative z-20">
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] max-w-sm w-full rounded-xl shadow-xl border-l-4 p-4 flex items-start gap-3 animate-slideIn ${
          toast.tipo === 'rechazo' || toast.tipo === 'propuesta_rechazada'
            ? 'bg-red-50 border-red-500'
            : toast.tipo === 'aprobacion' || toast.tipo === 'propuesta_aceptada'
              ? 'bg-green-50 border-green-500'
              : toast.tipo === 'nueva_solicitud'
                ? 'bg-blue-50 border-blue-500'
                : toast.tipo === 'propuesta_horario'
                  ? 'bg-amber-50 border-amber-500'
                  : 'bg-gray-50 border-gray-400'
        }`}>
          <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            toast.tipo === 'rechazo' || toast.tipo === 'propuesta_rechazada' ? 'bg-red-100 text-red-600'
              : toast.tipo === 'aprobacion' || toast.tipo === 'propuesta_aceptada' ? 'bg-green-100 text-green-600'
              : toast.tipo === 'nueva_solicitud' ? 'bg-blue-100 text-blue-600'
              : toast.tipo === 'propuesta_horario' ? 'bg-amber-100 text-amber-600'
              : 'bg-gray-200 text-gray-600'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Nueva notificacion</p>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{toast.mensaje}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="hidden lg:flex items-center gap-4">
        <div className="relative group">
          <img 
            src="/cuervo.jpg" 
            alt="Logo UTVT" 
            className="h-12 w-auto transition-all duration-300 group-hover:scale-105 drop-shadow-sm" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#701330] tracking-tight">SIGAE</h1>
          <p className="text-sm text-gray-500 -mt-1 hidden md:block">Sistema Integral de Gestión de Espacios</p>
        </div>
      </div>

      <div className="lg:hidden flex items-center">
        <h1 className="text-lg font-bold text-[#701330]">SIGAE</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setMenuNotifAbierto(!menuNotifAbierto)}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group"
            title="Notificaciones"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-[#701330] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {noLeidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 px-1 flex items-center justify-center rounded-full animate-pulse">
                {noLeidas > 99 ? '99+' : noLeidas}
              </span>
            )}
          </button>

          {menuNotifAbierto && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[90vw] bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden transform origin-top-right animate-scaleIn">
              <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  Notificaciones
                  {noLeidas > 0 && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {noLeidas} nuevas
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {noLeidas > 0 && (
                    <button
                      onClick={marcarTodasLeidas}
                      className="text-xs text-[#701330] hover:underline font-medium"
                    >
                      Marcar todas
                    </button>
                  )}
                  <button
                    onClick={cargarNotificaciones}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    title="Recargar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-gray-50">
                {cargandoNotif ? (
                  <div className="p-6 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-[#701330] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 mt-2">Cargando...</p>
                  </div>
                ) : notificaciones.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className="text-gray-500 text-sm">No tienes notificaciones</p>
                    <p className="text-xs text-gray-400 mt-1">Las novedades aparecerán aquí</p>
                  </div>
                ) : (
                  notificaciones.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => abrirNotificacion(notif)}
                      className={`p-3 cursor-pointer transition-all hover:bg-gray-50 ${
                        !notif.leida ? 'bg-[#701330]/5 border-l-4 border-[#701330]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {notif.emisor_foto ? (
                            <img src={notif.emisor_foto} alt={notif.emisor_nombre || 'Usuario'} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#701330]/10 flex items-center justify-center text-[#701330] font-bold text-xs">
                              {getInitials(notif.emisor_nombre || 'U')}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {notif.emisor_nombre && (
                            <p className="text-xs font-semibold text-gray-800">{notif.emisor_nombre}</p>
                          )}
                          <p className={`text-sm ${!notif.leida ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                            {notif.mensaje || notif.titulo || 'Sin mensaje'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatearFecha(notif.fecha_creacion || notif.fecha)}
                          </p>
                          {notif.tipo && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              notif.tipo === 'solicitud' || notif.tipo === 'nueva_solicitud' ? 'bg-blue-100 text-blue-700' :
                              notif.tipo === 'aprobacion' || notif.tipo === 'propuesta_aceptada' ? 'bg-green-100 text-green-700' :
                              notif.tipo === 'rechazo' || notif.tipo === 'propuesta_rechazada' ? 'bg-red-100 text-red-700' :
                              notif.tipo === 'propuesta_horario' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {notif.tipo === 'solicitud' || notif.tipo === 'nueva_solicitud' ? 'Solicitud' :
                               notif.tipo === 'aprobacion' || notif.tipo === 'propuesta_aceptada' ? 'Aprobación' :
                               notif.tipo === 'rechazo' || notif.tipo === 'propuesta_rechazada' ? 'Rechazo' :
                               notif.tipo === 'propuesta_horario' ? 'Propuesta de horario' : 'Info'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="relative" ref={perfilRef}>
          <div 
            onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group transition-all duration-300 hover:bg-gray-50 px-2 sm:px-3 py-1.5 rounded-full"
          >
            <div className="relative">
              {usuario?.foto || usuario?.foto_perfil ? (
                <img
                  src={usuario.foto || usuario.foto_perfil}
                  alt={usuario.nombre}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#701330] object-cover transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#701330] flex items-center justify-center text-white font-bold text-xs sm:text-sm border-2 border-[#701330] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md">
                  {getInitials(usuario?.nombre)}
                </div>
              )}
              {usuario?.rol === 'superadmin' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center text-[6px] sm:text-[8px] font-bold text-amber-900 animate-pulse">★</span>
              )}
            </div>
            <div className="hidden sm:block text-right">
              <p className="font-medium text-gray-800 text-xs sm:text-sm">{usuario?.nombre || 'Usuario'}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">
                {usuario?.rol === 'superadmin' ? 'Super Admin' : 
                 usuario?.rol === 'director' ? 'Director' : 'Usuario'}
              </p>
            </div>
            <svg 
              className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-300 ${menuPerfilAbierto ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {menuPerfilAbierto && (
            <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden transform origin-top-right animate-scaleIn">
              <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  {usuario?.foto || usuario?.foto_perfil ? (
                    <img
                      src={usuario.foto || usuario.foto_perfil}
                      alt={usuario.nombre}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#701330] flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {getInitials(usuario?.nombre)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-800">{usuario?.nombre}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[140px]">{usuario?.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <NavLink 
                  to="/perfil" 
                  onClick={() => setMenuPerfilAbierto(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Mi Perfil
                </NavLink>
                <button
                  onClick={() => {
                    setMenuPerfilAbierto(false);
                    cerrarSesion();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.25s ease-out forwards;
        }
      `}</style>
    </header>
  );
}