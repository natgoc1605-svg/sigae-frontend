import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserId, isDirector, isSuperAdmin } from '../utils/auth';
import api from '../api/axios';
import RevisarSolicitud from '../components/Modals/RevisarSolicitud';

export default function ResponsableReservas() {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [buscandoSolicitud, setBuscandoSolicitud] = useState(false);

  const idUsuario = getUserId(usuario);

  const idSolicitudPendiente = location.state?.idSolicitud || null;
  const idSolicitudProcesado = useRef(null);

  useEffect(() => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    if (!idUsuario) {
      setCargando(false);
      return;
    }
    cargarSolicitudes();
  }, [usuario]);

  useEffect(() => {
    if (!idSolicitudPendiente) return;
    if (idSolicitudProcesado.current === idSolicitudPendiente) return;
    const encontrada = solicitudes.find(s => s.id_solicitud === idSolicitudPendiente);
    if (encontrada) {
      idSolicitudProcesado.current = idSolicitudPendiente;
      setSolicitudSeleccionada(encontrada);
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    if (!cargando && solicitudes.length > 0) {
      setBuscandoSolicitud(true);
      api.get(`/api/solicitudes-espacio/${idSolicitudPendiente}`)
        .then(res => {
          idSolicitudProcesado.current = idSolicitudPendiente;
          setSolicitudSeleccionada(res.data || null);
          navigate(location.pathname, { replace: true, state: null });
        })
        .catch(err => {
          console.error('Error al cargar solicitud desde notificación:', err);
          mostrarAlerta('error', 'La solicitud ya no está disponible o no tienes permisos para verla');
        })
        .finally(() => setBuscandoSolicitud(false));
    }
  }, [idSolicitudPendiente, solicitudes, cargando]);

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      const res = await api.get('/api/solicitudes-espacio/pendientes');
      setSolicitudes(res.data || []);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      let mensajeError = 'Error al cargar solicitudes';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          mensajeError = err.response.data.detail;
        } else if (err.response.data.detail.mensaje) {
          mensajeError = err.response.data.detail.mensaje;
        }
      }
      mostrarAlerta('error', mensajeError);
    } finally {
      setCargando(false);
    }
  };

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ mostrar: true, tipo, mensaje });
    setTimeout(() => setAlerta({ mostrar: false, tipo: '', mensaje: '' }), 5000);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  const obtenerDiaEnEspanol = (fecha, diaBackend) => {
    const mapeoInglesEspanol = {
      'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles',
      'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado',
      'Sunday': 'Domingo', 'Mon': 'Lunes', 'Tue': 'Martes', 'Wed': 'Miércoles',
      'Thu': 'Jueves', 'Fri': 'Viernes', 'Sat': 'Sábado', 'Sun': 'Domingo'
    };

    if (diaBackend) {
      const diasEspanol = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      if (diasEspanol.includes(diaBackend)) return diaBackend;
      const diaConvertido = mapeoInglesEspanol[diaBackend];
      if (diaConvertido) return diaConvertido;
    }

    if (fecha) {
      try {
        const fechaObj = new Date(fecha);
        if (!isNaN(fechaObj.getTime())) {
          return fechaObj.toLocaleDateString('es-MX', { weekday: 'long' });
        }
      } catch {}
    }
    return 'No especificado';
  };

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8 max-w-md w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">No has iniciado sesión</h2>
              <p className="text-sm text-gray-600 mt-0.5">Por favor, inicia sesión para continuar</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin(usuario) && !isDirector(usuario)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Acceso Restringido</h2>
              <p className="text-sm text-gray-600 mt-0.5">No tienes permisos para acceder</p>
            </div>
          </div>
          <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
            Tu rol actual es: <strong className="text-red-800">{usuario.rol}</strong>
          </p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Alerta flotante */}
        {alerta.mostrar && (
          <div className={`fixed top-4 right-4 z-[100] max-w-md w-full rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-fadeIn ${
            alerta.tipo === 'exito' ? 'bg-green-50 border-2 border-green-200 text-green-800' :
            alerta.tipo === 'error' ? 'bg-red-50 border-2 border-red-200 text-red-800' :
            'bg-blue-50 border-2 border-blue-200 text-blue-800'
          }`}>
            <div className={`p-1.5 rounded-full flex-shrink-0 ${
              alerta.tipo === 'exito' ? 'bg-green-200' : 
              alerta.tipo === 'error' ? 'bg-red-200' : 'bg-blue-200'
            }`}>
              {alerta.tipo === 'exito' ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : alerta.tipo === 'error' ? (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium flex-1 whitespace-pre-line">{alerta.mensaje}</span>
            <button 
              onClick={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#701330]/10 rounded-xl">
                <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Solicitudes de Reserva
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {isSuperAdmin(usuario) 
                    ? 'Como Super Administrador, puedes gestionar todas las solicitudes' 
                    : 'Como responsable del edificio, puedes aprobar o rechazar solicitudes'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Pendientes:</span>
            <span className="px-3.5 py-1.5 bg-amber-100 text-amber-800 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm">
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {solicitudes.length}
            </span>
            <button
              onClick={cargarSolicitudes}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300 hover:rotate-180 hover:shadow-md"
              title="Actualizar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Lista de solicitudes */}
        {solicitudes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay solicitudes pendientes</h3>
            <p className="text-gray-500">Todas las solicitudes han sido procesadas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudes.map(sol => {
              const diaSemana = obtenerDiaEnEspanol(sol.fecha_solicitud, sol.dia_semana);
              let horaInicio = sol.hora_inicio_str;
              let horaFin = sol.hora_fin_str;
              if (!horaInicio || !horaFin) {
                const turnoLower = (sol.turno || '').toLowerCase();
                if (turnoLower === 'matutino') {
                  horaInicio = '07:00';
                  horaFin = '15:10';
                } else if (turnoLower === 'vespertino') {
                  horaInicio = '15:20';
                  horaFin = '21:10';
                } else {
                  horaInicio = '07:00';
                  horaFin = '15:10';
                }
              }
              const tieneHorario = horaInicio && horaFin;

              return (
                <div 
                  key={sol.id_solicitud} 
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Encabezado */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="p-2 bg-[#701330]/10 rounded-xl flex-shrink-0">
                          <svg className="w-5 h-5 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5m1 0V9m8 0v7m-1 0v-3m-1 0v3" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                            {sol.aula_nombre || 'Aula sin nombre'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                              {sol.edificio_nombre || 'Sin edificio'}
                            </span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs font-mono font-semibold text-[#701330] bg-[#701330]/5 px-2 py-0.5 rounded-full">
                              {sol.codigo_solicitud || 'REQ-000'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Horario */}
                      <div className={`mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border ${
                        tieneHorario ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <svg className={`w-4 h-4 ${tieneHorario ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`text-xs font-medium ${tieneHorario ? 'text-blue-700' : 'text-gray-400'}`}>
                          {tieneHorario 
                            ? `${diaSemana} • ${horaInicio} - ${horaFin} hrs` 
                            : `${diaSemana} • Horario no especificado`}
                        </span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-500">Turno: {sol.turno || 'N/E'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        sol.estado === 'Pendiente' ? (
                          sol.solicitante_rol === 'superadmin'
                            ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]'
                            : 'bg-[#CBD5E1] text-[#1F2937] border-[#64748B]'
                        ) :
                        sol.estado === 'Aprobada' ? 'bg-green-100 text-green-800 border-green-200' :
                        sol.estado === 'Rechazada' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {sol.estado || 'Pendiente'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {sol.fecha_envio ? new Date(sol.fecha_envio).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Fecha no disponible'}
                      </span>
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Solicitante
                      </span>
                      <p className="font-medium text-gray-800 truncate">{sol.solicitante_nombre || 'No especificado'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Fecha
                      </span>
                      <p className="font-medium text-gray-800">{formatearFecha(sol.fecha_solicitud)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Día
                      </span>
                      <p className="font-medium text-gray-800 capitalize">{diaSemana}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Horario
                      </span>
                      <p className={`font-medium ${tieneHorario ? 'text-blue-700' : 'text-gray-400'}`}>
                        {tieneHorario ? `${horaInicio} - ${horaFin} hrs` : 'No especificado'}
                      </p>
                    </div>
                  </div>

                  {/* Motivo */}
                  {sol.motivo && (
                    <div className="mb-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-sm hover:bg-gray-100/50 transition-colors duration-200">
                      <span className="font-medium text-gray-700 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Motivo:
                      </span>
                      <p className="text-gray-600 mt-1 leading-relaxed">{sol.motivo}</p>
                    </div>
                  )}

                  {/* Observaciones del admin */}
                  {sol.observaciones_admin && (
                    <div className="mb-4 p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-sm">
                      <span className="font-medium text-blue-700 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Observaciones:
                      </span>
                      <p className="text-blue-800 mt-1 leading-relaxed">{sol.observaciones_admin}</p>
                    </div>
                  )}

                  {/* Acciones */}
                  {sol.estado === 'Pendiente' ? (
                    <div className="flex flex-wrap gap-3 mt-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setSolicitudSeleccionada(sol)}
                        className="flex-1 min-w-[120px] px-5 py-2.5 text-sm font-semibold bg-[#701330] hover:bg-[#912347] text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Revisar
                      </button>
                      <button
                        onClick={() => {
                          // Acción rápida de rechazo podría ir aquí
                          setSolicitudSeleccionada(sol);
                        }}
                        className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Rechazar
                      </button>
                    </div>
                  ) : (
                    <div className={`mt-2 text-sm font-medium flex items-center gap-1.5 ${
                      sol.estado === 'Aprobada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sol.estado === 'Aprobada' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {sol.estado === 'Aprobada' ? 'Solicitud Aprobada' : 'Solicitud Rechazada'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Revisar Solicitud */}
        {solicitudSeleccionada && (
          <RevisarSolicitud
            solicitud={solicitudSeleccionada}
            cerrar={() => {
              setSolicitudSeleccionada(null);
              cargarSolicitudes();
            }}
            onActualizada={cargarSolicitudes}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}