import { useState, useEffect } from 'react';
import api from '../api/axios';
import { hasPermission, ROLES } from '../utils/auth';
import Confirmar from '../components/Confirmar';
import ToastLocal from '../components/ToastLocal';

export default function Materias() {
  const [lista, setLista] = useState([]);
  const [planes, setPlanes] = useState([]);
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
      const [resMat, resPlanes] = await Promise.all([
        api.get('/api/materias'),
        api.get('/api/planes-educativos')
      ]);
      setLista(resMat.data || []);
      setPlanes(resPlanes.data || []);
    } catch (err) {
      console.error('Error cargando materias:', err);
      mostrarAlerta('error', 'No se pudo cargar la lista de materias');
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datos = {
      nombre_materia: formData.get('nombre_materia'),
      id_plan: Number(formData.get('id_plan')),
      color: formData.get('color') || '#701330',
      sigla: formData.get('sigla') || null
    };

    try {
      if (modal.datos) {
        await api.put(`/api/materias/${modal.datos.id_materia}`, datos);
      } else {
        await api.post('/api/materias', datos);
      }
      setModal({ abierto: false, datos: null });
      cargarDatos();
    } catch (err) {
      console.error('Error guardando materia:', err);
      mostrarAlerta('error', err.response?.data?.detail || 'Error al guardar la materia');
    }
  };

  const eliminar = async (id) => {
    setConfirmarEliminar(id);
  };

  const confirmarBorrar = async () => {
    if (!confirmarEliminar || eliminando) return;
    setEliminando(true);
    try {
      await api.delete(`/api/materias/${confirmarEliminar}`);
      setConfirmarEliminar(null);
      cargarDatos();
    } catch (err) {
      console.error('Error eliminando:', err);
      mostrarAlerta('error', err.response?.data?.detail || 'No se puede eliminar la materia');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#701330]">Gestión de Materias</h2>
          <p className="text-sm text-gray-500 mt-1">Catálogo de materias y su plan educativo</p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => setModal({ abierto: true, datos: null })}
            className="px-4 py-2 bg-[#701330] hover:bg-[#912347] text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Materia
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Sigla</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Plan Educativo</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Color</th>
                {puedeEditar && <th className="p-4 text-right text-sm font-semibold text-gray-700">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={puedeEditar ? 5 : 4} className="p-4 text-center text-gray-500">No hay materias registradas</td>
                </tr>
              ) : (
                lista.map(m => (
                  <tr key={m.id_materia} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="p-4 text-sm text-gray-500">{m.id_materia}</td>
                    <td className="p-4 font-medium text-gray-800">{m.nombre_materia}</td>
                    <td className="p-4 text-sm text-gray-600">{m.sigla || '—'}</td>
                    <td className="p-4 text-sm text-gray-600">{m.nombre_plan}</td>
                    <td className="p-4">
                      <div className="w-5 h-5 rounded border border-gray-200" style={{ background: m.color }}></div>
                    </td>
                    {puedeEditar && (
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setModal({ abierto: true, datos: m })}
                            className="px-3 py-1.5 text-xs font-medium text-[#701330] bg-[#701330]/5 hover:bg-[#701330]/10 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminar(m.id_materia)}
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
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modal.datos ? 'Editar Materia' : 'Nueva Materia'}</h3>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Materia:</label>
                <input
                  type="text"
                  name="nombre_materia"
                  defaultValue={modal.datos?.nombre_materia || ''}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sigla:</label>
                <input
                  type="text"
                  name="sigla"
                  defaultValue={modal.datos?.sigla || ''}
                  placeholder="Ej. PROG-8"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Educativo:</label>
                <select
                  name="id_plan"
                  defaultValue={modal.datos?.id_plan || ''}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 bg-white text-sm"
                >
                  <option value="">Seleccione un plan</option>
                  {planes.map(p => (
                    <option key={p.id_plan} value={p.id_plan}>{p.nombre_plan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color:</label>
                <input
                  type="color"
                  name="color"
                  defaultValue={modal.datos?.color || '#701330'}
                  className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer bg-white"
                />
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
        titulo="Eliminar materia"
        mensaje="¿Estás seguro de eliminar esta materia?"
        textoConfirmar="Sí, eliminar"
        cargando={eliminando}
        onCancelar={() => setConfirmarEliminar(null)}
        onConfirmar={confirmarBorrar}
      />
      <ToastLocal alerta={alerta} onCerrar={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })} />
    </div>
  );
}