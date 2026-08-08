import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { hasPermission, ROLES } from '../utils/auth';
import ToastLocal from '../components/ToastLocal';

function IconoAula({ tipo = '' }) {
  const cls = "w-8 h-8";
  const svg = (path) => (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
  const t = (tipo || '').toLowerCase();
  if (t.includes('laboratorio') || t.includes('lab')) {
    return svg("M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z");
  }
  if (t.includes('auditorio')) {
    return svg("M7 16V4m0 0L3 8m4-4l4 4m6 8v-6m0 0l-4 4m4-4l4 4M5 20h14");
  }
  if (t.includes('sala')) {
    return svg("M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z");
  }
  return svg("M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3m6 4h.01M14 12h.01");
}

export default function Aulas() {
  const { usuario } = useAuth();
  const esDirector = hasPermission(usuario, [ROLES.DIRECTOR]) && !hasPermission(usuario, [ROLES.SUPER_ADMIN]);

  const [lista, setLista] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [tiposAula, setTiposAula] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [form, setForm] = useState({
    nombre_aula: '',
    id_edificio: '',
    id_tipo: '',
    planta: '',
    capacidad: ''
  });
  const [cargando, setCargando] = useState(true);
  const [filtroPlanta, setFiltroPlanta] = useState('');
  const [vista, setVista] = useState('todos');
  const [aulaEliminar, setAulaEliminar] = useState(null);
  const [contrasenaEliminar, setContrasenaEliminar] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: 'error', mensaje: '' });

  const mostrarAlerta = (tipo, mensaje) => setAlerta({ mostrar: true, tipo, mensaje });

  const edificiosPermitidos = useMemo(() => {
    if (!esDirector || asignaciones.length === 0) return edificios;
    const ids = new Set(asignaciones.map(a => a.id_edificio));
    return edificios.filter(e => ids.has(e.id_edificio));
  }, [edificios, asignaciones, esDirector]);

  const plantasPermitidas = useMemo(() => {
    if (!esDirector) return ['baja', 'alta'];
    const asignacion = asignaciones.find(a => String(a.id_edificio) === String(form.id_edificio));
    if (!asignacion) return ['baja', 'alta'];
    if (asignacion.plantas === 'baja') return ['baja'];
    if (asignacion.plantas === 'alta') return ['alta'];
    return ['baja', 'alta'];
  }, [asignaciones, form.id_edificio, esDirector]);

  const esLaboratorio = (a) => {
    const t = (a.nombre_tipo || '').toLowerCase();
    return a.id_tipo === 2 || t.includes('laboratorio') || t.includes('lab');
  };

  const listaFiltrada = useMemo(() => {
    let items = lista;
    if (vista !== 'todos') {
      items = items.filter(a => vista === 'laboratorios' ? esLaboratorio(a) : !esLaboratorio(a));
    }
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      items = items.filter(a =>
        (a.nombre_aula || '').toLowerCase().includes(q) ||
        (a.nombre_edificio || '').toLowerCase().includes(q) ||
        (a.nombre_tipo || '').toLowerCase().includes(q)
      );
    }
    if (filtroPlanta) {
      items = items.filter(a => a.planta === filtroPlanta);
    }
    return items;
  }, [lista, busqueda, filtroPlanta, vista]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resEdif, resTipos, resAulas] = await Promise.all([
        api.get('/api/edificios'),
        api.get('/api/tipos-aula'),
        api.get('/api/aulas')
      ]);

      setEdificios(resEdif.data || []);
      setTiposAula(resTipos.data || []);
      setLista(resAulas.data || []);

      if (esDirector && usuario?.id_usuario !== undefined) {
        try {
          const resAsig = await api.get(`/api/director/${usuario.id_usuario}/edificios`);
          setAsignaciones(resAsig.data || []);
        } catch (e) {
          console.error('No se pudieron cargar las asignaciones:', e);
          setAsignaciones([]);
        }
      }
    } catch (err) {
      console.error("Error al cargar:", err);
      mostrarAlerta('error', 'No se pudo cargar la información');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [esDirector]);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const datos = {
        nombre_aula: form.nombre_aula.trim(),
        id_edificio: Number(form.id_edificio),
        id_tipo: Number(form.id_tipo),
        planta: form.planta.trim().toLowerCase(),
        capacidad: Number(form.capacidad)
      };

      if (editar) {
        await api.put(`/api/aulas/${editar.id_aula}`, datos);
      } else {
        await api.post('/api/aulas', datos);
      }

      setModal(false);
      setEditar(null);
      setForm({
        nombre_aula: '',
        id_edificio: '',
        id_tipo: '',
        planta: '',
        capacidad: ''
      });
      cargarDatos();
    } catch (err) {
      console.error("Error al guardar:", err);
      mostrarAlerta('error', err.response?.data?.detail || 'No se pudo guardar el registro');
    }
  };

  const eliminar = async (id) => {
    const aula = lista.find(a => a.id_aula === id);
    if (!aula) return;
    setAulaEliminar(aula);
    setContrasenaEliminar('');
  };

  const confirmarEliminar = async (e) => {
    e.preventDefault();
    if (!aulaEliminar || eliminando) return;
    if (!contrasenaEliminar) {
      mostrarAlerta('error', 'Ingresa tu contraseña para confirmar la eliminación');
      return;
    }
    setEliminando(true);
    try {
      await api.delete(`/api/aulas/${aulaEliminar.id_aula}`, { data: { contrasena: contrasenaEliminar } });
      setAulaEliminar(null);
      setContrasenaEliminar('');
      cargarDatos();
    } catch (err) {
      console.error("Error al eliminar:", err);
      mostrarAlerta('error', err.response?.data?.detail || 'No se pudo eliminar');
    } finally {
      setEliminando(false);
    }
  };

  const abrirModal = (aula = null, tipoPreseleccionado = '') => {
    setEditar(aula);
    setForm(aula ? {
      nombre_aula: aula.nombre_aula || '',
      id_edificio: aula.id_edificio ? String(aula.id_edificio) : '',
      id_tipo: aula.id_tipo ? String(aula.id_tipo) : '',
      planta: aula.planta || '',
      capacidad: aula.capacidad ? String(aula.capacidad) : ''
    } : {
      nombre_aula: '',
      id_edificio: '',
      id_tipo: tipoPreseleccionado || '',
      planta: '',
      capacidad: ''
    });
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditar(null);
    setForm({
      nombre_aula: '',
      id_edificio: '',
      id_tipo: '',
      planta: '',
      capacidad: ''
    });
  };

  const ocupacionColor = (porcentaje) => {
    if (porcentaje >= 80) return 'bg-red-500';
    if (porcentaje >= 40) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const estadoAula = (estado, porcentaje) => {
    if (estado === 'Ocupado') return { texto: 'Ocupada', cls: 'bg-red-100 text-red-700 border-red-200' };
    if (estado === 'Parcial') return { texto: 'Parcial', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    if (porcentaje >= 80) return { texto: 'Muy ocupada', cls: 'bg-red-100 text-red-700 border-red-200' };
    return { texto: 'Disponible', cls: 'bg-green-100 text-green-700 border-green-200' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#701330]/10 rounded-xl">
                <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {vista === 'laboratorios' ? 'Gestión de Laboratorios' : 'Gestión de Aulas'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {esDirector 
                    ? 'Administra las aulas de los espacios asignados' 
                    : 'Administra todas las aulas del campus'}
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => abrirModal(null, vista === 'laboratorios' ? String(tiposAula.find(t => (t.nombre_tipo || '').toLowerCase().includes('lab'))?.id_tipo || '') : '')} 
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {vista === 'laboratorios' ? 'Nuevo Laboratorio' : 'Nueva Aula'}
          </button>
        </div>

        {/* Alerta de asignaciones */}
        {esDirector && asignaciones.length === 0 && !cargando && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Sin edificios asignados</p>
              <p className="text-sm text-amber-700">
                Solicita al administrador que te asigne los espacios que debes administrar.
              </p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={vista === 'laboratorios' ? 'Buscar laboratorio, edificio o tipo...' : 'Buscar aula, edificio o tipo...'}
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filtroPlanta}
                onChange={e => setFiltroPlanta(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all min-w-[140px]"
              >
                <option value="">Todas las plantas</option>
                <option value="baja">Planta baja</option>
                <option value="alta">Planta alta</option>
              </select>
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setVista('todos')}
                  className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                    vista === 'todos' 
                      ? 'bg-white text-[#701330] shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todo
                </button>
                <button
                  onClick={() => setVista('aulas')}
                  className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                    vista === 'aulas' 
                      ? 'bg-white text-[#701330] shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Aulas
                </button>
                <button
                  onClick={() => setVista('laboratorios')}
                  className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                    vista === 'laboratorios' 
                      ? 'bg-white text-[#701330] shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Laboratorios
                </button>
              </div>
              {(busqueda || filtroPlanta || vista !== 'todos') && (
                <button
                  onClick={() => {
                    setBusqueda('');
                    setFiltroPlanta('');
                    setVista('todos');
                  }}
                  className="px-3 py-2.5 text-sm text-gray-500 hover:text-[#701330] hover:bg-[#701330]/5 rounded-xl transition-all duration-200"
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar
                  </span>
                </button>
              )}
              <span className="text-sm text-gray-400 ml-auto whitespace-nowrap">
                {listaFiltrada.length} {vista === 'laboratorios' ? 'laboratorio' : 'aula'}{listaFiltrada.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de aulas */}
        {cargando ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">Cargando aulas...</p>
            </div>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay {vista === 'laboratorios' ? 'laboratorios' : 'aulas'}
            </h3>
            <p className="text-gray-500">
              {busqueda || filtroPlanta || vista !== 'todos'
                ? 'No hay resultados que coincidan con los filtros aplicados'
                : 'Comienza creando un nuevo espacio'}
            </p>
            {(busqueda || filtroPlanta || vista !== 'todos') && (
              <button
                onClick={() => {
                  setBusqueda('');
                  setFiltroPlanta('');
                  setVista('todos');
                }}
                className="mt-4 px-6 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {listaFiltrada.map(a => {
              const porcentaje = a.porcentaje_ocupacion ?? 0;
              const estado = estadoAula(a.estado, porcentaje);
              const miAsignacion = esDirector && asignaciones.find(x =>
                String(x.id_edificio) === String(a.id_edificio) &&
                (x.plantas === 'ambas' || x.plantas === a.planta)
              );
              const esLab = (a.nombre_tipo || '').toLowerCase().includes('lab');
              
              return (
                <div 
                  key={a.id_aula} 
                  className="group bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden relative"
                >
                  {/* Decoración */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#701330]/5 to-transparent rounded-bl-full -mr-6 -mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Header de la tarjeta */}
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-[#701330]/5 to-transparent border-b border-gray-50 flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md group-hover:shadow-lg transition-shadow duration-300 ${
                      esLab
                        ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                        : (a.nombre_tipo || '').toLowerCase().includes('auditorio')
                          ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                          : 'bg-gradient-to-br from-[#701330] to-[#912347]'
                    }`}>
                      <IconoAula tipo={a.nombre_tipo} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight truncate group-hover:text-[#701330] transition-colors duration-300">
                        {a.nombre_aula}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                        </svg>
                        {a.nombre_edificio || 'Sin edificio'}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border flex-shrink-0 ${estado.cls}`}>
                      {estado.texto}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Planta {a.planta === 'baja' ? 'baja' : 'alta'}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {a.capacidad} lugares
                      </span>
                      <span className="ml-auto px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-medium">
                        {a.nombre_tipo || 'Aula'}
                      </span>
                    </div>

                    {miAsignacion && (
                      <div className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 font-medium flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Asignada a tu gestión
                      </div>
                    )}

                    {/* Barra de ocupación */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 font-medium">Ocupación</span>
                        <span className={`font-bold ${
                          porcentaje >= 80 ? 'text-red-600' :
                          porcentaje >= 40 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {porcentaje}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out ${ocupacionColor(porcentaje)}`} 
                          style={{ width: `${Math.min(100, porcentaje)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => abrirModal(a)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#701330]/5 text-[#701330] hover:bg-[#701330]/10 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => eliminar(a.id_aula)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Barra inferior animada */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#701330] to-[#912347] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de creación/edición */}
        {modal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
              <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#701330]/10 flex items-center justify-center flex-shrink-0 text-[#701330]">
                    <IconoAula />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{editar ? 'Editar Aula' : 'Nueva Aula'}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {editar ? 'Modifica los datos del aula' : 'Registra un nuevo espacio'}
                    </p>
                  </div>
                  <button 
                    onClick={cerrarModal} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={guardar} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre del aula <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                    placeholder="Ej. Aula 101"
                    value={form.nombre_aula}
                    onChange={e => setForm({ ...form, nombre_aula: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Edificio <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all bg-white"
                    value={form.id_edificio}
                    onChange={e => setForm({ ...form, id_edificio: e.target.value, planta: '' })}
                    required
                  >
                    <option value="">
                      {esDirector && edificiosPermitidos.length === 0 
                        ? 'Sin edificios asignados' 
                        : 'Seleccione un edificio'}
                    </option>
                    {edificiosPermitidos.map(e => (
                      <option key={e.id_edificio} value={String(e.id_edificio)}>
                        {e.nombre_edificio}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tipo de aula <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all bg-white"
                    value={form.id_tipo}
                    onChange={e => setForm({ ...form, id_tipo: e.target.value })}
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    {tiposAula.map(t => (
                      <option key={t.id_tipo} value={String(t.id_tipo)}>
                        {t.nombre_tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Planta <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all bg-white"
                    value={form.planta}
                    onChange={e => setForm({ ...form, planta: e.target.value })}
                    required
                  >
                    <option value="">Seleccione</option>
                    {plantasPermitidas.map(p => (
                      <option key={p} value={p}>
                        {p === 'baja' ? 'Planta baja' : 'Planta alta'}
                      </option>
                    ))}
                  </select>
                  {esDirector && plantasPermitidas.length === 1 && (
                    <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Solo puedes registrar en planta {plantasPermitidas[0] === 'baja' ? 'baja' : 'alta'} (según tu asignación)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Capacidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                    value={form.capacidad}
                    onChange={e => setForm({ ...form, capacidad: e.target.value })}
                    min="1"
                    max="999"
                    placeholder="Ej. 40"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editar ? 'Guardar cambios' : 'Registrar aula'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {aulaEliminar && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
              <div className="p-5 border-b border-red-100 bg-red-50/50 sticky top-0 z-10 rounded-t-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Eliminar aula</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Se desactivará <span className="font-semibold text-gray-700">{aulaEliminar.nombre_aula}</span> y se conservará su historial
                    </p>
                  </div>
                  <button
                    onClick={() => setAulaEliminar(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Cerrar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={confirmarEliminar} className="p-5 space-y-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-amber-700">
                    Esta acción no se puede deshacer fácilmente. Para confirmar que no es un error, ingresa tu contraseña.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tu contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                    placeholder="Contraseña actual"
                    value={contrasenaEliminar}
                    onChange={e => setContrasenaEliminar(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAulaEliminar(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={eliminando || !contrasenaEliminar}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {eliminando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Confirmar eliminación
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ToastLocal alerta={alerta} onCerrar={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })} />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}