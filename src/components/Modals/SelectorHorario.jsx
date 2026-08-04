import { useState, useEffect } from 'react';
import api from '../../api/axios';

function SelectorHorario({ solicitud, onSeleccionar, onCerrar }) {
  const [cargando, setCargando] = useState(true);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarDisponibilidad();
  }, []);

  const cargarDisponibilidad = async () => {
    try {
      setCargando(true);
      setMensaje(null);
      
      const fechaOriginal = new Date(solicitud.fecha_solicitud);
      const fechaInicio = new Date(fechaOriginal);
      fechaInicio.setDate(fechaInicio.getDate() - 7);
      const fechaFin = new Date(fechaOriginal);
      fechaFin.setDate(fechaFin.getDate() + 7);
      
      const response = await api.get(
        `/api/solicitudes-espacio/${solicitud.id_solicitud}/disponibilidad`,
        {
          params: {
            fecha_inicio: fechaInicio.toISOString().split('T')[0],
            fecha_fin: fechaFin.toISOString().split('T')[0]
          }
        }
      );
      
      setDisponibilidad(response.data);
      setFechaSeleccionada(null);
      setBloqueSeleccionado(null);
      
    } catch (err) {
      console.error('Error al cargar disponibilidad:', err);
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.detail || 'Error al cargar la disponibilidad'
      });
    } finally {
      setCargando(false);
    }
  };

  const seleccionarBloque = (fecha, bloque) => {
    if (bloque.estado === 'disponible') {
      setFechaSeleccionada(fecha);
      setBloqueSeleccionado(bloque);
    }
  };

  const confirmarSeleccion = () => {
    if (fechaSeleccionada && bloqueSeleccionado) {
      const fechaObj = new Date(fechaSeleccionada.fecha);
      const fechaStr = fechaObj.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      
      onSeleccionar({
        fecha: fechaSeleccionada.fecha,
        fecha_texto: fechaStr,
        dia_semana: fechaSeleccionada.dia_semana,
        hora_inicio: bloqueSeleccionado.hora_inicio,
        hora_fin: bloqueSeleccionado.hora_fin,
        id_bloque: bloqueSeleccionado.id_bloque,
        aula: solicitud.aula_nombre
      });
    }
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'disponible': return 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100 cursor-pointer';
      case 'reservado': return 'bg-red-50 border-red-300 text-red-600 cursor-not-allowed opacity-60';
      case 'pendiente': return 'bg-yellow-50 border-yellow-300 text-yellow-600 cursor-not-allowed opacity-60';
      default: return 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed';
    }
  };

  const getEstadoTexto = (estado) => {
    switch(estado) {
      case 'disponible': return 'Disponible';
      case 'reservado': return 'Reservado';
      case 'pendiente': return 'Pendiente';
      default: return 'No disponible';
    }
  };

  const conteoDisponibles = (dia) => {
    if (!dia?.bloques) return 0;
    return dia.bloques.filter(b => b.estado === 'disponible').length;
  };

  const mejorDia = (() => {
    if (!disponibilidad?.disponibilidad) return null;
    let mejor = null;
    for (const dia of disponibilidad.disponibilidad) {
      const n = conteoDisponibles(dia);
      if (n > 0 && (!mejor || n > mejor.conteo)) {
        mejor = { ...dia, conteo: n };
      }
    }
    return mejor;
  })();

  const totalDisponibles = (() => {
    if (!disponibilidad?.disponibilidad) return 0;
    return disponibilidad.disponibilidad.reduce((acc, d) => acc + conteoDisponibles(d), 0);
  })();

  const totalBloques = (() => {
    if (!disponibilidad?.disponibilidad?.[0]?.bloques) return 0;
    return disponibilidad.disponibilidad[0].bloques.length;
  })();

  if (cargando) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[95] p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#701330] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando disponibilidad del aula...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[95] p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-[#701330] flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Seleccionar Horario
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Aula: <span className="font-semibold text-gray-700">{disponibilidad?.aula}</span>
              <span className="mx-2">|</span>
              Turno: <span className="font-semibold text-gray-700">{disponibilidad?.turno}</span>
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all duration-300 hover:rotate-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#701330]/5 border border-[#701330]/10 rounded-xl p-3">
            <p className="text-[11px] text-gray-500 uppercase font-semibold">Edificio</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{disponibilidad?.edificio || '-'}</p>
          </div>
          <div className="bg-[#701330]/5 border border-[#701330]/10 rounded-xl p-3">
            <p className="text-[11px] text-gray-500 uppercase font-semibold">Turno</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{disponibilidad?.turno || '-'}</p>
          </div>
          <div className="bg-[#701330]/5 border border-[#701330]/10 rounded-xl p-3">
            <p className="text-[11px] text-gray-500 uppercase font-semibold">Horario solicitado</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {disponibilidad?.hora_solicitada_inicio ? `${disponibilidad.hora_solicitada_inicio} - ${disponibilidad.hora_solicitada_fin || ''} hrs` : '-'}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-[11px] text-green-600 uppercase font-semibold">Disponibilidad</p>
            <p className="text-sm font-semibold text-green-700 mt-0.5">
              {totalDisponibles} de {totalBloques} bloques por día
            </p>
          </div>
        </div>

        {mejorDia && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-800">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mejor opción: <span className="font-semibold">{mejorDia.dia_semana}, {new Date(mejorDia.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span> con {mejorDia.conteo} bloques disponibles
          </div>
        )}

        {mensaje && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            mensaje.tipo === 'exito'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {disponibilidad?.disponibilidad?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay disponibilidad en el rango de fechas seleccionado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border border-gray-200 min-w-[120px]">
                      Fecha / Día
                    </th>
                    {disponibilidad?.disponibilidad?.[0]?.bloques?.map((bloque, idx) => (
                      <th key={idx} className="px-3 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200 min-w-[80px]">
                        {bloque.hora_inicio}
                        <br />
                        <span className="text-[10px] text-gray-400">- {bloque.hora_fin}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {disponibilidad?.disponibilidad?.map((dia, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 text-sm font-medium">
                        <div className="font-semibold text-gray-800">{dia.dia_semana}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(dia.fecha).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          conteoDisponibles(dia) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {conteoDisponibles(dia)} disponibles
                        </div>
                      </td>
                      {dia.bloques?.map((bloque, idx) => {
                        const isSelected = fechaSeleccionada?.fecha === dia.fecha && 
                                         bloqueSeleccionado?.id_bloque === bloque.id_bloque;
                        
                        return (
                          <td 
                            key={idx} 
                            className={`px-2 py-2 border border-gray-200 text-center text-sm transition-all ${
                              getEstadoColor(bloque.estado)
                            } ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                            onClick={() => seleccionarBloque(dia, bloque)}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-medium">
                                {getEstadoTexto(bloque.estado)}
                              </span>
                              {bloque.detalle && bloque.estado === 'reservado' && (
                                <div className="text-[10px] text-gray-500 mt-1 max-w-[80px] truncate" 
                                     title={`Materia: ${bloque.detalle.materia}`}>
                                  {bloque.detalle.materia?.substring(0, 12)}
                                </div>
                              )}
                              {bloque.detalle && bloque.estado === 'pendiente' && (
                                <div className="text-[10px] text-gray-500 mt-1 max-w-[80px] truncate"
                                     title={`Código: ${bloque.detalle.codigo}`}>
                                  {bloque.detalle.codigo}
                                </div>
                              )}
                              {isSelected && (
                                <div className="mt-1">
                                  <span className="text-[10px] font-semibold text-blue-600">Seleccionado</span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded"></span>
                <span className="text-xs text-gray-600">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded"></span>
                <span className="text-xs text-gray-600">Reservado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                <span className="text-xs text-gray-600">Solicitud pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded ring-2 ring-blue-500 ring-inset"></span>
                <span className="text-xs text-gray-600">Seleccionado</span>
              </div>
            </div>

            {fechaSeleccionada && bloqueSeleccionado && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Horario seleccionado</p>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium text-gray-800 ml-2">
                      {fechaSeleccionada.dia_semana}, {
                        new Date(fechaSeleccionada.fecha).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Horario:</span>
                    <span className="font-medium text-gray-800 ml-2">
                      {bloqueSeleccionado.hora_inicio} - {bloqueSeleccionado.hora_fin} hrs
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCerrar}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarSeleccion}
                disabled={!fechaSeleccionada || !bloqueSeleccionado}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Proponer este horario
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SelectorHorario;