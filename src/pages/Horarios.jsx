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
    <div className="bg-gray-50 min-h-screen w-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <nav className="text-sm text-gray-500 mb-2">
            <span>SIGAE</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-700">Horarios</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Horarios</h1>
          <p className="text-gray-500 mt-1">Selecciona un aula para ver o editar su horario</p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {cargando ? (
          <div className="py-20 text-center text-gray-500 animate-pulse">Cargando aulas...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {aulas.map(aula => (
              <div
                key={aula.id_aula}
                onClick={() => setAulaSeleccionada(aula)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200"
              >
                <h3 className="text-lg font-bold text-gray-900">{aula.nombre_aula}</h3>
                <p className="text-sm text-gray-500 mt-2">Planta {aula.planta} • {aula.nombre_edificio}</p>
                <div className="mt-3">
                  {puedeEditarAula(aula) ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Editar horario
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      Solo ver / solicitar
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}