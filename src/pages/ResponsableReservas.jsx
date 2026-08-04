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
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg max-w-md">
          <p className="text-yellow-700">No has iniciado sesión. Por favor, inicia sesión para continuar.</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin(usuario) && !isDirector(usuario)) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg max-w-md">
          <p className="text-red-700">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#701330] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {alerta.mostrar && (
        <div className={`fixed top-6 right-6 z-[100] max-w-md w-full rounded-xl shadow-lg p-4 ${
          alerta.tipo === 'exito' ? 'bg-green-50 border-l-4 border-green-600 text-green-900' :
          alerta.tipo === 'error' ? 'bg-red-50 border-l-4 border-red-600 text-red-900' :
          'bg-blue-50 border-l-4 border-blue-600 text-blue-900'
        }`}>
          <div className="flex items-start gap-3">
            {alerta.tipo === 'exito' && (
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {alerta.tipo === 'error' && (
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium whitespace-pre-line">{alerta.mensaje}</p>
            </div>
            <button 
              onClick={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#701330] flex items-center gap-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Solicitudes de Reserva
        </h1>
        <p className="text-gray-500 mt-1">
          {isSuperAdmin(usuario) 
            ? 'Como Super Administrador, puedes gestionar todas las solicitudes' 
            : 'Como responsable del edificio, puedes aprobar o rechazar solicitudes'}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-600">Total pendientes:</span>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {solicitudes.length}
          </span>
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay solicitudes pendientes</h3>
          <p className="text-gray-500">Todas las solicitudes han sido procesadas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map(sol => {
            const diaSemana = obtenerDiaEnEspanol(sol.fecha_solicitud, sol.dia_semana);
            // Usar los campos del backend, si no vienen usar fallback por turno
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
              <div key={sol.id_solicitud} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                {/* ... el resto del renderizado igual que antes, usando diaSemana, horaInicio, horaFin, tieneHorario ... */}
                {/* (Mantén la estructura exacta, pero reemplaza la parte de horario) */}
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5m1 0V9m8 0v7m-1 0v-3m-1 0v3" />
                      </svg>
                      <p className="font-medium text-gray-800 text-lg">{sol.aula_nombre || 'Aula sin nombre'}</p>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {sol.edificio_nombre || 'Sin edificio'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-semibold bg-[#701330]/10 text-[#701330] px-2 py-0.5 rounded-full font-mono">
                        {sol.codigo_solicitud || 'REQ-000'}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">Turno: {sol.turno || 'No especificado'}</span>
                    </div>
                    <div className={`flex flex-wrap items-center gap-2 mt-1 px-3 py-1 rounded-lg border ${
                      tieneHorario ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-xs font-medium ${tieneHorario ? 'text-blue-700' : 'text-gray-400'}`}>
                        {tieneHorario 
                          ? `${diaSemana} de ${horaInicio} a ${horaFin} hrs` 
                          : `${diaSemana} - Horario no especificado`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      sol.estado === 'Pendiente' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      sol.estado === 'Aprobada' ? 'bg-green-100 text-green-800 border border-green-200' :
                      sol.estado === 'Rechazada' ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {sol.estado || 'Pendiente'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {sol.fecha_envio ? new Date(sol.fecha_envio).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Fecha no disponible'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
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
                      Fecha solicitada
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
                    <p className="font-medium text-gray-800">{diaSemana}</p>
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

                {sol.motivo && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                    <span className="font-medium text-gray-700 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Motivo:
                    </span>
                    <p className="text-gray-600 mt-1">{sol.motivo}</p>
                  </div>
                )}

                {sol.observaciones_admin && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                    <span className="font-medium text-blue-700 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Observaciones:
                    </span>
                    <p className="text-blue-800 mt-1">{sol.observaciones_admin}</p>
                  </div>
                )}

                {sol.estado === 'Pendiente' && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    <button
                      onClick={() => setSolicitudSeleccionada(sol)}
                      className="px-4 py-2 text-sm font-semibold bg-[#701330] hover:bg-[#912347] text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Revisar
                    </button>
                  </div>
                )}

                {sol.estado !== 'Pendiente' && (
                  <div className={`mt-2 text-sm font-medium flex items-center gap-1 ${
                    sol.estado === 'Aprobada' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {sol.estado === 'Aprobada' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {sol.estado === 'Aprobada' ? 'Aprobada' : 'Rechazada'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
  );
}