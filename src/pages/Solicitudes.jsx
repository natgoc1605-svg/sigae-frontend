import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../api/socket';
import NuevaSolicitud from '../components/Modals/NuevaSolicitud';
import RevisarSolicitud from '../components/Modals/RevisarSolicitud';

const ESTADOS = {
  Pendiente: { clase: 'bg-amber-100 text-amber-800 border-amber-200', texto: 'Pendiente' },
  Aprobada: { clase: 'bg-green-100 text-green-800 border-green-200', texto: 'Aprobada' },
  Rechazada: { clase: 'bg-red-100 text-red-800 border-red-200', texto: 'Rechazada' }
};

const getInitials = (nombre) => {
  if (!nombre) return '?';
  const partes = nombre.trim().split(' ');
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
};

export default function Solicitudes() {
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busquedaGrupo, setBusquedaGrupo] = useState('');
  const [busquedaTutor, setBusquedaTutor] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [modalNueva, setModalNueva] = useState(false);
  const [modalRevisar, setModalRevisar] = useState(null);

  const cargarDatos = async () => {
    try {
      const res = await api.get('/api/solicitudes-espacio');
      setSolicitudes(res.data || []);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    socket.on('actualizacion', cargarDatos);
    return () => socket.off('actualizacion', cargarDatos);
  }, []);

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroEstado !== 'todos' && s.estado !== filtroEstado) return false;
    if (busquedaGrupo && !(s.sigla_grupo || '').toLowerCase().includes(busquedaGrupo.toLowerCase())) return false;
    if (busquedaTutor && !(s.tutor_grupo || '').toLowerCase().includes(busquedaTutor.toLowerCase())) return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(solicitudesFiltradas.length / porPagina));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const solicitudesPagina = solicitudesFiltradas.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);

  const cambiarFiltro = (est) => {
    setFiltroEstado(est);
    setPaginaActual(1);
  };

  const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#701330] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#701330]">Solicitudes de Espacio</h1>
          <p className="text-gray-500 mt-1">
            {pendientes} solicitud(es) pendiente(s) de revisión
          </p>
        </div>
        <button
          onClick={() => setModalNueva(true)}
          className="px-5 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Solicitud
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
        <div className="flex flex-wrap gap-2">
          {['todos', 'Pendiente', 'Aprobada', 'Rechazada'].map(est => (
            <button
              key={est}
              onClick={() => cambiarFiltro(est)}
              className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                filtroEstado === est
                  ? est === 'todos' ? 'bg-[#701330] text-white shadow-md' :
                    est === 'Pendiente' ? 'bg-amber-500 text-white shadow-md' :
                    est === 'Aprobada' ? 'bg-green-500 text-white shadow-md' :
                    'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {est === 'todos' ? 'Todos' : est} ({est === 'todos' ? solicitudes.length : solicitudes.filter(s => s.estado === est).length})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <input
            type="text"
            value={busquedaGrupo}
            onChange={(e) => { setBusquedaGrupo(e.target.value); setPaginaActual(1); }}
            placeholder="Buscar grupo..."
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
          />
          <input
            type="text"
            value={busquedaTutor}
            onChange={(e) => { setBusquedaTutor(e.target.value); setPaginaActual(1); }}
            placeholder="Buscar tutor..."
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
          />
          {(busquedaGrupo || busquedaTutor) && (
            <button
              onClick={() => { setBusquedaGrupo(''); setBusquedaTutor(''); setPaginaActual(1); }}
              className="px-3 py-1.5 text-sm text-[#701330] hover:bg-[#701330]/10 rounded-lg font-medium"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {solicitudesFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay solicitudes</h3>
            <p className="text-gray-500">
              {filtroEstado === 'todos'
                ? 'No se han registrado solicitudes aún.'
                : `No hay solicitudes con estado "${filtroEstado}".`}
            </p>
          </div>
        ) : (
          solicitudesPagina.map(sol => {
            const estado = ESTADOS[sol.estado] || ESTADOS.Pendiente;
            const esPendiente = sol.estado === 'Pendiente';
            const puedeRevisar = usuario?.rol === 'superadmin' && esPendiente;
            const clasePendiente = sol.solicitante_rol === 'superadmin'
              ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]'
              : 'bg-[#CBD5E1] text-[#1F2937] border-[#64748B]';

            return (
              <div
                key={sol.id_solicitud}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#701330]/10 flex items-center justify-center text-[#701330] font-bold text-sm flex-shrink-0 overflow-hidden">
                      {sol.solicitante_foto ? (
                        <img src={sol.solicitante_foto} alt={sol.solicitante_nombre} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(sol.solicitante_nombre)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{sol.solicitante_nombre}</p>
                      <p className="text-xs text-gray-500">{sol.carrera_nombre || 'Sin carrera'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-gray-800 text-sm bg-gray-100 px-3 py-1 rounded-md">
                      {sol.codigo_solicitud}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${esPendiente ? clasePendiente : estado.clase}`}>
                      {estado.texto}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(sol.fecha_envio).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {puedeRevisar && (
                      <button
                        onClick={() => setModalRevisar(sol)}
                        className="px-4 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Revisar
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Espacio</span>
                    <p className="font-medium text-gray-800">
                      {sol.edificio_nombre} • {sol.aula_nombre}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Fecha solicitada</span>
                    <p className="font-medium text-gray-800">
                      {new Date((sol.fecha_solicitud || '') + 'T12:00:00').toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Turno</span>
                    <p className="font-medium text-gray-800">{sol.turno}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Motivo</span>
                    <p className="font-medium text-gray-800 truncate">{sol.motivo}</p>
                  </div>
                </div>

                {sol.observaciones_admin && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                    <span className="font-medium text-blue-700">Observaciones del revisor:</span>
                    <p className="text-blue-800 mt-1">{sol.observaciones_admin}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {solicitudesFiltradas.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Mostrar:</span>
            {[5, 10, 20].map(n => (
              <button
                key={n}
                onClick={() => { setPorPagina(n); setPaginaActual(1); }}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  porPagina === n ? 'bg-[#701330] text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
            <span className="ml-2 text-gray-500">
              {solicitudesFiltradas.length} solicitud(es)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaActual(Math.max(1, paginaSegura - 1))}
              disabled={paginaSegura <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Anterior
            </button>
            <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#701330]/10 text-[#701330]">
              Página {paginaSegura} de {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual(Math.min(totalPaginas, paginaSegura + 1))}
              disabled={paginaSegura >= totalPaginas}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {modalNueva && (
        <NuevaSolicitud
          cerrar={() => setModalNueva(false)}
          onCreada={cargarDatos}
        />
      )}
      {modalRevisar && (
        <RevisarSolicitud
          solicitud={modalRevisar}
          cerrar={() => setModalRevisar(null)}
          onActualizada={cargarDatos}
        />
      )}
    </div>
  );
}