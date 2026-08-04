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
    if (estado === 'Ocupado') return 'bg-red-100 text-red-700';
    if (estado === 'Parcial') return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="reporte-imprimible p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="no-print flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#701330]">Reporte de Ocupación de Aulas</h2>
          <p className="text-sm text-gray-500 mt-1">
            {esDirector ? 'Reporte limitado a los edificios y plantas asignados a tu gestión' : 'Reporte general del campus'}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / PDF
        </button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#701330] border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Encabezado del reporte */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 print:mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <img src="/logoUtvt.png" alt="UTVT" className="h-12 w-auto" onError={(e) => { e.target.style.display = 'none'; }} />
                <div>
                  <p className="text-lg font-bold text-[#701330]">SIGAE UTVT</p>
                  <p className="text-sm text-gray-500">Reporte de Ocupación de Aulas</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-500">Generado por: <span className="font-medium text-gray-800">{usuario?.nombre}</span></p>
                <p className="text-gray-500">{usuario?.rol === 'superadmin' ? 'Super Administrador' : 'Director de Carrera'}</p>
                <p className="text-gray-400 mt-1 capitalize">{fechaReporte}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500">Aulas</p>
                <p className="text-2xl font-bold text-gray-800">{totalAulas}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                <p className="text-xs text-green-600">Libres</p>
                <p className="text-2xl font-bold text-green-600">{libres}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-600">Parciales</p>
                <p className="text-2xl font-bold text-amber-600">{parciales}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs text-red-600">Ocupadas</p>
                <p className="text-2xl font-bold text-red-600">{ocupadas}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#701330]/5 border border-[#701330]/10">
                <p className="text-xs text-[#701330]">Ocupación general</p>
                <p className="text-2xl font-bold text-[#701330]">{porcentajeGeneral}%</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-600">Bloques usados</p>
                <p className="text-2xl font-bold text-blue-600">{bloquesUsados}<span className="text-sm font-normal text-blue-400">/{bloquesTotales}</span></p>
              </div>
            </div>
          </div>

          {/* Tabla del reporte */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:p-0 print:border-0 print:shadow-none">
            <h3 className="text-lg font-semibold mb-4">Detalle por Aula</h3>
            {aulas.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                {esDirector ? 'No tienes aulas asignadas en este momento' : 'No hay aulas registradas'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                      <th className="py-3 pr-4">Edificio</th>
                      <th className="py-3 pr-4">Aula</th>
                      <th className="py-3 pr-4">Planta</th>
                      <th className="py-3 pr-4 text-right">Capacidad</th>
                      <th className="py-3 pr-4 text-right">Bloques</th>
                      <th className="py-3 pr-4 text-right">Ocupación</th>
                      <th className="py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aulas.map(a => (
                      <tr key={a.id_aula} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="py-3 pr-4 text-gray-700">{a.nombre_edificio}</td>
                        <td className="py-3 pr-4 font-medium text-gray-800">{a.nombre_aula}</td>
                        <td className="py-3 pr-4 capitalize text-gray-600">{a.planta}</td>
                        <td className="py-3 pr-4 text-right text-gray-700">{a.capacidad}</td>
                        <td className="py-3 pr-4 text-right text-gray-700">{a.asignaciones || 0}<span className="text-gray-400">/{a.total_bloques || 85}</span></td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${a.porcentaje_ocupacion >= 80 ? 'bg-red-500' : a.porcentaje_ocupacion >= 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, a.porcentaje_ocupacion || 0)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-800">{a.porcentaje_ocupacion || 0}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge(a.estado)}`}>
                            {a.estado}
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

      <style>{`
        @media print {
          .reporte-imprimible { background: white !important; padding: 0 !important; }
          .reporte-imprimible > * { box-shadow: none !important; border-color: #ddd !important; }
        }
        @media print {
          body * { visibility: hidden; }
          .reporte-imprimible, .reporte-imprimible * { visibility: visible; }
          .reporte-imprimible { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
