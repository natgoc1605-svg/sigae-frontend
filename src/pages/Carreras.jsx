import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import ToastLocal from '../components/ToastLocal';
import Confirmar from '../components/Confirmar';

export default function Carreras() {
  const [carreras, setCarreras] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState({ abierto: false, editar: null });
  const [form, setForm] = useState({ sigla: '', nombre: '', email_contacto: '' });
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: 'error', mensaje: '' });

  const mostrarAlerta = (tipo, mensaje) => setAlerta({ mostrar: true, tipo, mensaje });

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const res = await api.get('/api/carreras');
      setCarreras(res.data || []);
    } catch (err) {
      mostrarAlerta('error', err.response?.data?.detail || 'No se pudo cargar la lista de carreras');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const carrerasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return carreras;
    return carreras.filter(c =>
      (c.sigla || '').toLowerCase().includes(q) ||
      (c.nombre || c.nombre_carrera || '').toLowerCase().includes(q) ||
      (c.email_contacto || '').toLowerCase().includes(q)
    );
  }, [carreras, busqueda]);

  const abrirNuevo = () => {
    setModal({ abierto: true, editar: null });
    setForm({ sigla: '', nombre: '', email_contacto: '' });
  };

  const abrirEditar = (carrera) => {
    setModal({ abierto: true, editar: carrera });
    setForm({
      sigla: carrera.sigla || '',
      nombre: carrera.nombre || carrera.nombre_carrera || '',
      email_contacto: carrera.email_contacto || ''
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.sigla.trim() || !form.nombre.trim()) {
      mostrarAlerta('error', 'La sigla y el nombre son obligatorios');
      return;
    }
    setGuardando(true);
    try {
      const datos = {
        sigla: form.sigla.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        email_contacto: form.email_contacto.trim() || null
      };
      if (modal.editar) {
        await api.put(`/api/carreras/${modal.editar.id_carrera || modal.editar.id}`, datos);
        mostrarAlerta('exito', 'Carrera actualizada correctamente');
      } else {
        await api.post('/api/carreras', datos);
        mostrarAlerta('exito', 'Carrera creada correctamente');
      }
      setModal({ abierto: false, editar: null });
      cargarDatos();
    } catch (err) {
      mostrarAlerta('error', err.response?.data?.detail || 'No se pudo guardar la carrera');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    setGuardando(true);
    try {
      await api.delete(`/api/carreras/${aEliminar.id_carrera || aEliminar.id}`);
      mostrarAlerta('exito', 'Carrera eliminada correctamente');
      setAEliminar(null);
      cargarDatos();
    } catch (err) {
      mostrarAlerta('error', err.response?.data?.detail || 'No se pudo eliminar la carrera');
      setAEliminar(null);
    } finally {
      setGuardando(false);
    }
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Gestión de Carreras
                </h2>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  {carreras.length} carrera(s) registrada(s)
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={abrirNuevo} 
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Carrera
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por sigla, nombre o correo..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
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
                {carrerasFiltradas.length} carrera(s)
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de carreras */}
        {cargando ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">Cargando carreras...</p>
            </div>
          </div>
        ) : carrerasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay carreras</h3>
            <p className="text-gray-500">
              {busqueda 
                ? 'No hay carreras que coincidan con la búsqueda'
                : 'Comienza creando una nueva carrera'}
            </p>
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="mt-4 px-6 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b-2 border-gray-200">
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">Sigla</span>
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">Nombre</span>
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      <span className="flex items-center gap-1.5">Correo de contacto</span>
                    </th>
                    <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center justify-end gap-1.5">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {carrerasFiltradas.map((c, index) => (
                    <tr 
                      key={c.id_carrera || c.id} 
                      className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#701330]/10 text-[#701330] font-mono border border-[#701330]/10">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          {c.sigla}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-800 text-sm">
                          {c.nombre || c.nombre_carrera}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 hidden sm:table-cell">
                        {c.email_contacto ? (
                          <a 
                            href={`mailto:${c.email_contacto}`} 
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                          >
                            {c.email_contacto}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(c)}
                            className="px-3 py-1.5 text-xs font-medium text-[#701330] bg-[#701330]/5 hover:bg-[#701330]/10 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => setAEliminar(c)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de creación/edición */}
        {modal.abierto && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" 
              onClick={guardando ? undefined : () => setModal({ abierto: false, editar: null })}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#701330]/10 flex items-center justify-center flex-shrink-0 text-[#701330]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {modal.editar ? 'Editar Carrera' : 'Nueva Carrera'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {modal.editar
                        ? 'Actualiza los datos de la carrera'
                        : 'Da de alta una nueva carrera'}
                    </p>
                  </div>
                  <button
                    onClick={() => setModal({ abierto: false, editar: null })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    disabled={guardando}
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
                    Sigla <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.sigla}
                      onChange={e => setForm({ ...form, sigla: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all uppercase"
                      required
                      maxLength={10}
                      disabled={guardando}
                      placeholder="Ej. DSM"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                      {form.sigla.length}/10
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                    required
                    maxLength={150}
                    disabled={guardando}
                    placeholder="Ej. Desarrollo de Software Multiplataforma"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo de contacto
                  </label>
                  <input
                    type="email"
                    value={form.email_contacto}
                    onChange={e => setForm({ ...form, email_contacto: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                    disabled={guardando}
                    placeholder="contacto@utvtol.edu.mx"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Correo de contacto para la carrera (opcional)
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModal({ abierto: false, editar: null })}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-[#701330] hover:bg-[#912347] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {guardando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {modal.editar ? 'Guardar cambios' : 'Crear carrera'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmar eliminación */}
        <Confirmar
          abierto={!!aEliminar}
          titulo="Eliminar carrera"
          mensaje={
            <div>
              <p className="text-gray-700">
                ¿Seguro que deseas eliminar la carrera?
              </p>
              {aEliminar && (
                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="font-semibold text-gray-900">
                    {aEliminar.sigla}
                  </p>
                  <p className="text-sm text-gray-600">
                    {aEliminar.nombre || aEliminar.nombre_carrera}
                  </p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-3 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Esta acción no se puede deshacer
              </p>
            </div>
          }
          textoConfirmar="Eliminar"
          cargando={guardando}
          onCancelar={() => setAEliminar(null)}
          onConfirmar={confirmarEliminar}
        />

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