import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { hasPermission, ROLES } from '../utils/auth';
import { useTema } from '../context/TemaContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { tema } = useTema();
  const esSuperAdmin = hasPermission(usuario, [ROLES.SUPER_ADMIN]);
  const [edificios, setEdificios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [animar, setAnimar] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resEdif, resAulas] = await Promise.all([
        api.get('/api/edificios'),
        api.get('/api/infraestructura/aulas-estado')
      ]);
      setEdificios(resEdif.data || []);
      setAulas(resAulas.data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setCargando(false);
      setAnimar(true);
    }
  };

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 60000);
    return () => clearInterval(intervalo);
  }, []);

  // Estadísticas generales
  const estadisticas = {
    totalEspacios: aulas.length,
    disponibles: aulas.filter(a => a.estado === 'Libre').length,
    usoParcial: aulas.filter(a => a.estado === 'Parcial').length,
    ocupados: aulas.filter(a => a.estado === 'Ocupado').length
  };

  // Ocupación por edificio: promedio de porcentajes de ocupación de cada aula
  const ocupacionPorEdificio = edificios
    .map(edif => {
      const aulasEdif = aulas.filter(a => a.id_edificio === edif.id_edificio);
      const total = aulasEdif.length;
      if (total === 0) return null;
      
      const sumaPorcentajes = aulasEdif.reduce((acc, a) => acc + (a.porcentaje_ocupacion || 0), 0);
      const porcentajePromedio = Math.round(sumaPorcentajes / total);
      
      return {
        nombre: edif.nombre_edificio,
        total,
        libres: aulasEdif.filter(a => a.estado === 'Libre').length,
        parciales: aulasEdif.filter(a => a.estado === 'Parcial').length,
        ocupadas: aulasEdif.filter(a => a.estado === 'Ocupado').length,
        porcentajeOcupacion: porcentajePromedio
      };
    })
    .filter(e => e !== null);

  // Espacios con alta demanda (>= 80%)
  const altaDemanda = aulas
    .filter(a => (a.porcentaje_ocupacion || 0) >= 80)
    .sort((a, b) => (b.porcentaje_ocupacion || 0) - (a.porcentaje_ocupacion || 0));

  // Espacios disponibles
  const espaciosLibres = aulas
    .filter(a => a.estado === 'Libre')
    .sort((a, b) => (a.porcentaje_ocupacion || 0) - (b.porcentaje_ocupacion || 0));

  // Gráfica de porcentaje de ocupación por edificio
  const datosBarrasPorcentaje = {
    labels: ocupacionPorEdificio.map(e => e.nombre),
    datasets: [
      {
        label: '% Ocupación promedio',
        data: ocupacionPorEdificio.map(e => e.porcentajeOcupacion),
        backgroundColor: ocupacionPorEdificio.map(e =>
          e.porcentajeOcupacion >= 80 ? '#dc2626' :
          e.porcentajeOcupacion >= 50 ? '#f59e0b' : '#16a34a'
        ),
        borderRadius: 8,
        borderWidth: 0,
        barPercentage: 0.7,
      },
      {
        label: 'Límite 80%',
        data: ocupacionPorEdificio.map(() => 80),
        type: 'line',
        borderColor: '#dc2626',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Límite 50%',
        data: ocupacionPorEdificio.map(() => 50),
        type: 'line',
        borderColor: '#f59e0b',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      }
    ]
  };

  const opcionesBarrasPorcentaje = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: "'Inter', system-ui, sans-serif" },
          color: tema === 'oscuro' ? '#e2e8f0' : '#1f2937'
        }
      },
      tooltip: {
        backgroundColor: tema === 'oscuro' ? '#1f2533' : 'rgba(255,255,255,0.95)',
        titleColor: tema === 'oscuro' ? '#e2e8f0' : '#1f2937',
        bodyColor: tema === 'oscuro' ? '#c6d1e2' : '#4b5563',
        borderColor: tema === 'oscuro' ? '#2f3a4f' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const edificio = ocupacionPorEdificio[context.dataIndex];
            if (context.datasetIndex === 0) {
              return [
                `Ocupación: ${context.parsed.y}%`,
                `Total: ${edificio.total} espacios`,
                `Libres: ${edificio.libres}`,
                `Parciales: ${edificio.parciales}`,
                `Ocupados: ${edificio.ocupadas}`
              ];
            }
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { 
          callback: v => `${v}%`, 
          stepSize: 20, 
          font: { size: 11 },
          color: tema === 'oscuro' ? '#9aa8c0' : '#6b7280'
        },
        grid: { 
          color: tema === 'oscuro' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', 
          drawBorder: false 
        }
      },
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 11, weight: '500' },
          color: tema === 'oscuro' ? '#9aa8c0' : '#6b7280'
        }
      }
    },
    animation: { duration: 1000, easing: 'easeOutQuart' }
  };

  // Gráfica circular
  const datosCircular = {
    labels: ['Disponibles', 'Uso Parcial', 'Ocupados'],
    datasets: [{
      data: [estadisticas.disponibles, estadisticas.usoParcial, estadisticas.ocupados],
      backgroundColor: ['#16a34a', '#f59e0b', '#dc2626'],
      borderWidth: 3,
      borderColor: tema === 'oscuro' ? '#1f2533' : '#ffffff',
      cutout: '72%',
      hoverOffset: 8
    }]
  };

  const opcionesCircular = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: '500', family: "'Inter', system-ui, sans-serif" },
          color: tema === 'oscuro' ? '#e2e8f0' : '#1f2937'
        }
      },
      tooltip: {
        backgroundColor: tema === 'oscuro' ? '#1f2533' : 'rgba(255,255,255,0.95)',
        titleColor: tema === 'oscuro' ? '#e2e8f0' : '#1f2937',
        bodyColor: tema === 'oscuro' ? '#c6d1e2' : '#4b5563',
        borderColor: tema === 'oscuro' ? '#2f3a4f' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const porcentaje = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
            return `${context.label}: ${context.parsed} (${porcentaje}%)`;
          }
        }
      }
    },
    animation: { duration: 1200, easing: 'easeOutQuart' }
  };

  // Navegación con filtros
  const irAInfraestructura = (filtroEstado = null, aula = null) => {
    navigate('/infraestructura', { state: { filtroEstado, aulaSeleccionada: aula } });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-[80vh] bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#701330] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${tema === 'oscuro' ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/50'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className={`transition-all duration-700 ease-out ${animar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#701330] dark:text-[#e59daa] tracking-tight">
                SIGAE - Panel de Control
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Información en tiempo real • Última actualización: {new Date().toLocaleTimeString('es-MX')}
              </p>
            </div>
            <button
              onClick={cargarDatos}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#701330] dark:text-[#e59daa] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-[#701330]/30 dark:hover:border-[#e59daa]/30 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>

          {/* Tarjetas de métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6 mb-6">
            {[
              { label: 'Total espacios', value: estadisticas.totalEspacios, color: '[#701330]', icon: 'building', onClick: () => irAInfraestructura(null), bg: 'bg-[#701330]/10 dark:bg-[#701330]/20' },
              { label: 'Disponibles', value: estadisticas.disponibles, color: 'green', icon: 'check', onClick: () => irAInfraestructura('Libre'), bg: 'bg-green-100 dark:bg-green-900/30' },
              { label: 'Uso Parcial', value: estadisticas.usoParcial, color: 'amber', icon: 'clock', onClick: () => irAInfraestructura('Parcial'), bg: 'bg-amber-100 dark:bg-amber-900/30' },
              { label: 'Ocupados', value: estadisticas.ocupados, color: 'red', icon: 'x', onClick: () => irAInfraestructura('Ocupado'), bg: 'bg-red-100 dark:bg-red-900/30' }
            ].map((item, index) => {
              const porcentaje = estadisticas.totalEspacios > 0 ? Math.round((item.value / estadisticas.totalEspacios) * 100) : 0;
              const colorMap = {
                green: 'text-green-600 dark:text-green-400',
                amber: 'text-amber-600 dark:text-amber-400',
                red: 'text-red-600 dark:text-red-400',
                '[#701330]': 'text-[#701330] dark:text-[#e59daa]'
              };
              const bgMap = {
                green: 'bg-green-500',
                amber: 'bg-amber-500',
                red: 'bg-red-500',
                '[#701330]': 'bg-[#701330] dark:bg-[#e59daa]'
              };
              const iconMap = {
                building: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                ),
                check: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                clock: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                x: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                )
              };
              return (
                <div
                  key={index}
                  onClick={item.onClick}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100/80 dark:border-gray-700/80 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl ${item.bg} group-hover:scale-110 transition-transform duration-300`}>
                      <svg className={`w-5 h-5 ${colorMap[item.color]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {iconMap[item.icon]}
                      </svg>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {item.label}
                    </span>
                  </div>
                  <p className={`text-3xl font-bold ${colorMap[item.color]}`}>
                    {item.value}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${bgMap[item.color]} rounded-full transition-all duration-700 ease-out`} 
                        style={{ width: `${porcentaje}%` }} 
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
                      {porcentaje}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100/80 dark:border-gray-700/80 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Porcentaje de Ocupación por Edificio</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">Promedio</span>
              </div>
              <div className="h-64 sm:h-72">
                {ocupacionPorEdificio.length > 0 ? (
                  <Bar data={datosBarrasPorcentaje} options={opcionesBarrasPorcentaje} />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-16">Sin datos de edificios</p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Bajo (&lt;50%)</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Medio (50-79%)</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Alto (≥80%)</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100/80 dark:border-gray-700/80 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">Distribución Global</h3>
              <div className="h-48 sm:h-52 flex items-center justify-center">
                {estadisticas.totalEspacios > 0 ? (
                  <Doughnut data={datosCircular} options={opcionesCircular} />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Sin datos disponibles</p>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between items-center p-2.5 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span className="w-3 h-3 rounded-full bg-green-500"></span> Disponibles</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{estadisticas.disponibles} ({estadisticas.totalEspacios > 0 ? Math.round((estadisticas.disponibles / estadisticas.totalEspacios) * 100) : 0}%)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Uso Parcial</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{estadisticas.usoParcial} ({estadisticas.totalEspacios > 0 ? Math.round((estadisticas.usoParcial / estadisticas.totalEspacios) * 100) : 0}%)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span className="w-3 h-3 rounded-full bg-red-500"></span> Ocupados</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{estadisticas.ocupados} ({estadisticas.totalEspacios > 0 ? Math.round((estadisticas.ocupados / estadisticas.totalEspacios) * 100) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Listas de espacios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100/80 dark:border-gray-700/80 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Espacios con Alta Demanda
                </h3>
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {altaDemanda.length}
                </span>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {altaDemanda.length > 0 ? altaDemanda.map(a => (
                  <div
                    key={a.id_aula}
                    className="group p-3.5 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/60 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => irAInfraestructura(null, a)}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-medium text-sm text-gray-800 dark:text-gray-200 group-hover:text-[#701330] dark:group-hover:text-[#e59daa] transition-colors">
                        {a.nombre_aula}
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-bold text-sm bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">
                        {a.porcentaje_ocupacion || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{edificios.find(e => e.id_edificio === a.id_edificio)?.nombre_edificio || '-'}</span>
                      <span>{a.capacidad || 0} lugares • Planta {a.planta}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all duration-700 ease-out" 
                        style={{width: `${a.porcentaje_ocupacion || 0}%`}} 
                      />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">No hay espacios en alta demanda</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100/80 dark:border-gray-700/80 p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Espacios Disponibles
                </h3>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {espaciosLibres.length}
                </span>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {espaciosLibres.length > 0 ? espaciosLibres.map(a => (
                  <div
                    key={a.id_aula}
                    className="group p-3.5 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/60 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => irAInfraestructura(null, a)}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-medium text-sm text-gray-800 dark:text-gray-200 group-hover:text-[#701330] dark:group-hover:text-[#e59daa] transition-colors">
                        {a.nombre_aula}
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-bold text-sm bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-lg">
                        0%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{edificios.find(e => e.id_edificio === a.id_edificio)?.nombre_edificio || '-'}</span>
                      <span>{a.capacidad || 0} lugares • Planta {a.planta}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-700 ease-out" style={{width: '0%'}} />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">No hay espacios disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Módulos del Sistema */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100/80 dark:border-gray-700/80 p-4 sm:p-6 mt-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Módulos del Sistema</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">Navegación rápida</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {[
                { path: '/infraestructura', label: 'Infraestructura', desc: 'Edificios y aulas', icon: 'building' },
                { path: '/solicitudes', label: 'Solicitudes', desc: 'Gestionar solicitudes', icon: 'file' },
                { path: '/horarios', label: 'Horarios', desc: 'Ver y editar', icon: 'calendar' },
                { path: '/reportes', label: 'Reportes', desc: 'Estadísticas', icon: 'chart' },
                ...(esSuperAdmin ? [{ path: '/configuracion', label: 'Configuración', desc: 'Usuarios y ajustes', icon: 'settings' }] : [])
              ].map((modulo) => {
                const iconMap = {
                  building: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  ),
                  file: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  ),
                  calendar: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  ),
                  chart: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  ),
                  settings: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )
                };
                return (
                  <button
                    key={modulo.path}
                    onClick={() => navigate(modulo.path)}
                    className="group p-4 bg-gray-50/80 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#701330]/20 dark:hover:border-[#e59daa]/20 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 bg-white dark:bg-gray-600 rounded-lg group-hover:bg-[#701330]/5 dark:group-hover:bg-[#e59daa]/10 transition-colors duration-300">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-[#701330] dark:group-hover:text-[#e59daa] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {iconMap[modulo.icon]}
                        </svg>
                      </div>
                      <p className="font-medium text-sm text-gray-700 dark:text-gray-200 group-hover:text-[#701330] dark:group-hover:text-[#e59daa] transition-colors duration-300">
                        {modulo.label}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 pl-1">{modulo.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}