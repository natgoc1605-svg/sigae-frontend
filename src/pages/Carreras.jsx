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
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#701330]">Gestión de Carreras</h2>
          <p className="text-sm text-gray-500 mt-1">
            {carreras.length} carrera(s) registrada(s)
          </p>
        </div>
        <button onClick={abrirNuevo} className="px-4 py-2 bg-[#701330] hover:bg-[#912347] text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Carrera
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por sigla, nombre o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/20 text-sm"
          />
        </div>
        <span className="text-sm text-gray-500 self-center ml-auto">
          {carrerasFiltradas.length} carrera(s)
        </span>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#701330] border-t-transparent"></div>
        </div>
      ) : carrerasFiltradas.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <svg className="w-14 h-14 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500">No hay carreras que coincidan con la búsqueda</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Sigla</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Correo de contacto</th>
                  <th className="p-4 text-right text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {carrerasFiltradas.map(c => (
                  <tr key={c.id_carrera || c.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#701330]/10 text-[#701330] font-mono">
                        {c.sigla}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{c.nombre || c.nombre_carrera}</td>
                    <td className="p-4 text-sm text-gray-600">{c.email_contacto || '—'}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(c)}
                          className="px-3 py-1.5 text-xs font-medium text-[#701330] bg-[#701330]/5 hover:bg-[#701330]/10 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setAEliminar(c)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
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

      {modal.abierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={guardando ? undefined : () => setModal({ abierto: false, editar: null })}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {modal.editar ? 'Editar Carrera' : 'Nueva Carrera'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {modal.editar
                ? 'Actualiza los datos de la carrera'
                : 'Da de alta una nueva carrera'}
            </p>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sigla</label>
                <input
                  type="text"
                  value={form.sigla}
                  onChange={e => setForm({ ...form, sigla: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 uppercase"
                  required
                  maxLength={10}
                  disabled={guardando}
                  placeholder="Ej. DSM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                  required
                  maxLength={150}
                  disabled={guardando}
                  placeholder="Ej. Desarrollo de Software Multiplataforma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo de contacto</label>
                <input
                  type="email"
                  value={form.email_contacto}
                  onChange={e => setForm({ ...form, email_contacto: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                  disabled={guardando}
                  placeholder="contacto@utvtol.edu.mx"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ abierto: false, editar: null })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-[#701330] hover:bg-[#912347] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? 'Guardando...' : (modal.editar ? 'Guardar cambios' : 'Crear carrera')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Confirmar
        abierto={!!aEliminar}
        titulo="Eliminar carrera"
        mensaje={`¿Seguro que deseas eliminar la carrera "${aEliminar?.sigla} — ${aEliminar?.nombre || aEliminar?.nombre_carrera}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        cargando={guardando}
        onCancelar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminar}
      />

      <ToastLocal alerta={alerta} onCerrar={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })} />
    </div>
  );
}
