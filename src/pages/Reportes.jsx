import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Reportes() {
  const { usuario } = useAuth();
  const [aulas, setAulas] = useState([]);
  const [edificiosPermitidos, setEdificiosPermitidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [esDirector] = useState(usuario?.rol === 'director');

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const [resAulas] = await Promise.all([
          api.get('/api/infraestructura/aulas-estado')
        ]);

        let lista = resAulas.data || [];

        if (usuario?.rol === 'director') {
          const resAsig = await api.get(`/api/director/${usuario.id_usuario}/edificios`);
          setEdificiosPermitidos(resAsig.data || []);
          const ids = new Set((resAsig.data || []).map(e => String(e.id_edificio)));
          lista = lista.filter(a => {
            const asig = (resAsig.data || []).find(e => String(e.id_edificio) === String(a.id_edificio));
            if (!asig) return false;
            return ids.has(String(a.id_edificio)) && (asig.plantas === 'ambas' || asig.plantas === a.planta);
          });
        }

        setAulas(lista);
      } catch (err) {
        console.error('Error cargando reporte:', err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [usuario]);

  const totalAulas = aulas.length;
  const libres = aulas.filter(a => a.estado === 'Libre').length;
  const parciales = aulas.filter(a => a.estado === 'Parcial').length;
  const ocupadas = aulas.filter(a => a.estado === 'Ocupado').length;
  const sumaPorcentajes = aulas.reduce((acc, a) => acc + (a.porcentaje_ocupacion || 0), 0);
  const porcentajeGeneral = totalAulas > 0 ? Math.round(sumaPorcentajes / totalAulas) : 0;
  const bloquesUsados = aulas.reduce((acc, a) => acc + (a.asignaciones || 0), 0);
  const bloquesTotales = aulas.reduce((acc, a) => acc + (a.total_bloques || 0), 0);

  const fechaReporte = new Date().toLocaleString('es-MX', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const estadoBadge = (estado) => {
    if (estado === 'Ocupado') return 'bg-red-100 text-red-700 border-red-200';
    if (estado === 'Parcial') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const estadoIcon = (estado) => {
    if (estado === 'Ocupado') return '🔴';
    if (estado === 'Parcial') return '🟡';
    return '🟢';
  };

  return (
    <div className="reporte-imprimible min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Barra de herramientas */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 sm:p-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#701330]/10 rounded-xl">
                <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#701330] tracking-tight">Reporte de Ocupación</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {esDirector ? 'Limitado a tus edificios y plantas asignadas' : 'Reporte general'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Imprimir / PDF</span>
          </button>
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-2xl shadow-sm border border-gray-100/80">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#701330] border-t-transparent"></div>
            <p className="mt-4 text-gray-500 font-medium">Generando reporte...</p>
          </div>
        ) : (
          <>
            {/* Encabezado del reporte */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 sm:p-6 lg:p-8 mb-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                  <img 
                    src="/logoUtvt.png" 
                    alt="UTVT" 
                    className="h-10 sm:h-14 w-auto object-contain" 
                    onError={(e) => { e.target.style.display = 'none'; }} 
                  />
                  <div>
                    <p className="text-base sm:text-lg font-bold text-[#701330]">SIGAE UTVT</p>
                    <p className="text-xs sm:text-sm text-gray-500">Reporte de Ocupación de Aulas</p>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs sm:text-sm w-full sm:w-auto">
                  <p className="text-gray-500">
                    Generado por: <span className="font-medium text-gray-800">{usuario?.nombre || 'Usuario'}</span>
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {usuario?.rol === 'superadmin' ? 'Super Administrador' : 'Director de Carrera'}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 capitalize">{fechaReporte}</p>
                </div>
              </div>

              {/* Tarjetas de métricas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-5">
                <div className="group p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#701330]/20 hover:shadow-md transition-all duration-300">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Aulas</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{totalAulas}</p>
                </div>
                <div className="group p-3 sm:p-4 rounded-xl bg-green-50 border border-green-100 hover:border-green-300 hover:shadow-md transition-all duration-300">
                  <p className="text-xs text-green-600 font-medium uppercase tracking-wider">Libres</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{libres}</p>
                  <p className="text-xs text-green-500 mt-0.5">{totalAulas > 0 ? Math.round((libres / totalAulas) * 100) : 0}%</p>
                </div>
                <div className="group p-3 sm:p-4 rounded-xl bg-amber-50 border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all duration-300">
                  <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">Parciales</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">{parciales}</p>
                  <p className="text-xs text-amber-500 mt-0.5">{totalAulas > 0 ? Math.round((parciales / totalAulas) * 100) : 0}%</p>
                </div>
                <div className="group p-3 sm:p-4 rounded-xl bg-red-50 border border-red-100 hover:border-red-300 hover:shadow-md transition-all duration-300">
                  <p className="text-xs text-red-600 font-medium uppercase tracking-wider">Ocupadas</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{ocupadas}</p>
                  <p className="text-xs text-red-500 mt-0.5">{totalAulas > 0 ? Math.round((ocupadas / totalAulas) * 100) : 0}%</p>
                </div>
                <div className="group p-3 sm:p-4 rounded-xl bg-[#701330]/5 border border-[#701330]/10 hover:border-[#701330]/30 hover:shadow-md transition-all duration-300">
                  <p className="text-xs text-[#701330] font-medium uppercase tracking-wider">Ocupación</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#701330] mt-1">{porcentajeGeneral}%</p>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        porcentajeGeneral >= 80 ? 'bg-red-500' : 
                        porcentajeGeneral >= 40 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${porcentajeGeneral}%` }}
                    />
                  </div>
                </div>
                <div className="group p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Bloques usados</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                    {bloquesUsados}
                    <span className="text-base sm:text-lg font-normal text-blue-400">/{bloquesTotales}</span>
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5">{bloquesTotales > 0 ? Math.round((bloquesUsados / bloquesTotales) * 100) : 0}% utilizado</p>
                </div>
              </div>
            </div>

            {/* Tabla del reporte */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span></span> Detalle por Aula
                    <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {aulas.length} registros
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Libre</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Parcial</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Ocupado</span>
                </div>
              </div>

              {aulas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6M9 11h6M9 15h4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">
                    {esDirector ? 'No tienes aulas asignadas en este momento' : 'No hay aulas registradas'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {esDirector ? 'Contacta al administrador para obtener asignaciones' : 'Agrega aulas en el módulo de infraestructura'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b-2 border-gray-200">
                        <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <span className="flex items-center gap-1">Edificio</span>
                        </th>
                        <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <span className="flex items-center gap-1">Aula</span>
                        </th>
                        <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">
                          <span className="flex items-center gap-1">Planta</span>
                        </th>
                        <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                          <span className="flex items-center justify-end gap-1">Capacidad</span>
                        </th>
                        <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                          <span className="flex items-center justify-end gap-1">Bloques</span>
                        </th>
                        <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <span className="flex items-center justify-end gap-1">Ocupación</span>
                        </th>
                        <th className="py-3.5 px-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <span className="flex items-center justify-center gap-1">Estado</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {aulas.map((a, index) => (
                        <tr 
                          key={a.id_aula} 
                          className="hover:bg-gray-50/80 transition-colors duration-150 group"
                        >
                          <td className="py-3.5 px-4">
                            <span className="text-gray-700 font-medium">{a.nombre_edificio}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-gray-800 font-semibold">{a.nombre_aula}</span>
                          </td>
                          <td className="py-3.5 px-4 capitalize text-gray-500 hidden sm:table-cell">
                            <span className="inline-flex items-center gap-1">
                              <span className="text-xs"></span> {a.planta}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-600 hidden md:table-cell">
                            <span className="font-medium">{a.capacidad}</span>
                            <span className="text-gray-400 text-xs ml-0.5">lug</span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-600 hidden lg:table-cell">
                            <span className="font-medium">{a.asignaciones || 0}</span>
                            <span className="text-gray-400 text-xs">/{a.total_bloques || 85}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-3">
                              <div className="w-16 sm:w-20 md:w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    a.porcentaje_ocupacion >= 80 ? 'bg-red-500' : 
                                    a.porcentaje_ocupacion >= 40 ? 'bg-amber-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(100, a.porcentaje_ocupacion || 0)}%` }}
                                />
                              </div>
                              <span className={`font-bold text-sm min-w-[44px] text-right ${
                                a.porcentaje_ocupacion >= 80 ? 'text-red-600' : 
                                a.porcentaje_ocupacion >= 40 ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                {a.porcentaje_ocupacion || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${estadoBadge(a.estado)}`}>
                              <span>{estadoIcon(a.estado)}</span>
                              <span className="hidden sm:inline">{a.estado}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer del reporte */}
            <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
              <p>Reporte generado por SIGAE UTVT • {new Date().toLocaleDateString('es-MX')}</p>
              <p className="mt-0.5">Este reporte muestra información en tiempo real de la ocupación de aulas</p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          .reporte-imprimible { 
            background: white !important; 
            padding: 0 !important; 
          }
          .reporte-imprimible > * { 
            box-shadow: none !important; 
            border-color: #ddd !important; 
          }
          .reporte-imprimible .rounded-2xl { 
            border-radius: 0 !important; 
          }
          .reporte-imprimible .border { 
            border-color: #e5e7eb !important; 
          }
          .reporte-imprimible .shadow-sm,
          .reporte-imprimible .shadow-md,
          .reporte-imprimible .shadow-lg { 
            box-shadow: none !important; 
          }
          .reporte-imprimible .hover\\:shadow-md,
          .reporte-imprimible .hover\\:shadow-lg { 
            box-shadow: none !important; 
          }
          .reporte-imprimible .hover\\:border-\\[\\#701330\\]\\/20,
          .reporte-imprimible .hover\\:border-green-300,
          .reporte-imprimible .hover\\:border-amber-300,
          .reporte-imprimible .hover\\:border-red-300,
          .reporte-imprimible .hover\\:border-blue-300 { 
            border-color: #e5e7eb !important; 
          }
          .reporte-imprimible .hover\\:-translate-y-0\\.5 { 
            transform: none !important; 
          }
          .reporte-imprimible .transition-all,
          .reporte-imprimible .duration-300,
          .reporte-imprimible .duration-700 { 
            transition: none !important; 
          }
          .reporte-imprimible .group:hover .group-hover\\:scale-110 { 
            transform: none !important; 
          }
        }
        @media print {
          body * { visibility: hidden; }
          .reporte-imprimible, .reporte-imprimible * { visibility: visible; }
          .reporte-imprimible { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            max-width: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}