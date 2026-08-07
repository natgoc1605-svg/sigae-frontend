import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserId, isDirector, isSuperAdmin } from '../utils/auth';
import api from '../api/axios';
import HorarioAula from '../components/HorarioAula';

const COLORS = {
  primary: '#701330',
  primaryLight: '#912347',
  primaryPale: '#FDF2F6',
  green: '#16A34A',
  greenLight: '#ECFDF3',
  yellow: '#CA8A04',
  yellowLight: '#FFFBEB',
  red: '#DC2626',
  redLight: '#FEF2F2',
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  gray: '#6B7280',
  grayLight: '#F9FAFB',
  border: '#E5E7EB'
};

export default function Infraestructura() {
  const location = useLocation();
  const { usuario } = useAuth();
  const [edificios, setEdificios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [filtroEdificio, setFiltroEdificio] = useState('todos');
  const [docenciaSeleccionada, setDocenciaSeleccionada] = useState('todas');
  const [filtroPlanta, setFiltroPlanta] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [edificiosPermitidos, setEdificiosPermitidos] = useState([]);
  const [refrescar, setRefrescar] = useState(0);
  const [errorCarga, setErrorCarga] = useState(null);
  
  const esSuperAdmin = isSuperAdmin(usuario);
  const esDirector = isDirector(usuario);
  const idDirector = getUserId(usuario);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      
      const resEdif = await api.get('/api/edificios');
      setEdificios(resEdif.data || []);
      
      if (esDirector && idDirector) {
        const resPermitidos = await api.get(`/api/director/${idDirector}/edificios`);
        
        let datosPermitidos = resPermitidos.data || [];
        if (!Array.isArray(datosPermitidos)) {
          datosPermitidos = [];
        }
        
        const datosNormalizados = datosPermitidos.map((item) => ({
          id_edificio: item.id_edificio,
          plantas: item.plantas || 'ambas'
        }));
        
        setEdificiosPermitidos(datosNormalizados);
        
        if (datosNormalizados.length === 0) {
          setAulas([]);
          setCargando(false);
          return;
        }
        
        const resAulas = await api.get(`/api/director/${idDirector}/aulas`);
        
        let aulasData = resAulas.data || [];
        if (!Array.isArray(aulasData)) {
          aulasData = [];
        }
        
        const aulasConEstado = aulasData.map(aula => ({
          ...aula,
          estado: aula.estado || 'Libre',
          porcentaje_ocupacion: aula.porcentaje_ocupacion || 0,
          asignaciones: aula.asignaciones || 0,
          total_bloques: aula.total_bloques || 34
        }));
        
        setAulas(aulasConEstado);
        
        if (datosNormalizados.length === 1) {
          setFiltroEdificio(datosNormalizados[0].id_edificio);
          setDocenciaSeleccionada(datosNormalizados[0].id_edificio);
        }
      } else {
        const resAulas = await api.get('/api/infraestructura/aulas-estado');
        
        let aulasData = resAulas.data || [];
        if (!Array.isArray(aulasData)) {
          aulasData = [];
        }
        
        setAulas(aulasData);
      }
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setErrorCarga(`Error al cargar datos: ${err.message}`);
      setEdificiosPermitidos([]);
      setAulas([]);
    } finally {
      setCargando(false);
    }
  }, [esDirector, idDirector]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos, refrescar]);

  const handleActualizarAula = () => {
    setRefrescar(prev => prev + 1);
  };

  useEffect(() => {
    if (location.state?.filtroEstado) {
      setFiltroEstado(location.state.filtroEstado);
    }
    if (location.state?.aulaSeleccionada) {
      setAulaSeleccionada(location.state.aulaSeleccionada);
    }
  }, [location.state]);

  const listaDocencias = edificios.reduce((lista, edif) => {
    if (esDirector && !edificiosPermitidos.some(e => e.id_edificio === edif.id_edificio)) {
      return lista;
    }
    
    let aulasEdificio = aulas.filter(a => a.id_edificio === edif.id_edificio);
    
    if (esDirector) {
      const permiso = edificiosPermitidos.find(e => e.id_edificio === edif.id_edificio);
      if (permiso && permiso.plantas !== 'ambas') {
        aulasEdificio = aulasEdificio.filter(a => a.planta === permiso.plantas);
      }
    }
    
    if (aulasEdificio.length === 0) {
      return lista;
    }
    
    const libres = aulasEdificio.filter(a => a.estado === 'Libre').length;
    const parciales = aulasEdificio.filter(a => a.estado === 'Parcial').length;
    const ocupadas = aulasEdificio.filter(a => a.estado === 'Ocupado').length;

    lista[edif.id_edificio] = {
      id: edif.id_edificio,
      nombre: edif.nombre_edificio,
      total: aulasEdificio.length,
      libres,
      parciales,
      ocupadas,
      porcentajeLibre: aulasEdificio.length ? Math.round((libres / aulasEdificio.length) * 100) : 0
    };
    return lista;
  }, {});

  const aulasFiltradas = aulas.filter(aula => {
    const coincideEdificio = filtroEdificio === 'todos' || aula.id_edificio === Number(filtroEdificio);
    const coincideDocencia = docenciaSeleccionada === 'todas' || aula.id_edificio === Number(docenciaSeleccionada);
    const coincidePlanta = filtroPlanta === 'todas' || aula.planta?.toLowerCase() === filtroPlanta.toLowerCase();
    const coincideEstado = filtroEstado === 'todos' || aula.estado === filtroEstado;
    const coincideBusqueda = aula.nombre_aula?.toLowerCase().includes(busqueda.toLowerCase());

    return coincideEdificio && coincideDocencia && coincidePlanta && coincideEstado && coincideBusqueda;
  });

  const resumenGeneral = aulasFiltradas.reduce((acc, a) => {
    acc.libres += a.estado === 'Libre' ? 1 : 0;
    acc.parciales += a.estado === 'Parcial' ? 1 : 0;
    acc.ocupadas += a.estado === 'Ocupado' ? 1 : 0;
    acc.aulas += a.id_tipo === 1 ? 1 : 0;
    acc.laboratorios += a.id_tipo === 2 ? 1 : 0;
    return acc;
  }, { libres: 0, parciales: 0, ocupadas: 0, aulas: 0, laboratorios: 0 });

  const aulasPorPlanta = aulasFiltradas.reduce((grupos, aula) => {
    const planta = aula.planta?.trim() || 'Sin planta';
    if (!grupos[planta]) grupos[planta] = [];
    grupos[planta].push(aula);
    return grupos;
  }, {});

  const getColorEstado = (libres, parciales, ocupadas) => {
    if (ocupadas > 0) return COLORS.red;
    if (parciales > 0) return COLORS.yellow;
    if (libres > 0) return COLORS.green;
    return COLORS.gray;
  };

  const getEstiloEstado = (estado) => {
    switch(estado) {
      case 'Libre':
        return { texto: 'Disponible', color: COLORS.green, fondo: COLORS.greenLight };
      case 'Parcial':
        return { texto: 'Uso Parcial', color: COLORS.yellow, fondo: COLORS.yellowLight };
      case 'Ocupado':
        return { texto: 'Ocupado', color: COLORS.red, fondo: COLORS.redLight };
      default:
        return { texto: 'Sin estado', color: COLORS.gray, fondo: COLORS.grayLight };
    }
  };

  const getTipoEspacio = (idTipo, nombreTipo) => {
    if (idTipo === 1) {
      return {
        nombre: nombreTipo || 'Aula',
        icono: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3m6 4h.01M14 12h.01" />
          </svg>
        ),
        color: COLORS.primary,
        fondo: COLORS.primaryPale
      };
    }
    if (idTipo === 2) {
      return {
        nombre: nombreTipo || 'Laboratorio',
        icono: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
        color: COLORS.blue,
        fondo: COLORS.blueLight
      };
    }
    return {
      nombre: nombreTipo || 'Espacio',
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: COLORS.gray,
      fondo: COLORS.grayLight
    };
  };

  const puedeEditarAula = (aula) => {
    if (esSuperAdmin) {
      return true;
    }
    
    if (!esDirector) {
      return false;
    }
    
    if (!edificiosPermitidos || edificiosPermitidos.length === 0) {
      return false;
    }
    
    const permiso = edificiosPermitidos.find(e => e.id_edificio === aula.id_edificio);
    
    if (!permiso) {
      return false;
    }
    
    if (permiso.plantas === 'ambas') {
      return true;
    }
    
    return permiso.plantas === aula.planta;
  };

  if (aulaSeleccionada) {
    const puedeEditar = puedeEditarAula(aulaSeleccionada);
    return (
      <HorarioAula 
        aula={aulaSeleccionada} 
        onCerrar={() => {
          setAulaSeleccionada(null);
          handleActualizarAula();
        }} 
        puedeEditar={puedeEditar} 
        onActualizarAula={handleActualizarAula}
      />
    );
  }

  if (errorCarga) {
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
              <h2 className="text-lg font-bold text-gray-900">Error al cargar datos</h2>
              <p className="text-sm text-gray-600 mt-0.5">{errorCarga}</p>
            </div>
          </div>
          <button 
            onClick={handleActualizarAula}
            className="w-full mt-2 px-4 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (esDirector && edificiosPermitidos.length === 0 && !cargando) {
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
              <h2 className="text-lg font-bold text-gray-900">Sin Edificios Asignados</h2>
              <p className="text-sm text-gray-600 mt-0.5">No tienes edificios asignados para gestionar</p>
            </div>
          </div>
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg mb-4">
            Contacta al Super Administrador para que te asigne un edificio.
          </p>
          <button 
            onClick={handleActualizarAula}
            className="w-full px-4 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-5">
          <nav className="text-xs sm:text-sm text-gray-500 mb-3">
            <span className="text-[#701330] font-medium">SIGAE</span>
            <span className="mx-2">/</span>
            <span className="text-gray-600">Infraestructura</span>
            <span className="mx-2">/</span>
            <span className="font-semibold text-gray-900">
              {esSuperAdmin ? 'Gestión de Espacios' : 'Mis Edificios'}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {esSuperAdmin ? 'Espacios Académicos' : 'Mis Edificios'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {esSuperAdmin 
                  ? 'Aulas, laboratorios y espacios de trabajo' 
                  : `${edificiosPermitidos.length} edificio(s) a tu cargo`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs sm:text-sm font-semibold text-green-700">{resumenGeneral.libres}</span>
                <span className="text-xs text-green-500 hidden sm:inline">Libres</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs sm:text-sm font-semibold text-amber-700">{resumenGeneral.parciales}</span>
                <span className="text-xs text-amber-500 hidden sm:inline">Parciales</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-xs sm:text-sm font-semibold text-red-700">{resumenGeneral.ocupadas}</span>
                <span className="text-xs text-red-500 hidden sm:inline">Ocupadas</span>
              </div>
              <button 
                onClick={handleActualizarAula}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 hover:rotate-180 hover:shadow-md"
                title="Recargar"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* Edificios / Docencias */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {esSuperAdmin ? 'Edificios / Docencias' : ' Mis Edificios'}
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {Object.keys(listaDocencias).length} edificios
            </span>
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {esSuperAdmin && (
              <button
                onClick={() => setDocenciaSeleccionada('todas')}
                className={`group relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  docenciaSeleccionada === 'todas' 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 shadow-md' 
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <span className="font-bold text-gray-800 text-base sm:text-lg">Todos</span>
                  </div>
                  {docenciaSeleccionada === 'todas' && (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-500">{aulas.length} espacios</span>
                  <div className="w-12 sm:w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </button>
            )}

            {Object.values(listaDocencias).map(edif => (
              <button
                key={edif.id}
                onClick={() => setDocenciaSeleccionada(edif.id.toString())}
                className={`group relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  docenciaSeleccionada === edif.id.toString() 
                    ? 'bg-gradient-to-br from-[#701330]/5 to-[#701330]/10 border-[#701330] shadow-md' 
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: getColorEstado(edif.libres, edif.parciales, edif.ocupadas) }}
                    ></span>
                    <span className="font-bold text-gray-800 text-base sm:text-lg truncate">
                      {edif.nombre}
                    </span>
                  </div>
                  {esDirector && (
                    <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex-shrink-0 ml-1">
                      {edificiosPermitidos.find(e => e.id_edificio === edif.id)?.plantas || 'ambas'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-500">{edif.total} espacios</span>
                  <div className="w-12 sm:w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${edif.porcentajeLibre}%`, 
                        backgroundColor: edif.porcentajeLibre > 70 ? COLORS.green : edif.porcentajeLibre > 30 ? COLORS.yellow : COLORS.red 
                      }}
                    ></div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Filtros */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-8 hover:shadow-md transition-shadow duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Buscar espacio
              </label>
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Ej: A-101, Lab 1..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all text-sm placeholder:text-gray-400"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Edificio
              </label>
              <select
                value={filtroEdificio}
                onChange={e => setFiltroEdificio(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all text-sm"
              >
                <option value="todos">Todos</option>
                {edificios
                  .filter(e => !esDirector || edificiosPermitidos.some(p => p.id_edificio === e.id_edificio))
                  .map(e => (
                    <option key={e.id_edificio} value={e.id_edificio}>{e.nombre_edificio}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Planta
              </label>
              <select
                value={filtroPlanta}
                onChange={e => setFiltroPlanta(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all text-sm"
              >
                <option value="todas">Todas</option>
                <option value="alta">Alta</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all text-sm"
              >
                <option value="todos">Todos</option>
                <option value="Libre">🟢 Libre</option>
                <option value="Parcial">🟡 Parcial</option>
                <option value="Ocupado">🔴 Ocupado</option>
              </select>
            </div>

            <div className="flex items-end">
              {(filtroEdificio !== 'todos' || filtroPlanta !== 'todas' || filtroEstado !== 'todos' || busqueda) && (
                <button
                  onClick={() => {
                    setFiltroEdificio('todos');
                    setFiltroPlanta('todas');
                    setFiltroEstado('todos');
                    setBusqueda('');
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-[#701330] hover:bg-[#701330]/5 rounded-xl border border-gray-200 hover:border-[#701330]/30 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar filtros
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Lista de Aulas */}
        <section>
          {cargando ? (
            <div className="flex flex-col justify-center items-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Cargando espacios...</p>
              <p className="text-sm text-gray-400 mt-1">Por favor espera</p>
            </div>
          ) : Object.keys(aulasPorPlanta).length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin resultados</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                No hay espacios que coincidan con los filtros seleccionados
              </p>
              {(filtroEdificio !== 'todos' || filtroPlanta !== 'todas' || filtroEstado !== 'todos' || busqueda) && (
                <button
                  onClick={() => {
                    setFiltroEdificio('todos');
                    setFiltroPlanta('todas');
                    setFiltroEstado('todos');
                    setBusqueda('');
                  }}
                  className="mt-4 px-6 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            Object.entries(aulasPorPlanta).map(([planta, listaAulas]) => (
              <div key={planta} className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-7 bg-[#701330] rounded-full"></div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                    Planta {planta.charAt(0).toUpperCase() + planta.slice(1)}
                  </h3>
                  <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {listaAulas.length} espacio{listaAulas.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                  {listaAulas.map(aula => {
                    const estado = getEstiloEstado(aula.estado);
                    const tipo = getTipoEspacio(aula.id_tipo, aula.nombre_tipo);
                    const puedeEditar = puedeEditarAula(aula);
                    
                    return (
                      <div
                        key={aula.id_aula}
                        onClick={() => setAulaSeleccionada(aula)}
                        className={`group bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl relative overflow-hidden ${
                          puedeEditar 
                            ? 'border-gray-200 hover:border-[#701330]' 
                            : 'border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        {/* Decoración de fondo */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full -mr-6 -mt-6 opacity-50"></div>
                        
                        {/* Indicador de estado */}
                        <span 
                          className="absolute top-4 right-4 w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: estado.color }}
                        ></span>

                        {/* Encabezado */}
                        <div className="flex items-start gap-3 mb-4 relative">
                          <div className="p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: tipo.fondo, color: tipo.color }}>
                            {tipo.icono}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg font-bold text-gray-900 truncate">{aula.nombre_aula}</h4>
                            <p className="text-xs text-gray-500 truncate">{aula.nombre_edificio}</p>
                            {puedeEditar && (
                              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-0.5 font-medium">
                                Editable
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Detalles */}
                        <div className="space-y-2.5 text-sm relative">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs">Tipo</span>
                            <span className="font-semibold text-xs" style={{ color: tipo.color }}>{tipo.nombre}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs">Ocupación</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${
                                aula.porcentaje_ocupacion >= 80 ? 'text-red-600' :
                                aula.porcentaje_ocupacion >= 50 ? 'text-amber-600' :
                                'text-green-600'
                              }`}>
                                {aula.porcentaje_ocupacion || 0}%
                              </span>
                              <span className="text-xs text-gray-400">
                                {aula.asignaciones || 0}/{aula.total_bloques || 34}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{aula.capacidad || 0} lugares</span>
                            <span className="mx-1 text-gray-300">|</span>
                            <span>Planta {aula.planta}</span>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span 
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={{ backgroundColor: estado.fondo, color: estado.color }}
                            >
                              {estado.texto}
                            </span>
                            {esDirector && !puedeEditar && (
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg font-medium">
                                Solo vista
                              </span>
                            )}
                            {puedeEditar && (
                              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-lg font-medium">
                                Editar
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hover indicator */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#701330] to-[#912347] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}