import { useState } from 'react';
import api from '../../api/axios';
import SelectorHorario from './SelectorHorario';

function RevisarSolicitud({ solicitud, cerrar, onActualizada }) {
  const [form, setForm] = useState({
    observaciones_admin: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [decision, setDecision] = useState(null);
  const [mostrarMotivoRechazo, setMostrarMotivoRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [mostrarErrorConflicto, setMostrarErrorConflicto] = useState(false);
  const [errorConflicto, setErrorConflicto] = useState(null);
  const [mostrarSelectorHorario, setMostrarSelectorHorario] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

  const handleDecision = (estado) => {
    if (estado === 'Rechazada') {
      setMostrarMotivoRechazo(true);
      setDecision(estado);
    } else {
      setDecision(estado);
      ejecutarDecision(estado);
    }
  };

  const handleSeleccionHorario = (horario) => {
    setHorarioSeleccionado(horario);
    setMostrarSelectorHorario(false);
    
    setMensaje({
      tipo: 'exito',
      texto: `Horario seleccionado: ${horario.dia_semana} ${horario.fecha_texto} de ${horario.hora_inicio} a ${horario.hora_fin} hrs. Usa "Enviar propuesta de horario" para notificar al solicitante.`
    });
  };

  const enviarPropuesta = async () => {
    if (enviando) return;
    setEnviando(true);
    setMensaje(null);
    setDecision('Propuesta');

    try {
      await api.post(
        `/api/solicitudes-espacio/${solicitud.id_solicitud}/proponer-horario`,
        {
          fecha: horarioSeleccionado.fecha,
          id_bloque: horarioSeleccionado.id_bloque,
          observaciones: [
            form.observaciones_admin,
            `Horario propuesto: ${horarioSeleccionado.dia_semana} ${horarioSeleccionado.fecha_texto || ''} de ${horarioSeleccionado.hora_inicio} a ${horarioSeleccionado.hora_fin} hrs`
          ].filter(Boolean).join(' | ')
        }
      );
      setHorarioSeleccionado(null);
      setMensaje({
        tipo: 'exito',
        texto: 'Propuesta de horario enviada al solicitante. Se le notificará para que la acepte o rechace.'
      });
      if (onActualizada) onActualizada();
      setTimeout(cerrar, 1800);
    } catch (err) {
      console.error('Error al enviar propuesta:', err);
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.conflictos) {
        setMostrarErrorConflicto(true);
        setErrorConflicto(
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-semibold text-yellow-800">{detail.mensaje || 'El horario propuesto ya está ocupado'}</p>
            {detail.conflictos.map((c, i) => (
              <p key={i} className="text-sm text-gray-700 mt-1">
                {c.dia} {c.hora_inicio} - {c.hora_fin} hrs
                {c.grupo ? ` • ${c.grupo}` : ''}
                {c.codigo_solicitud ? ` • ${c.codigo_solicitud}` : ''}
              </p>
            ))}
            <button
              onClick={cerrarErrorConflicto}
              className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm"
            >
              Cerrar
            </button>
          </div>
        );
      } else {
        setMensaje({
          tipo: 'error',
          texto: typeof detail === 'string' ? detail : (detail?.mensaje || 'No se pudo enviar la propuesta')
        });
      }
    } finally {
      setEnviando(false);
      setDecision(null);
    }
  };

  const ejecutarDecision = async (estado) => {
    setEnviando(true);
    setMensaje(null);
    setMostrarErrorConflicto(false);
    setErrorConflicto(null);

    try {
      const payload = {
        estado: estado,
        observaciones_admin: estado === 'Rechazada' ? motivoRechazo : form.observaciones_admin
      };

      if (estado === 'Aprobada' && horarioSeleccionado) {
        payload.nueva_fecha = horarioSeleccionado.fecha;
        payload.nuevo_id_bloque = horarioSeleccionado.id_bloque;
        if (horarioSeleccionado.dia_semana) {
          payload.observaciones_admin = [
            form.observaciones_admin,
            `Horario propuesto por el responsable: ${horarioSeleccionado.dia_semana} ${horarioSeleccionado.fecha_texto || ''} de ${horarioSeleccionado.hora_inicio} a ${horarioSeleccionado.hora_fin} hrs`
          ].filter(Boolean).join(' | ');
        }
      }

      const response = await api.patch(
        `/api/solicitudes-espacio/${solicitud.id_solicitud}/estado`,
        payload
      );
      
      if (estado === 'Rechazada') {
        setMensaje({
          tipo: 'exito',
          texto: `Solicitud rechazada. Motivo: ${motivoRechazo || 'Sin motivo especificado'}`
        });
      } else {
        setMensaje({
          tipo: 'exito',
          texto: 'Solicitud aprobada correctamente'
        });
      }
      
      setMostrarMotivoRechazo(false);
      setMotivoRechazo('');
      if (onActualizada) onActualizada();
      setTimeout(cerrar, 1500);
    } catch (err) {
      console.log('Error completo:', err);
      console.log('Error response:', err.response);
      console.log('Error data:', err.response?.data);
      
      let mensajeError = 'No se pudo actualizar el estado';
      let detallesError = null;
      
      let errorData = null;
      
      if (err.response?.data) {
        errorData = err.response.data;
      } else if (err.mensaje) {
        errorData = err.mensaje;
      } else if (err.detail) {
        errorData = err.detail;
      }
      
      console.log('Error data extraído:', errorData);
      
      if (err.response?.status === 409 || (errorData && errorData.mensaje)) {
        if (err.mensaje && typeof err.mensaje === 'object') {
          const errorObj = err.mensaje;
          
          if (errorObj.detalles) {
            const d = errorObj.detalles;
            detallesError = d;
            mensajeError = (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{errorObj.mensaje || 'El espacio ya está ocupado en este horario'}</p>
                    <p className="text-sm text-gray-600 mt-1">No es posible aprobar la solicitud porque el aula ya tiene una reserva en el horario solicitado.</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Detalles de la reserva existente</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Aula:</span> <span className="font-medium text-gray-800">{d.aula || 'No especificada'}</span></div>
                    <div><span className="text-gray-500">Día:</span> <span className="font-medium text-gray-800">{d.dia || 'No especificado'}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Horario:</span> <span className="font-medium text-gray-800">{d.hora_inicio || '--:--'} - {d.hora_fin || '--:--'} hrs</span></div>
                    <div><span className="text-gray-500">Materia:</span> <span className="font-medium text-gray-800">{d.materia || 'Sin materia'}</span></div>
                    <div><span className="text-gray-500">Grupo:</span> <span className="font-medium text-gray-800">{d.grupo || 'Sin grupo'}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Docente:</span> <span className="font-medium text-gray-800">{d.docente || 'Sin docente'}</span></div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Acciones disponibles</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Rechazar la solicitud indicando el motivo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <button
                        onClick={() => {
                          setMostrarErrorConflicto(false);
                          setMostrarSelectorHorario(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Ver disponibilidad y proponer otro horario
                      </button>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Esperar a que el espacio esté disponible</span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          } else {
            mensajeError = errorObj.mensaje || 'El espacio ya está ocupado en este horario';
          }
        } else if (errorData) {
          if (errorData.conflictos && errorData.conflictos.length > 0) {
            mensajeError = (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">El espacio ya está ocupado en este horario</p>
                    <p className="text-sm text-gray-600 mt-1">No es posible aprobar la solicitud porque el aula ya tiene una reserva en el horario solicitado.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {errorData.conflictos.map((conflicto, index) => (
                    <div key={index} className={`rounded-lg border p-4 ${
                      conflicto.tipo === 'reserva_existente' 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <p className={`text-sm font-medium mb-2 ${
                        conflicto.tipo === 'reserva_existente' 
                          ? 'text-red-800' 
                          : 'text-yellow-800'
                      }`}>
                        {conflicto.tipo === 'reserva_existente' ? 'Reserva existente' : 'Solicitud pendiente'}
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        <div><span className="text-gray-500">Aula:</span> <span className="font-medium text-gray-800">{conflicto.aula || 'No especificada'}</span></div>
                        <div><span className="text-gray-500">Día:</span> <span className="font-medium text-gray-800">{conflicto.dia || 'No especificado'}</span></div>
                        <div className="col-span-2"><span className="text-gray-500">Horario:</span> <span className="font-medium text-gray-800">{conflicto.hora_inicio || '--:--'} - {conflicto.hora_fin || '--:--'} hrs</span></div>
                        {conflicto.materia && <div><span className="text-gray-500">Materia:</span> <span className="font-medium text-gray-800">{conflicto.materia}</span></div>}
                        {conflicto.grupo && <div><span className="text-gray-500">Grupo:</span> <span className="font-medium text-gray-800">{conflicto.grupo}</span></div>}
                        {conflicto.docente && <div className="col-span-2"><span className="text-gray-500">Docente:</span> <span className="font-medium text-gray-800">{conflicto.docente}</span></div>}
                        {conflicto.codigo_solicitud && <div className="col-span-2"><span className="text-gray-500">Código:</span> <span className="font-medium text-gray-800">{conflicto.codigo_solicitud}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Acciones disponibles</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Rechazar la solicitud indicando el motivo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <button
                        onClick={() => {
                          setMostrarErrorConflicto(false);
                          setMostrarSelectorHorario(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Ver disponibilidad y proponer otro horario
                      </button>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Esperar a que el espacio esté disponible</span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          } else if (errorData.detalles) {
            const d = errorData.detalles;
            detallesError = d;
            mensajeError = (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{errorData.mensaje || 'El espacio ya está ocupado en este horario'}</p>
                    <p className="text-sm text-gray-600 mt-1">No es posible aprobar la solicitud porque el aula ya tiene una reserva en el horario solicitado.</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Detalles de la reserva existente</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Aula:</span> <span className="font-medium text-gray-800">{d.aula || 'No especificada'}</span></div>
                    <div><span className="text-gray-500">Día:</span> <span className="font-medium text-gray-800">{d.dia || 'No especificado'}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Horario:</span> <span className="font-medium text-gray-800">{d.hora_inicio || '--:--'} - {d.hora_fin || '--:--'} hrs</span></div>
                    <div><span className="text-gray-500">Materia:</span> <span className="font-medium text-gray-800">{d.materia || 'Sin materia'}</span></div>
                    <div><span className="text-gray-500">Grupo:</span> <span className="font-medium text-gray-800">{d.grupo || 'Sin grupo'}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Docente:</span> <span className="font-medium text-gray-800">{d.docente || 'Sin docente'}</span></div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Acciones disponibles</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Rechazar la solicitud indicando el motivo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <button
                        onClick={() => {
                          setMostrarErrorConflicto(false);
                          setMostrarSelectorHorario(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Ver disponibilidad y proponer otro horario
                      </button>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Esperar a que el espacio esté disponible</span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          } else if (errorData.mensaje) {
            mensajeError = errorData.mensaje;
          } else if (errorData.detail) {
            if (typeof errorData.detail === 'string') {
              mensajeError = errorData.detail;
            } else if (typeof errorData.detail === 'object') {
              mensajeError = errorData.detail.mensaje || 'Error al procesar la solicitud';
            }
          }
        }
        
        if (typeof mensajeError !== 'string') {
          setErrorConflicto(mensajeError);
          setMostrarErrorConflicto(true);
          setEnviando(false);
          setDecision(null);
          return;
        }
      } else if (err.response?.status === 403) {
        mensajeError = 'No tienes permisos para realizar esta acción';
      } else if (err.response?.status === 400) {
        if (err.response?.data?.detail) {
          if (typeof err.response.data.detail === 'string') {
            mensajeError = err.response.data.detail;
          } else if (err.response.data.detail.mensaje) {
            mensajeError = err.response.data.detail.mensaje;
          } else {
            mensajeError = 'La solicitud no se puede procesar en su estado actual';
          }
        } else {
          mensajeError = 'La solicitud no se puede procesar en su estado actual';
        }
      } else if (err.message) {
        mensajeError = err.message;
      }
      
      console.log('Mensaje de error final:', mensajeError);
      
      setMensaje({
        tipo: 'error',
        texto: mensajeError
      });
    } finally {
      setEnviando(false);
      setDecision(null);
    }
  };

  const cerrarModalRechazo = () => {
    setMostrarMotivoRechazo(false);
    setMotivoRechazo('');
    setDecision(null);
  };

  const cerrarErrorConflicto = () => {
    setMostrarErrorConflicto(false);
    setErrorConflicto(null);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    try {
      return new Date((fecha || '') + 'T12:00:00').toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  const getDiaSemana = (fecha) => {
    if (!fecha) return '';
    const dias = {
      'Monday': 'Lunes',
      'Tuesday': 'Martes',
      'Wednesday': 'Miércoles',
      'Thursday': 'Jueves',
      'Friday': 'Viernes',
      'Saturday': 'Sábado',
      'Sunday': 'Domingo',
      'Lunes': 'Lunes',
      'Martes': 'Martes',
      'Miércoles': 'Miércoles',
      'Jueves': 'Jueves',
      'Viernes': 'Viernes',
      'Sábado': 'Sábado',
      'Domingo': 'Domingo'
    };
    try {
      const fechaObj = new Date((fecha || '') + 'T12:00:00');
      const diaIngles = fechaObj.toLocaleDateString('en-US', { weekday: 'long' });
      return dias[diaIngles] || fechaObj.toLocaleDateString('es-MX', { weekday: 'long' });
    } catch {
      return fecha;
    }
  };

  const obtenerHorario = () => {
    let horaInicio = null;
    let horaFin = null;
    
    if (solicitud.hora_inicio_str) {
      horaInicio = solicitud.hora_inicio_str;
    } else if (solicitud.hora_inicio) {
      try {
        const fecha = new Date(solicitud.hora_inicio);
        if (!isNaN(fecha.getTime())) {
          horaInicio = fecha.toTimeString().substring(0, 5);
        }
      } catch {}
    }
    
    if (solicitud.hora_fin_str) {
      horaFin = solicitud.hora_fin_str;
    } else if (solicitud.hora_fin) {
      try {
        const fecha = new Date(solicitud.hora_fin);
        if (!isNaN(fecha.getTime())) {
          horaFin = fecha.toTimeString().substring(0, 5);
        }
      } catch {}
    }
    
    if (!horaInicio || !horaFin) {
      if (solicitud.turno === 'Matutino') {
        horaInicio = horaInicio || '07:00';
        horaFin = horaFin || '07:50';
      } else if (solicitud.turno === 'Vespertino') {
        horaInicio = horaInicio || '13:00';
        horaFin = horaFin || '13:50';
      }
    }
    
    return { horaInicio, horaFin };
  };

  const { horaInicio, horaFin } = obtenerHorario();
  const tieneHorario = horaInicio && horaFin;

  const getInitials = (nombre) => {
    if (!nombre) return 'U';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#701330] flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Revisar Solicitud
          </h3>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-mono font-semibold">
            {solicitud.codigo_solicitud}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4 mb-4 text-sm border border-gray-200">
          <div className="col-span-2 flex items-center gap-3">
            {solicitud.solicitante_foto ? (
              <img
                src={solicitud.solicitante_foto}
                alt={solicitud.solicitante_nombre}
                className="w-11 h-11 rounded-full object-cover border-2 border-[#701330]/20 flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#701330] flex items-center justify-center text-white font-bold text-sm border-2 border-[#701330]/20 flex-shrink-0">
                {getInitials(solicitud.solicitante_nombre)}
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs">Solicitante</p>
              <p className="font-medium text-gray-800">{solicitud.solicitante_nombre || 'No especificado'}</p>
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Aula</p>
            <p className="font-medium text-gray-800">{solicitud.aula_nombre || 'No especificada'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Edificio</p>
            <p className="font-medium text-gray-800">{solicitud.edificio_nombre || 'No especificado'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Estado</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              solicitud.estado === 'Pendiente' ? (
                solicitud.solicitante_rol === 'superadmin'
                  ? 'bg-amber-100 text-amber-800 border border-amber-400'
                  : 'bg-gray-200 text-gray-700 border border-gray-400'
              ) :
              solicitud.estado === 'Aprobada' ? 'bg-green-100 text-green-800 border border-green-200' :
              solicitud.estado === 'Rechazada' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {solicitud.estado || 'Pendiente'}
            </span>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Carrera</p>
            <p className="font-medium text-gray-800">{solicitud.carrera_nombre || 'Sin asignar'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Fecha</p>
            <p className="font-medium text-gray-800">{formatearFecha(solicitud.fecha_solicitud)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Día</p>
            <p className="font-medium text-gray-800">{getDiaSemana(solicitud.fecha_solicitud)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Turno</p>
            <p className="font-medium text-gray-800">{solicitud.turno || 'No especificado'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Duración</p>
            <p className="font-medium text-gray-800">
              {solicitud.duracion_horas ? `${solicitud.duracion_horas} ${solicitud.duracion_horas === 1 ? 'hora' : 'horas'}` : 'No especificada'}
            </p>
          </div>
          <div className={`rounded-lg px-3 py-1.5 border ${tieneHorario ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-gray-500 text-xs">Horario solicitado</p>
            <p className={`font-semibold ${tieneHorario ? 'text-blue-700' : 'text-gray-400'}`}>
              {tieneHorario ? `${horaInicio} - ${horaFin} hrs` : 'No especificado'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500 text-xs">Motivo</p>
            <p className="font-medium text-gray-800">{solicitud.motivo || 'Sin motivo'}</p>
          </div>
          {solicitud.observaciones_admin && (
            <div className="col-span-2">
              <p className="text-gray-500 text-xs">Observaciones del responsable</p>
              <p className="font-medium text-gray-800">{solicitud.observaciones_admin}</p>
            </div>
          )}
        </div>

        {mensaje && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            mensaje.tipo === 'exito'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {typeof mensaje.texto === 'string' ? (
              <p>{mensaje.texto}</p>
            ) : (
              mensaje.texto
            )}
          </div>
        )}

        <div className="space-y-4">
          {horarioSeleccionado && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-semibold text-blue-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Horario propuesto
              </p>
              <p className="text-blue-700 mt-1">
                {horarioSeleccionado.dia_semana}, {horarioSeleccionado.fecha_texto} de {horarioSeleccionado.hora_inicio} a {horarioSeleccionado.hora_fin} hrs
              </p>
              <button
                type="button"
                onClick={() => { setHorarioSeleccionado(null); setMostrarSelectorHorario(true); }}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Cambiar horario propuesto
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea
              value={form.observaciones_admin}
              onChange={(e) => setForm({ ...form, observaciones_admin: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#701330]/20 focus:border-[#701330] resize-none"
              placeholder="Comentarios adicionales..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => (horarioSeleccionado ? enviarPropuesta() : handleDecision('Aprobada'))}
              disabled={enviando}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                horarioSeleccionado ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {enviando && decision === (horarioSeleccionado ? 'Propuesta' : 'Aprobada') ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : horarioSeleccionado ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {horarioSeleccionado ? 'Enviar propuesta de horario' : 'Aprobar'}
            </button>
            <button
              type="button"
              onClick={() => handleDecision('Rechazada')}
              disabled={enviando}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enviando && decision === 'Rechazada' ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              Rechazar
            </button>
            <button
              type="button"
              onClick={cerrar}
              className="px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para motivo de rechazo */}
      {mostrarMotivoRechazo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-7 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Motivo de Rechazo
                </h3>
                <p className="text-sm text-gray-500 mt-1">Indica el motivo por el cual rechazas esta solicitud</p>
              </div>
              <button
                onClick={cerrarModalRechazo}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all duration-300 hover:rotate-90"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del rechazo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  placeholder="Ej. El espacio ya esta ocupado, no hay disponibilidad en ese horario, etc."
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Este motivo sera notificado al solicitante</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModalRechazo}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!motivoRechazo.trim()) {
                      setMensaje({
                        tipo: 'error',
                        texto: 'Es necesario escribir un motivo para rechazar la solicitud'
                      });
                      return;
                    }
                    ejecutarDecision('Rechazada');
                  }}
                  disabled={enviando}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    'Confirmar Rechazo'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de error por conflicto */}
      {mostrarErrorConflicto && errorConflicto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-7 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                No se puede aprobar la solicitud
              </h3>
              <button
                onClick={cerrarErrorConflicto}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all duration-300 hover:rotate-90"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {errorConflicto}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    cerrarErrorConflicto();
                    setMostrarMotivoRechazo(true);
                    setDecision('Rechazada');
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Rechazar Solicitud
                </button>
                <button
                  type="button"
                  onClick={cerrarErrorConflicto}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector de horario */}
      {mostrarSelectorHorario && (
        <SelectorHorario
          solicitud={solicitud}
          onSeleccionar={handleSeleccionHorario}
          onCerrar={() => {
            setMostrarSelectorHorario(false);
            if (!horarioSeleccionado) {
              setMostrarErrorConflicto(true);
            }
          }}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out forwards; }
        .animate-modalIn { animation: modalIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default RevisarSolicitud;