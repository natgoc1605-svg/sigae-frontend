import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const MESES = [
  { num: 1, nombre: 'Enero' }, { num: 2, nombre: 'Febrero' }, { num: 3, nombre: 'Marzo' },
  { num: 4, nombre: 'Abril' }, { num: 5, nombre: 'Mayo' }, { num: 6, nombre: 'Junio' },
  { num: 7, nombre: 'Julio' }, { num: 8, nombre: 'Agosto' }, { num: 9, nombre: 'Septiembre' },
  { num: 10, nombre: 'Octubre' }, { num: 11, nombre: 'Noviembre' }, { num: 12, nombre: 'Diciembre' }
];

const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);

const DIAS_SEMANA = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves',
  viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo'
};

const badgeEstado = (estado) => {
  if (estado === 'Aprobada') return 'bg-green-100 text-green-700 border-green-200';
  if (estado === 'Rechazada') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
};

export default function Historial() {
  const { usuario } = useAuth();
  const [anios, setAnios] = useState([]);
  const [anio, setAnio] = useState('');
  const [mes, setMes] = useState('');
  const [dia, setDia] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [datos, setDatos] = useState({ reservas: [], solicitudes: [], resumen: {} });
  const [guardados, setGuardados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [nombreHistorial, setNombreHistorial] = useState('');
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });
  const [historialActual, setHistorialActual] = useState(null);
  const [catSecciones, setCatSecciones] = useState({});

  const cargarAnios = async () => {
    try {
      const res = await api.get('/api/historial/anios');
      const lista = res.data?.anios || [];
      setAnios(lista);
      const anioActual = new Date().getFullYear();
      if (lista.some(a => a.anio === anioActual)) {
        setAnio(String(anioActual));
      } else if (lista.length > 0) {
        setAnio(String(lista[0].anio));
      }
    } catch (err) {
      console.error('Error cargando anios:', err);
    }
  };

  const cargarGuardados = async () => {
    try {
      const res = await api.get('/api/historial/guardados');
      setGuardados(res.data || []);
    } catch (err) {
      console.error('Error cargando historiales guardados:', err);
    }
  };

  const cargarDatos = async (filtros) => {
    setCargandoDatos(true);
    try {
      const params = new URLSearchParams();
      if (filtros?.anio) params.set('anio', filtros.anio);
      if (filtros?.mes) params.set('mes', filtros.mes);
      if (filtros?.dia) params.set('dia', filtros.dia);
      if (filtros?.estado) params.set('estado', filtros.estado);
      const qs = params.toString();
      const res = await api.get(`/api/historial/datos${qs ? `?${qs}` : ''}`);
      setDatos(res.data || { reservas: [], solicitudes: [], resumen: {} });
    } catch (err) {
      console.error('Error cargando datos del historial:', err);
      setDatos({ reservas: [], solicitudes: [], resumen: {} });
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    Promise.all([cargarAnios(), cargarGuardados()]).finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (anio || mes || dia || estadoFiltro) {
      cargarDatos({
        anio: anio || undefined,
        mes: mes || undefined,
        dia: dia || undefined,
        estado: estadoFiltro || undefined
      });
    } else {
      cargarDatos({});
    }
  }, [anio, mes, dia, estadoFiltro]);

  const limpiarFiltros = () => {
    setAnio('');
    setMes('');
    setDia('');
    setEstadoFiltro('');
  };

  const guardarHistorial = async () => {
    const nombre = nombreHistorial.trim();
    if (!nombre) {
      setAlerta({ mostrar: true, tipo: 'error', mensaje: 'Escribe un nombre para el historial' });
      return;
    }
    try {
      const res = await api.post('/api/historial/guardados', {
        nombre,
        anio: anio ? Number(anio) : null,
        mes: mes ? Number(mes) : null,
        dia: dia ? Number(dia) : null,
        estado: estadoFiltro || null
      });
      setHistorialActual(res.data);
      setAlerta({ mostrar: true, tipo: 'exito', mensaje: `Historial "${nombre}" guardado correctamente` });
      setNombreHistorial('');
      await cargarGuardados();
    } catch (err) {
      setAlerta({ mostrar: true, tipo: 'error', mensaje: err.response?.data?.detail || 'Error al guardar el historial' });
    }
  };

  const reabrirHistorial = async (h) => {
    try {
      setHistorialActual(h);
      setAnio(h.anio ? String(h.anio) : '');
      setMes(h.mes ? String(h.mes) : '');
      setDia(h.dia ? String(h.dia) : '');
      setEstadoFiltro(h.estado || '');
      setNombreHistorial('');
    } catch (err) {
      console.error('Error reabriendo historial:', err);
    }
  };

  const eliminarHistorial = async (h) => {
    const confirmar = window.confirm(`¿Eliminar el historial "${h.nombre}"?`);
    if (!confirmar) return;
    try {
      await api.delete(`/api/historial/guardados/${h.id_historial}`);
      setGuardados(prev => prev.filter(g => g.id_historial !== h.id_historial));
      if (historialActual?.id_historial === h.id_historial) setHistorialActual(null);
      setAlerta({ mostrar: true, tipo: 'exito', mensaje: 'Historial eliminado' });
    } catch (err) {
      setAlerta({ mostrar: true, tipo: 'error', mensaje: err.response?.data?.detail || 'Error al eliminar' });
    }
  };

  const textoPeriodo = () => {
    const partes = [];
    if (anio) partes.push(anio);
    if (mes) partes.push(MESES.find(m => m.num === Number(mes))?.nombre || '');
    if (dia) partes.push(`${dia}`);
    return partes.length ? partes.join(' - ') : 'Todo el historial';
  };

  const formatearFecha = (f) => {
    if (!f) return '—';
    try {
      return new Date(String(f) + 'T12:00:00').toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return f;
    }
  };

  const formatearDatetime = (f) => {
    if (!f) return '—';
    try {
      return new Date(f).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return f;
    }
  };

  const horaMostrar = (hi, hf) => {
    if (hi && hf) return `${hi} - ${hf} hrs`;
    if (hi) return `${hi} hrs`;
    return '—';
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reporte-imprimible min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {alerta.mostrar && (
          <div className={`fixed top-4 right-4 z-[100] max-w-md w-full rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-fadeIn ${
            alerta.tipo === 'exito' ? 'bg-green-50 border-2 border-green-200 text-green-800' :
            alerta.tipo === 'error' ? 'bg-red-50 border-2 border-red-200 text-red-800' : 'bg-blue-50'
          }`}>
            <span className="text-sm font-medium flex-1">{alerta.mensaje}</span>
            <button onClick={() => setAlerta({ mostrar: false })} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Barra de herramientas */}
        <div className="no-print bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#701330]/10 rounded-xl">
                <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#701330] tracking-tight">Historial</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {usuario?.rol === 'director' ? 'Historial de tus edificios asignados' : 'Historial general de reservas y solicitudes'}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimir / PDF</span>
            </button>
          </div>

          {/* Navegador por años / meses / dias */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Año</label>
              <select value={anio} onChange={e => setAnio(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] text-sm">
                <option value="">Todos</option>
                {anios.map(a => (
                  <option key={a.anio} value={a.anio}>{a.anio}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mes</label>
              <select value={mes} onChange={e => setMes(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] text-sm">
                <option value="">Todos</option>
                {MESES.map(m => (
                  <option key={m.num} value={m.num}>{m.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Día</label>
              <select value={dia} onChange={e => setDia(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] text-sm">
                <option value="">Todos</option>
                {DIAS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Estado</label>
              <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] text-sm">
                <option value="">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre del historial</label>
              <input
                type="text"
                value={nombreHistorial}
                onChange={e => setNombreHistorial(e.target.value)}
                placeholder="Ej: Historial 2024"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="col-span-2 lg:col-span-1 flex items-end">
              <button
                onClick={guardarHistorial}
                className="w-full px-4 py-2.5 text-sm font-semibold bg-[#701330] hover:bg-[#912347] text-white rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar historial
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Periodo: <span className="font-semibold text-gray-700">{textoPeriodo()}</span>
            </span>
            {(anio || mes || dia || estadoFiltro) && (
              <button
                onClick={limpiarFiltros}
                className="text-xs font-medium text-[#701330] hover:bg-[#701330]/5 px-3 py-1 rounded-full transition-colors"
              >
                Limpiar filtros
              </button>
            )}
            {historialActual && (
              <span className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                Reabierto: {historialActual.nombre}
              </span>
            )}
          </div>
        </div>

        {/* Historiales guardados */}
        <div className="no-print bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Historiales guardados
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{guardados.length}</span>
          </h3>
          {guardados.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Aún no has guardado historiales. Aplica un periodo de años/meses/días y dale nombre para guardarlo.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {guardados.map(h => (
                <div key={h.id_historial} className="group border border-gray-100 rounded-xl p-3.5 hover:border-[#701330]/30 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{h.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                        {h.anio ? `${h.anio}` : 'Todos los años'}
                        {h.mes ? ` • ${MESES.find(m => m.num === h.mes)?.nombre}` : ''}
                        {h.dia ? ` • día ${h.dia}` : ''}
                        {h.estado ? ` • ${h.estado}` : ''}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">{formatearDatetime(h.creado_en)}</p>
                      {usuario?.rol === 'superadmin' && h.usuario_nombre && (
                        <p className="text-[11px] text-gray-400">por {h.usuario_nombre}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => reabrirHistorial(h)}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                        title="Reabrir"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminarHistorial(h)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Encabezado del reporte */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <img src="/logoUtvt.png" alt="UTVT" className="h-10 sm:h-14 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              <div>
                <p className="text-base sm:text-lg font-bold text-[#701330]">SIGAE UTVT</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {historialActual?.nombre || (nombreHistorial ? nombreHistorial : 'Historial de reservas y solicitudes')}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right text-xs sm:text-sm w-full sm:w-auto">
              <p className="text-gray-500">
                Generado por: <span className="font-medium text-gray-800">{usuario?.nombre || 'Usuario'}</span>
              </p>
              <p className="text-gray-400 text-xs mt-0.5">{textoPeriodo()}</p>
              <p className="text-gray-400 text-xs mt-0.5 capitalize">
                {new Date().toLocaleString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Reservas</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{datos.resumen.reservas || 0}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Solicitudes</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">{datos.resumen.solicitudes || 0}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wider">Aprobadas</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{datos.resumen.aprobadas || 0}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-xs text-red-600 font-medium uppercase tracking-wider">Rechazadas</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{datos.resumen.rechazadas || 0}</p>
            </div>
          </div>
        </div>

        {cargandoDatos ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Cargando historial...</p>
          </div>
        ) : (
          <>
            {/* Reservas del horario */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  Reservas del Horario
                  <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{datos.reservas.length} registros</span>
                </h3>
              </div>
              {datos.reservas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No hay reservas en este periodo</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b-2 border-gray-200">
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Edificio / Aula</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Materia</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Grupo</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Docente</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Día</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Horario</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Turno</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ciclo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {datos.reservas.map(r => (
                        <tr key={r.id_reserva} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="text-gray-800 font-semibold">{r.nombre_aula}</span>
                            <span className="text-xs text-gray-400 block">{r.nombre_edificio}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{r.nombre_materia || '—'}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-[#701330] bg-[#701330]/5 px-2 py-0.5 rounded-full text-xs">{r.sigla_grupo || '—'}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{r.tutor_grupo || r.nombre_docente || '—'}</td>
                          <td className="py-3 px-4 text-gray-700">{DIAS_SEMANA[r.dia_semana] || r.dia_semana || '—'}</td>
                          <td className="py-3 px-4 text-gray-700">{horaMostrar(r.hora_inicio, r.hora_fin)}</td>
                          <td className="py-3 px-4 text-gray-600 capitalize">{r.turno || '—'}</td>
                          <td className="py-3 px-4 text-gray-500">{r.ciclo_nombre || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Solicitudes de espacio */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  Solicitudes de Reserva
                  <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{datos.solicitudes.length} registros</span>
                </h3>
              </div>
              {datos.solicitudes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No hay solicitudes en este periodo</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b-2 border-gray-200">
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Folio</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Aula</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Solicitante</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Horario</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Motivo</th>
                        <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {datos.solicitudes.map(s => (
                        <tr key={s.id_solicitud} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-[#701330] bg-[#701330]/5 px-2 py-0.5 rounded-full text-xs">{s.codigo_solicitud}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{formatearFecha(s.fecha_solicitud)}</td>
                          <td className="py-3 px-4">
                            <span className="text-gray-800 font-semibold">{s.nombre_aula}</span>
                            <span className="text-xs text-gray-400 block">{s.nombre_edificio}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-700">{s.solicitante_nombre || '—'}</span>
                            <span className="text-xs text-gray-400 block capitalize">{s.solicitante_rol === 'superadmin' ? 'Super Admin' : s.solicitante_rol || '—'}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{horaMostrar(s.hora_inicio_str || s.hora_inicio, s.hora_fin_str || s.hora_fin)}</td>
                          <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{s.motivo || '—'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badgeEstado(s.estado)}`}>
                              {s.estado || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Catálogos completos (solo superadmin) */}
        {datos.catalogos && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5m1 0V9m8 0v7m-1 0v-3m-1 0v3" />
                  </svg>
                  Catálogos del Sistema
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {Object.keys(datos.catalogos).reduce((acc, k) => acc + (datos.catalogos[k]?.length || 0), 0)} registros
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Edificios, aulas, carreras, usuarios, docentes y materias — visibles solo para superadmin</p>
              </div>
              <div className="no-print flex gap-2">
                <button
                  onClick={() => {
                    const expandir = Object.keys(datos.catalogos).some(k => !catSecciones[k]);
                    const nuevo = {};
                    Object.keys(datos.catalogos).forEach(k => { nuevo[k] = expandir; });
                    setCatSecciones(nuevo);
                  }}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-[#701330] hover:bg-[#701330]/5 rounded-xl border border-gray-200 transition-all duration-300"
                >
                  {Object.keys(datos.catalogos).every(k => catSecciones[k]) ? 'Colapsar todo' : 'Expandir todo (para imprimir)'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'edificios', titulo: 'Edificios', cols: ['Nombre', 'Plantas', 'Aulas', 'Libres', 'Ocupadas', 'Laboratorios', 'Auditorios', 'Estado'] },
                { key: 'aulas', titulo: 'Aulas', cols: ['Aula', 'Edificio', 'Tipo', 'Planta', 'Capacidad', 'Estado', 'Ocupación'] },
                { key: 'carreras', titulo: 'Carreras', cols: ['Sigla', 'Nombre', 'Correo de contacto', 'Usuarios'] },
                { key: 'usuarios', titulo: 'Usuarios', cols: ['Nombre', 'Correo', 'Rol', 'Carrera'] },
                { key: 'docentes', titulo: 'Docentes', cols: ['Nombre', 'Sigla', 'Profesión', 'Departamento', 'Correo', 'Estado'] },
                { key: 'materias', titulo: 'Materias', cols: ['Sigla', 'Nombre', 'Plan educativo'] }
              ].map(sec => {
                const lista = datos.catalogos[sec.key] || [];
                const abierto = catSecciones[sec.key];
                return (
                  <div key={sec.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setCatSecciones(prev => ({ ...prev, [sec.key]: !prev[sec.key] }))}
                      className="w-full p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors no-print"
                    >
                      <h4 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                        {sec.titulo}
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">{lista.length}</span>
                      </h4>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {abierto && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50/80 border-b-2 border-gray-200">
                              {sec.cols.map(col => (
                                <th key={col} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {sec.key === 'edificios' && lista.map((e, i) => (
                              <tr key={e.id_edificio} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-3 px-4"><span className="font-semibold text-gray-800">{e.nombre_edificio}</span></td>
                                <td className="py-3 px-4 text-gray-600">{e.cantidad_plantas || '—'}</td>
                                <td className="py-3 px-4 text-gray-700">{e.total_aulas || 0}</td>
                                <td className="py-3 px-4 text-green-600 font-medium">{e.aulas_libres || 0}</td>
                                <td className="py-3 px-4 text-red-600 font-medium">{e.aulas_ocupadas || 0}</td>
                                <td className="py-3 px-4 text-gray-600">{e.tiene_laboratorios ? 'Sí' : 'No'}</td>
                                <td className="py-3 px-4 text-gray-600">{e.tiene_auditorios ? 'Sí' : 'No'}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${e.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {e.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {sec.key === 'aulas' && lista.map(a => (
                              <tr key={a.id_aula} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-3 px-4"><span className="font-semibold text-gray-800">{a.nombre_aula}</span></td>
                                <td className="py-3 px-4 text-gray-600">{a.nombre_edificio || '—'}</td>
                                <td className="py-3 px-4 text-gray-600">{a.nombre_tipo || '—'}</td>
                                <td className="py-3 px-4 text-gray-600 capitalize">{a.planta || '—'}</td>
                                <td className="py-3 px-4 text-gray-700">{a.capacidad || 0} lug</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    a.estado === 'Libre' ? 'bg-green-100 text-green-700 border-green-200' :
                                    a.estado === 'Parcial' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                    a.estado === 'Ocupado' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}>{a.estado || '—'}</span>
                                </td>
                                <td className="py-3 px-4 text-gray-700">{a.porcentaje_ocupacion || 0}%</td>
                              </tr>
                            ))}
                            {sec.key === 'carreras' && lista.map(c => (
                              <tr key={c.id_carrera} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-3 px-4"><span className="font-mono font-semibold text-[#701330] bg-[#701330]/5 px-2 py-0.5 rounded-full text-xs">{c.sigla || '—'}</span></td>
                                <td className="py-3 px-4"><span className="font-semibold text-gray-800">{c.nombre_carrera}</span></td>
                                <td className="py-3 px-4 text-gray-600">{c.email_contacto || '—'}</td>
                                <td className="py-3 px-4 text-gray-700">{c.total_usuarios || 0}</td>
                              </tr>
                            ))}
                            {sec.key === 'usuarios' && lista.map(u => (
                              <tr key={u.id_usuario} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-3 px-4"><span className="font-semibold text-gray-800">{u.nombre || '—'}</span></td>
                                <td className="py-3 px-4 text-gray-600">{u.email_institucional || '—'}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    u.rol === 'superadmin' ? 'bg-amber-100 text-amber-700' :
                                    u.rol === 'director' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                  }`}>{u.rol || '—'}</span>
                                </td>
                                <td className="py-3 px-4 text-gray-600">{u.nombre_carrera || '—'}</td>
                              </tr>
                            ))}
                            {sec.key === 'docentes' && lista.map(d => (
                              <tr key={d.id_docente} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-3 px-4"><span className="font-semibold text-gray-800">{d.nombre || '—'}</span></td>
                                <td className="py-3 px-4"><span className="font-mono text-xs text-[#701330]">{d.sigla || '—'}</span></td>
                                <td className="py-3 px-4 text-gray-600">{d.profesion || '—'}</td>
                                <td className="py-3 px-4 text-gray-600">{d.departamento || '—'}</td>
                                <td className="py-3 px-4 text-gray-600">{d.email || '—'}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${d.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {d.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {sec.key === 'materias' && lista.map(m => (
                              <tr key={m.id_materia} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-3 px-4"><span className="font-mono font-semibold text-[#701330] bg-[#701330]/5 px-2 py-0.5 rounded-full text-xs">{m.sigla || '—'}</span></td>
                                <td className="py-3 px-4"><span className="font-semibold text-gray-800">{m.nombre_materia}</span></td>
                                <td className="py-3 px-4 text-gray-600">{m.nombre_plan || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer del reporte */}
        <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
          <p>Historial generado por SIGAE UTVT • {new Date().toLocaleDateString('es-MX')}</p>
          <p className="mt-0.5">Reservas del horario, solicitudes de espacios y catálogos del sistema • {textoPeriodo()}</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @media print {
          body * { visibility: hidden; }
          .reporte-imprimible, .reporte-imprimible * { visibility: visible; }
          .reporte-imprimible { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; background: white !important; }
          .reporte-imprimible > * { box-shadow: none !important; border-color: #ddd !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}