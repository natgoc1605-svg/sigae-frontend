import { useState, useEffect } from 'react';
import api from '../api/axios';
import { hasPermission, ROLES } from '../utils/auth';
import Confirmar from '../components/Confirmar';
import ToastLocal from '../components/ToastLocal';

export default function PlanesEducativos() {
  const [lista, setLista] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [modal, setModal] = useState({ abierto: false, datos: null });
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: 'error', mensaje: '' });
  const puedeEditar = hasPermission(["superadmin", "director"]);

  const mostrarAlerta = (tipo, mensaje) => setAlerta({ mostrar: true, tipo, mensaje });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resPlanes, resCarreras] = await Promise.all([
        api.get('/api/planes-educativos'),
        api.get('/api/carreras')
      ]);
      setLista(resPlanes.data || []);
      setCarreras(resCarreras.data || []);
    } catch (err) {
      console.error('Error cargando planes:', err);
      mostrarAlerta('error', 'No se pudo cargar la lista de planes');
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datos = {
      nombre_plan: formData.get('nombre_plan'),
      id_carrera: Number(formData.get('id_carrera'))
    };

    try {
      if (modal.datos) {
        await api.put(`/api/planes-educativos/${modal.datos.id_plan}`, datos);
      } else {
        await api.post('/api/planes-educativos', datos);
      }
      setModal({ abierto: false, datos: null });
      cargarDatos();
    } catch (err) {
      console.error('Error guardando:', err);
      mostrarAlerta('error', err.response?.data?.detail || 'Error al guardar el plan');
    }
  };

  const eliminar = async (id) => {
    setConfirmarEliminar(id);
  };

  const confirmarBorrar = async () => {
    if (!confirmarEliminar || eliminando) return;
    setEliminando(true);
    try {
      await api.delete(`/api/planes-educativos/${confirmarEliminar}`);
      setConfirmarEliminar(null);
      cargarDatos();
    } catch (err) {
      console.error('Error eliminando:', err);
      mostrarAlerta('error', err.response?.data?.detail || 'No se puede eliminar el plan');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#701330]">Gestión de Planes Educativos</h2>
          <p className="text-sm text-gray-500 mt-1">Catálogo de planes por carrera</p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => setModal({ abierto: true, datos: null })}
            className="px-4 py-2 bg-[#701330] hover:bg-[#912347] text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Plan
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Nombre del Plan</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Carrera</th>
                {puedeEditar && <th className="p-4 text-right text-sm font-semibold text-gray-700">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={puedeEditar ? 4 : 3} className="p-4 text-center text-gray-500">No hay planes registrados</td>
                </tr>
              ) : (
                lista.map(plan => (
                  <tr key={plan.id_plan} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="p-4 text-sm text-gray-500">{plan.id_plan}</td>
                    <td className="p-4 font-medium text-gray-800">{plan.nombre_plan}</td>
                    <td className="p-4 text-sm text-gray-600">{plan.nombre_carrera}</td>
                    {puedeEditar && (
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setModal({ abierto: true, datos: plan })}
                            className="px-3 py-1.5 text-xs font-medium text-[#701330] bg-[#701330]/5 hover:bg-[#701330]/10 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminar(plan.id_plan)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario */}
      {modal.abierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modal.datos ? 'Editar Plan' : 'Nuevo Plan Educativo'}</h3>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan:</label>
                <input
                  type="text"
                  name="nombre_plan"
                  defaultValue={modal.datos?.nombre_plan || ''}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrera:</label>
                <select
                  name="id_carrera"
                  defaultValue={modal.datos?.id_carrera || ''}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 bg-white text-sm"
                >
                  <option value="">Seleccione una carrera</option>
                  {carreras.map(c => (
                    <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ abierto: false, datos: null })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-[#701330] hover:bg-[#912347]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Confirmar
        abierto={!!confirmarEliminar}
        titulo="Eliminar plan"
        mensaje="¿Estás seguro de eliminar este plan educativo?"
        textoConfirmar="Sí, eliminar"
        cargando={eliminando}
        onCancelar={() => setConfirmarEliminar(null)}
        onConfirmar={confirmarBorrar}
      />
      <ToastLocal alerta={alerta} onCerrar={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })} />
    </div>
  );
}