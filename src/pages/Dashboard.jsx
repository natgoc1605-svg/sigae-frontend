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
      
      // Calcular el promedio de porcentajes de ocupación de las aulas
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

  // Gráfica de porcentaje de ocupación por edificio (la principal)
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
        borderRadius: 6,
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
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
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
        ticks: { callback: v => `${v}%`, stepSize: 20 },
        grid: { color: 'rgba(0,0,0,0.06)' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: 'bold' } }
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
      borderColor: '#ffffff',
      cutout: '72%'
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
          font: { size: 12, weight: 'bold' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
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
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#701330] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className={`transition-all duration-700 ease-out ${animar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        <h1 className="text-2xl md:text-3xl font-bold text-[#701330]">SIGAE - Panel de Control</h1>
        <p className="text-gray-600 mt-1">Información en tiempo real • Última actualización: {new Date().toLocaleTimeString('es-MX')}</p>
      </div>

      {/* Tarjetas de métricas con navegación a filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer" onClick={() => irAInfraestructura(null)}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#701330]/10 rounded-xl">
              <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total espacios</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{estadisticas.totalEspacios}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#701330] rounded-full" style={{ width: '100%' }} />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{edificios.length} edificios</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer" onClick={() => irAInfraestructura('Libre')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-green-500">Disponibles</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{estadisticas.disponibles}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${estadisticas.totalEspacios > 0 ? Math.round((estadisticas.disponibles / estadisticas.totalEspacios) * 100) : 0}%` }} />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{estadisticas.totalEspacios > 0 ? `${Math.round((estadisticas.disponibles / estadisticas.totalEspacios) * 100)}%` : '0%'}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer" onClick={() => irAInfraestructura('Parcial')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Uso Parcial</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{estadisticas.usoParcial}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${estadisticas.totalEspacios > 0 ? Math.round((estadisticas.usoParcial / estadisticas.totalEspacios) * 100) : 0}%` }} />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{estadisticas.totalEspacios > 0 ? `${Math.round((estadisticas.usoParcial / estadisticas.totalEspacios) * 100)}%` : '0%'}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer" onClick={() => irAInfraestructura('Ocupado')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">Ocupados</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{estadisticas.ocupados}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${estadisticas.totalEspacios > 0 ? Math.round((estadisticas.ocupados / estadisticas.totalEspacios) * 100) : 0}%` }} />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{estadisticas.totalEspacios > 0 ? `${Math.round((estadisticas.ocupados / estadisticas.totalEspacios) * 100)}%` : '0%'}</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Porcentaje de Ocupación por Edificio</h3>
          <div className="h-72">
            {ocupacionPorEdificio.length > 0 ? (
              <Bar data={datosBarrasPorcentaje} options={opcionesBarrasPorcentaje} />
            ) : (
              <p className="text-gray-500 text-center py-16">Sin datos de edificios</p>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Bajo (&lt;50%)</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Medio (50-79%)</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Alto (≥80%)</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Distribución Global</h3>
          <div className="h-52 flex items-center justify-center">
            {estadisticas.totalEspacios > 0 ? (
              <Doughnut data={datosCircular} options={opcionesCircular} />
            ) : (
              <p className="text-gray-500">Sin datos disponibles</p>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Disponibles</span>
              <span className="font-semibold">{estadisticas.disponibles} ({estadisticas.totalEspacios > 0 ? Math.round((estadisticas.disponibles / estadisticas.totalEspacios) * 100) : 0}%)</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Uso Parcial</span>
              <span className="font-semibold">{estadisticas.usoParcial} ({estadisticas.totalEspacios > 0 ? Math.round((estadisticas.usoParcial / estadisticas.totalEspacios) * 100) : 0}%)</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Ocupados</span>
              <span className="font-semibold">{estadisticas.ocupados} ({estadisticas.totalEspacios > 0 ? Math.round((estadisticas.ocupados / estadisticas.totalEspacios) * 100) : 0}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listas de espacios con apertura directa de horario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Espacios con Alta Demanda ({altaDemanda.length})
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {altaDemanda.length > 0 ? altaDemanda.map(a => (
              <div
                key={a.id_aula}
                className="space-y-1 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                onClick={() => irAInfraestructura(null, a)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{a.nombre_aula}</span>
                  <span className="text-red-600 font-bold text-sm">{a.porcentaje_ocupacion || 0}%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{edificios.find(e => e.id_edificio === a.id_edificio)?.nombre_edificio || '-'}</span>
                  <span>{a.capacidad || 0} lugares • Planta {a.planta}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{width: `${a.porcentaje_ocupacion || 0}%`}} />
                </div>
              </div>
            )) : <p className="text-gray-500 text-center py-8">No hay espacios en alta demanda</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Espacios Disponibles ({espaciosLibres.length})
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {espaciosLibres.length > 0 ? espaciosLibres.map(a => (
              <div
                key={a.id_aula}
                className="space-y-1 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                onClick={() => irAInfraestructura(null, a)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{a.nombre_aula}</span>
                  <span className="text-green-600 font-bold text-sm">0%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{edificios.find(e => e.id_edificio === a.id_edificio)?.nombre_edificio || '-'}</span>
                  <span>{a.capacidad || 0} lugares • Planta {a.planta}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{width: '0%'}} />
                </div>
              </div>
            )) : <p className="text-gray-500 text-center py-8">No hay espacios disponibles</p>}
          </div>
        </div>
      </div>

      {/* Módulos del Sistema */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Módulos del Sistema</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <button onClick={() => navigate('/infraestructura')} className="p-4 bg-gray-50 hover:bg-[#701330]/5 rounded-lg border border-gray-200 text-left transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
              <p className="font-medium text-sm">Infraestructura</p>
            </div>
            <p className="text-xs text-gray-500">Edificios y aulas</p>
          </button>
          <button onClick={() => navigate('/solicitudes')} className="p-4 bg-gray-50 hover:bg-[#701330]/5 rounded-lg border border-gray-200 text-left transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="font-medium text-sm">Solicitudes</p>
            </div>
            <p className="text-xs text-gray-500">Gestionar solicitudes</p>
          </button>
          <button onClick={() => navigate('/horarios')} className="p-4 bg-gray-50 hover:bg-[#701330]/5 rounded-lg border border-gray-200 text-left transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-medium text-sm">Horarios</p>
            </div>
            <p className="text-xs text-gray-500">Ver y editar</p>
          </button>
          <button onClick={() => navigate('/reportes')} className="p-4 bg-gray-50 hover:bg-[#701330]/5 rounded-lg border border-gray-200 text-left transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="font-medium text-sm">Reportes</p>
            </div>
            <p className="text-xs text-gray-500">Estadísticas</p>
          </button>
          {esSuperAdmin && (
            <button onClick={() => navigate('/configuracion')} className="p-4 bg-gray-50 hover:bg-[#701330]/5 rounded-lg border border-gray-200 text-left transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="font-medium text-sm">Configuración</p>
              </div>
              <p className="text-xs text-gray-500">Usuarios y ajustes</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}