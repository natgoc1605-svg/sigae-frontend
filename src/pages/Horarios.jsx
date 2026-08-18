import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import HorarioAula from '../components/HorarioAula';
import { hasPermission, ROLES } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

const COLOR_ESTADO = {
  Libre: '#10b981',
  Parcial: '#f59e0b',
  Ocupado: '#ef4444'
};

const ESTADOS = ['Todos', 'Libre', 'Parcial', 'Ocupado'];

export default function Horarios() {
  const { usuario } = useAuth();
  const [aulas, setAulas] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [edificiosPermitidos, setEdificiosPermitidos] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [filtroPlanta, setFiltroPlanta] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [orden, setOrden] = useState('nombre');

  const esSuperAdmin = usuario && hasPermission(usuario, [ROLES.SUPER_ADMIN]);
  const esDirector = usuario && hasPermission(usuario, [ROLES.DIRECTOR]);
  const puedeEditar = esSuperAdmin;

  useEffect(() => {
    if (usuario && esDirector && usuario.id_usuario != null) {
      api.get(`/api/director/${usuario.id_usuario}/edificios`)
        .then(res => setEdificiosPermitidos(res.data || []))
        .catch(err => console.error('Error cargando edificios permitidos:', err));
    }
  }, [usuario, esDirector]);

  const puedeEditarAula = (aula) => {
    if (esSuperAdmin) return true;
    if (esDirector) {
      return edificiosPermitidos.some(e => String(e.id_edificio) === String(aula.id_edificio));
    }
    return false;
  };

  useEffect(() => {
    const cargarAulas = async () => {
      try {
        const res = await api.get('/api/infraestructura/aulas-estado');
        setAulas(res.data || []);
      } catch (err) {
        console.error('Error cargando aulas:', err);
      } finally {
        setCargando(false);
      }
    };
    cargarAulas();
  }, []);

  const actualizarLista = () => {
    api.get('/api/infraestructura/aulas-estado')
      .then(res => setAulas(res.data || []))
      .catch(err => console.error('Error actualizando:', err));
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('Todos');
    setFiltroEdificio('');
    setFiltroPlanta('');
    setFiltroTipo('');
    setOrden('nombre');
  };

  const edificios = useMemo(() => {
    const mapa = new Map();
    aulas.forEach(a => { if (a.nombre_edificio) mapa.set(a.nombre_edificio, a.nombre_edificio); });
    return [...mapa.values()].sort((a, b) => a.localeCompare(b));
  }, [aulas]);

  const plantas = useMemo(() => {
    const mapa = new Map();
    aulas.forEach(a => { if (a.planta) mapa.set(a.planta, a.planta); });
    return [...mapa.values()].sort((a, b) => a.localeCompare(b));
  }, [aulas]);

  const tipos = useMemo(() => {
    const mapa = new Map();
    aulas.forEach(a => { if (a.nombre_tipo) mapa.set(a.nombre_tipo, a.nombre_tipo); });
    return [...mapa.values()].sort((a, b) => a.localeCompare(b));
  }, [aulas]);

  const conteosEstado = useMemo(() => {
    const conteos = { Libre: 0, Parcial: 0, Ocupado: 0 };
    aulas.forEach(a => { if (conteos[a.estado] !== undefined) conteos[a.estado] += 1; });
    return conteos;
  }, [aulas]);

  const hayFiltrosActivos = busqueda || filtroEstado !== 'Todos' || filtroEdificio || filtroPlanta || filtroTipo || orden !== 'nombre';

  const aulasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = aulas.filter(a => {
      if (filtroEstado !== 'Todos' && a.estado !== filtroEstado) return false;
      if (filtroEdificio && a.nombre_edificio !== filtroEdificio) return false;
      if (filtroPlanta && a.planta !== filtroPlanta) return false;
      if (filtroTipo && a.nombre_tipo !== filtroTipo) return false;
      if (q && !(a.nombre_aula || '').toLowerCase().includes(q) && !(a.nombre_edificio || '').toLowerCase().includes(q)) return false;
      return true;
    });
    switch (orden) {
      case 'ocupacion_desc':
        lista.sort((a, b) => (b.porcentaje_ocupacion || 0) - (a.porcentaje_ocupacion || 0));
        break;
      case 'ocupacion_asc':
        lista.sort((a, b) => (a.porcentaje_ocupacion || 0) - (b.porcentaje_ocupacion || 0));
        break;
      case 'capacidad':
        lista.sort((a, b) => (b.capacidad || 0) - (a.capacidad || 0));
        break;
      default:
        lista.sort((a, b) => (a.nombre_aula || '').localeCompare(b.nombre_aula || ''));
    }
    return lista;
  }, [aulas, busqueda, filtroEstado, filtroEdificio, filtroPlanta, filtroTipo, orden]);

  if (aulaSeleccionada) {
    return (
      <HorarioAula 
        aula={aulaSeleccionada} 
        onCerrar={() => setAulaSeleccionada(null)} 
        puedeEditar={puedeEditarAula(aulaSeleccionada)}
        onActualizarAula={actualizarLista}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <nav className="text-xs sm:text-sm text-gray-500 mb-2">
              <span className="text-[#701330] font-medium">SIGAE</span>
              <span className="mx-2">/</span>
              <span className="text-gray-600">Horarios</span>
            </nav>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#701330]/10 rounded-xl">
                <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Gestión de Horarios
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Selecciona un aula para ver o editar su horario
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {aulasFiltradas.length} de {aulas.length} aula{aulas.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={actualizarLista}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300 hover:rotate-180 hover:shadow-md"
              title="Actualizar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar aula o edificio..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filtroEdificio}
                onChange={e => setFiltroEdificio(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#701330]/30 transition-all min-w-[140px]"
              >
                <option value="">Todos los edificios</option>
                {edificios.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <select
                value={filtroPlanta}
                onChange={e => setFiltroPlanta(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#701330]/30 transition-all min-w-[110px]"
              >
                <option value="">Todas las plantas</option>
                {plantas.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#701330]/30 transition-all min-w-[140px]"
              >
                <option value="">Todos los tipos</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={orden}
                onChange={e => setOrden(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#701330]/30 transition-all min-w-[150px]"
                title="Ordenar"
              >
                <option value="nombre">Nombre (A-Z)</option>
                <option value="ocupacion_desc">Más ocupadas</option>
                <option value="ocupacion_asc">Menos ocupadas</option>
                <option value="capacidad">Mayor capacidad</option>
              </select>
            </div>
          </div>

          {/* Chips por estado con contadores */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {ESTADOS.map(estado => {
              const activo = filtroEstado === estado;
              const conteo = estado === 'Todos' ? aulas.length : (conteosEstado[estado] || 0);
              const color = estado === 'Todos' ? '#701330' : COLOR_ESTADO[estado];
              return (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    activo
                      ? 'text-white shadow-md'
                      : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                  style={activo ? { backgroundColor: color, borderColor: color } : undefined}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activo ? '#ffffff' : color }}
                  ></span>
                  {estado}
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                    activo ? 'bg-white/25' : 'bg-gray-100'
                  }`}>
                    {conteo}
                  </span>
                </button>
              );
            })}
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-[#701330] hover:bg-[#701330]/5 rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium animate-pulse">Cargando aulas...</p>
            </div>
          </div>
        ) : aulas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay aulas registradas</h3>
            <p className="text-gray-500">Agrega aulas en el módulo de infraestructura</p>
          </div>
        ) : aulasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin resultados</h3>
            <p className="text-gray-500 mb-4">Ningún aula coincide con los filtros aplicados</p>
            <button
              onClick={limpiarFiltros}
              className="px-6 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {aulasFiltradas.map(aula => {
              const editable = puedeEditarAula(aula);
              const pct = aula.porcentaje_ocupacion || 0;
              const colorEstado = COLOR_ESTADO[aula.estado] || '#9ca3af';
              return (
                <div
                  key={aula.id_aula}
                  onClick={() => setAulaSeleccionada(aula)}
                  className="group bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Decoración de fondo */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#701330]/5 to-transparent rounded-bl-full -mr-6 -mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Indicador de estado */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      editable 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {editable ? 'Editable' : 'Vista'}
                    </span>
                  </div>

                  {/* Icono */}
                  <div className="w-12 h-12 rounded-xl bg-[#701330]/10 flex items-center justify-center mb-3 group-hover:bg-[#701330]/20 transition-colors duration-300">
                    <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3m6 4h.01M14 12h.01" />
                    </svg>
                  </div>

                  {/* Información */}
                  <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-[#701330] transition-colors duration-300">
                    {aula.nombre_aula}
                  </h3>
                  
                  <div className="mt-2 space-y-1.5">
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                      </svg>
                      <span>{aula.nombre_edificio}</span>
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Planta {aula.planta} • {aula.capacidad} lugares</span>
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: colorEstado }}></span>
                      <span>{aula.estado || 'Sin estado'}</span>
                      <span className="text-xs text-gray-400 ml-auto font-semibold">{pct}% ocupado</span>
                    </p>
                  </div>

                  {/* Barra de ocupación */}
                  <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: colorEstado }}
                    ></div>
                  </div>

                  {/* Flecha indicadora */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 group-hover:text-[#701330] transition-colors duration-300">
                      {editable ? 'Haz clic para editar' : 'Haz clic para ver'}
                    </span>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-[#701330] group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer informativo */}
        <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>Editable</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span>Solo vista</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Ocupación de la semana</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Los directores solo pueden editar los edificios asignados</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}