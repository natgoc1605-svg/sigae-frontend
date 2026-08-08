import { useState, useEffect } from 'react';
import api from '../api/axios';
import HorarioAula from '../components/HorarioAula';
import { hasPermission, ROLES } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

export default function Horarios() {
  const { usuario } = useAuth();
  const [aulas, setAulas] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [edificiosPermitidos, setEdificiosPermitidos] = useState([]);

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
              {aulas.length} aula{aulas.length !== 1 ? 's' : ''}
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
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {aulas.map(aula => {
              const editable = puedeEditarAula(aula);
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
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        aula.estado === 'Libre' ? 'bg-green-500' :
                        aula.estado === 'Parcial' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}></span>
                      <span>{aula.estado || 'Sin estado'}</span>
                    </p>
                  </div>

                  {/* Barra inferior animada */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#701330] to-[#912347] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

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