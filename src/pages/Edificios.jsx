import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSuperAdmin } from '../utils/auth';
import api from '../api/axios';
import Confirmar from '../components/Confirmar';

export default function Edificios() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState([]);
  const [directores, setDirectores] = useState([]);
  const [modal, setModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [responsables, setResponsables] = useState([]);
  const [nuevoResponsable, setNuevoResponsable] = useState('');
  const [plantasResponsable, setPlantasResponsable] = useState('ambas');
  const [cargando, setCargando] = useState(false);
  const [cargandoDirectores, setCargandoDirectores] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [responsableEliminar, setResponsableEliminar] = useState(null);
  const [eliminandoResponsable, setEliminandoResponsable] = useState(false);
  const [edificioEliminar, setEdificioEliminar] = useState(null);
  const [contrasenaEliminar, setContrasenaEliminar] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [aulasPorEdificio, setAulasPorEdificio] = useState({});

  const esSuperAdmin = isSuperAdmin(usuario);

  const [form, setForm] = useState({
    nombre_edificio: '',
    observaciones: '',
    cantidad_plantas: 1,
    tiene_laboratorios: false,
    tiene_auditorios: false
  });

  const cargar = async () => {
    try {
      setCargando(true);
      const resEdif = await api.get('/api/edificios/');
      setLista(resEdif.data || []);
      try {
        const resAulas = await api.get('/api/aulas');
        const conteo = {};
        (resAulas.data || []).forEach(a => {
          conteo[a.id_edificio] = (conteo[a.id_edificio] || 0) + 1;
        });
        setAulasPorEdificio(conteo);
      } catch (e) {
        console.error('Error al cargar aulas para conteo:', e);
      }
      await cargarDirectores();
    } catch (err) {
      console.error('Error al cargar edificios:', err);
      mostrarMensaje('error', 'No se pudieron cargar los edificios');
    } finally {
      setCargando(false);
    }
  };

  const cargarDirectores = async () => {
    try {
      setCargandoDirectores(true);
      const res = await api.get('/api/directores');
      
      if (res.data.success) {
        const directoresData = res.data.data || [];
        setDirectores(directoresData);
      } else {
        mostrarMensaje('error', res.data.error || 'Error al cargar directores');
        setDirectores([]);
      }
    } catch (err) {
      console.error('Error al cargar directores:', err);
      mostrarMensaje('error', 'No se pudieron cargar los directores');
      setDirectores([]);
    } finally {
      setCargandoDirectores(false);
    }
  };

  const cargarResponsables = async (idEdificio) => {
    try {
      const res = await api.get(`/api/edificios/${idEdificio}/responsables`);
      setResponsables(res.data || []);
    } catch (err) {
      console.error('Error al cargar responsables:', err);
      setResponsables([]);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  const guardar = async (e) => {
    e.preventDefault();

    if (!form.nombre_edificio.trim()) {
      mostrarMensaje('error', 'El nombre del edificio es obligatorio');
      return;
    }

    try {
      if (editar) {
        if (!editar.id_edificio) {
          mostrarMensaje('error', 'ID del edificio no encontrado');
          return;
        }
        const edificioExistente = lista.find(e => e.id_edificio === editar.id_edificio);
        if (!edificioExistente) {
          mostrarMensaje('error', 'El edificio ya no existe en la base de datos');
          setModal(false);
          setEditar(null);
          cargar();
          return;
        }
        await api.put(`/api/edificios/${editar.id_edificio}`, form);
        mostrarMensaje('exito', 'Edificio actualizado correctamente');
      } else {
        const response = await api.post('/api/edificios/', form);
        if (nuevoResponsable && response.data?.id_edificio) {
          try {
            await api.post(`/api/edificios/${response.data.id_edificio}/responsables`, {
              id_usuario: parseInt(nuevoResponsable),
              plantas: plantasResponsable
            });
            mostrarMensaje('exito', 'Edificio creado y responsable asignado');
          } catch (err) {
            console.error('Error al asignar responsable:', err);
          }
        } else {
          mostrarMensaje('exito', 'Edificio creado correctamente');
        }
      }
      setModal(false);
      setEditar(null);
      resetForm();
      cargar();
    } catch (err) {
      if (err.response?.status === 404) {
        mostrarMensaje('error', 'El edificio que intentas editar ya no existe. Recargando lista...');
        setModal(false);
        setEditar(null);
        cargar();
      } else {
        const errorMsg = err.response?.data?.detail || 'Error al guardar';
        mostrarMensaje('error', errorMsg);
      }
      console.error('Error al guardar:', err);
    }
  };

  const resetForm = () => {
    setForm({
      nombre_edificio: '',
      observaciones: '',
      cantidad_plantas: 1,
      tiene_laboratorios: false,
      tiene_auditorios: false
    });
    setResponsables([]);
    setNuevoResponsable('');
    setPlantasResponsable('ambas');
  };

  const confirmarEliminar = (edificio) => {
    setEdificioEliminar(edificio);
    setContrasenaEliminar('');
  };

  const cancelarEliminar = () => {
    setEdificioEliminar(null);
    setContrasenaEliminar('');
  };

  const ejecutarEliminar = async () => {
    if (!edificioEliminar || eliminando) return;

    if (!contrasenaEliminar) {
      mostrarMensaje('error', 'Ingresa tu contraseña para confirmar la eliminación');
      return;
    }

    setEliminando(true);
    try {
      await api.delete(`/api/edificios/${edificioEliminar.id_edificio}`, { data: { contrasena: contrasenaEliminar } });
      mostrarMensaje('exito', `Edificio "${edificioEliminar.nombre_edificio}" desactivado correctamente (se conserva el historial)`);
      setEdificioEliminar(null);
      setContrasenaEliminar('');
      cargar();
    } catch (err) {
      const errorData = err.response?.data?.detail;
      if (typeof errorData === 'object' && errorData.mensaje) {
        mostrarMensaje('error', errorData.mensaje);
      } else {
        const errorMsg = err.response?.data?.detail || 'No se pudo desactivar el edificio';
        mostrarMensaje('error', errorMsg);
      }
    } finally {
      setEliminando(false);
    }
  };

  const asignarResponsable = async (idEdificio) => {
    if (!nuevoResponsable) {
      mostrarMensaje('error', 'Selecciona un director para asignar');
      return;
    }

    try {
      await api.post(`/api/edificios/${idEdificio}/responsables`, {
        id_usuario: parseInt(nuevoResponsable),
        plantas: plantasResponsable
      });
      mostrarMensaje('exito', 'Responsable asignado correctamente');
      cargarResponsables(idEdificio);
      setNuevoResponsable('');
      setPlantasResponsable('ambas');
      cargar();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al asignar responsable';
      mostrarMensaje('error', errorMsg);
    }
  };

  const actualizarPlantasResponsable = async (idEdificio, idUsuario, nuevasPlantas) => {
    try {
      await api.put(`/api/edificios/${idEdificio}/responsables/${idUsuario}`, {
        plantas: nuevasPlantas
      });
      mostrarMensaje('exito', 'Plantas actualizadas correctamente');
      cargarResponsables(idEdificio);
      cargar();
    } catch (err) {
      if (err.response?.status === 404) {
        mostrarMensaje('error', 'El responsable ya no existe. Recargando lista...');
        cargarResponsables(idEdificio);
        cargar();
      } else {
        const errorMsg = err.response?.data?.detail || 'Error al actualizar plantas';
        mostrarMensaje('error', errorMsg);
      }
    }
  };

  const eliminarResponsable = async (idEdificio, idUsuario) => {
    setResponsableEliminar({ idEdificio, idUsuario });
  };

  const confirmarEliminarResponsable = async () => {
    if (!responsableEliminar || eliminandoResponsable) return;
    setEliminandoResponsable(true);
    try {
      await api.delete(`/api/edificios/${responsableEliminar.idEdificio}/responsables/${responsableEliminar.idUsuario}`);
      mostrarMensaje('exito', 'Responsable eliminado correctamente');
      setResponsableEliminar(null);
      cargarResponsables(responsableEliminar.idEdificio);
      cargar();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al eliminar responsable';
      mostrarMensaje('error', errorMsg);
    } finally {
      setEliminandoResponsable(false);
    }
  };

  const abrirModal = (edificio = null) => {
    if (edificio) {
      const edificioActual = lista.find(e => e.id_edificio === edificio.id_edificio);
      if (!edificioActual) {
        mostrarMensaje('error', 'El edificio ya no existe. Recargando lista...');
        cargar();
        return;
      }
      setEditar(edificioActual);
      setForm({
        nombre_edificio: edificioActual.nombre_edificio,
        observaciones: edificioActual.observaciones || '',
        cantidad_plantas: edificioActual.cantidad_plantas || 1,
        tiene_laboratorios: edificioActual.tiene_laboratorios || false,
        tiene_auditorios: edificioActual.tiene_auditorios || false
      });
      cargarResponsables(edificioActual.id_edificio);
    } else {
      setEditar(null);
      resetForm();
    }
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditar(null);
    resetForm();
  };

  const getInitials = (nombre) => {
    if (!nombre) return '?';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  };

  const getPlantasLabel = (plantas) => {
    switch(plantas) {
      case 'baja': return 'Baja';
      case 'alta': return 'Alta';
      case 'ambas': return 'Ambas';
      default: return 'Ambas';
    }
  };

  const getPlantasBadgeColor = (plantas) => {
    switch(plantas) {
      case 'baja': return '#059669';
      case 'alta': return '#2563EB';
      case 'ambas': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  // Si no es SuperAdmin, mostrar mensaje de restriccion
  if (!esSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8 max-w-md w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Acceso Restringido</h2>
              <p className="text-sm text-gray-600 mt-0.5">Solo Super Administradores</p>
            </div>
          </div>
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg mb-3">
            Tu rol actual es: <strong className="text-amber-800">{usuario?.rol || 'No definido'}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Los Super Administradores pueden gestionar edificios y sus responsables.
          </p>
        </div>
      </div>
    );
  }

  const edificiosList = Array.isArray(lista) ? lista : [];
  const directoresList = Array.isArray(directores) ? directores : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mensaje flotante */}
        {mensaje && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slideDown max-w-md ${
            mensaje.tipo === 'exito' 
              ? 'bg-green-50 border-2 border-green-200 text-green-800' 
              : 'bg-red-50 border-2 border-red-200 text-red-800'
          }`}>
            <div className={`p-1.5 rounded-full flex-shrink-0 ${
              mensaje.tipo === 'exito' ? 'bg-green-200' : 'bg-red-200'
            }`}>
              {mensaje.tipo === 'exito' ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium flex-1">{mensaje.texto}</span>
            <button 
              onClick={() => setMensaje(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#701330]/10 rounded-xl">
                <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Gestión de Edificios
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Administra los edificios y sus responsables
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => abrirModal()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Edificio
          </button>
        </div>

        {/* Loading */}
        {cargando ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">Cargando edificios...</p>
            </div>
          </div>
        ) : (
          /* Grid de edificios */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {edificiosList.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay edificios registrados</h3>
                <p className="text-gray-500">Comienza creando un nuevo edificio</p>
              </div>
            ) : (
              edificiosList.map(e => {
                const responsablesList = Array.isArray(e.responsables) ? e.responsables : [];
                const totalAulas = aulasPorEdificio[e.id_edificio] || 0;
                return (
                  <div 
                    key={e.id_edificio} 
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    {/* Header de la tarjeta */}
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-[#701330]/5 to-[#701330]/10 border-b border-gray-50 flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#701330] flex items-center justify-center flex-shrink-0 text-white shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight truncate">
                          {e.nombre_edificio}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {e.cantidad_plantas} planta{e.cantidad_plantas !== 1 ? 's' : ''}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-xs text-[#701330] font-medium">
                            {totalAulas} aula{totalAulas !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Badges */}
                      {(e.tiene_laboratorios || e.tiene_auditorios) && (
                        <div className="flex flex-wrap gap-2">
                          {e.tiene_laboratorios && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              Laboratorios
                            </span>
                          )}
                          {e.tiene_auditorios && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Auditorios
                            </span>
                          )}
                        </div>
                      )}

                      {/* Observaciones */}
                      {e.observaciones && (
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {e.observaciones}
                          </p>
                        </div>
                      )}

                      {/* Responsables */}
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                          Responsables ({responsablesList.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {responsablesList.length > 0 ? (
                            responsablesList.map((r, idx) => (
                              <div 
                                key={idx} 
                                className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                              >
                                {r.foto ? (
                                  <img src={r.foto} alt={r.nombre} className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-[#701330]/10 flex items-center justify-center text-[#701330] text-[10px] font-bold">
                                    {getInitials(r.nombre)}
                                  </div>
                                )}
                                <span className="text-xs text-gray-700 font-medium truncate max-w-[60px]">
                                  {r.nombre}
                                </span>
                                {r.carrera_sigla && (
                                  <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded font-medium">
                                    {r.carrera_sigla}
                                  </span>
                                )}
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: r.plantas === 'baja' ? '#d1fae5' : r.plantas === 'alta' ? '#dbeafe' : '#ede9fe',
                                    color: getPlantasBadgeColor(r.plantas)
                                  }}
                                >
                                  {getPlantasLabel(r.plantas)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                              Sin responsables asignados
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => abrirModal(e)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#701330]/5 text-[#701330] hover:bg-[#701330]/10 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => confirmarEliminar(e)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {edificioEliminar && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
              <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Confirmar Eliminación</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Se desactivará el edificio conservando su historial</p>
                  </div>
                  <button
                    onClick={cancelarEliminar}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">
                    Se desactivará:
                  </p>
                  <p className="text-lg font-bold text-gray-900 mb-3">
                    {edificioEliminar.nombre_edificio}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Todas las aulas del edificio
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Reservas y horarios se conservan como historial
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Responsables asignados (se conservan)
                    </li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tu contraseña
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                    placeholder="Contraseña actual"
                    value={contrasenaEliminar}
                    onChange={e => setContrasenaEliminar(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Necesaria para confirmar que no te equivocaste
                  </p>
                </div>
              </div>

              <div className="flex gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                <button
                  onClick={cancelarEliminar}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={ejecutarEliminar}
                  disabled={eliminando}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {eliminando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Desactivando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Confirmar desactivación
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de creación/edición */}
        {modal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
              <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#701330]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{editar ? 'Editar Edificio' : 'Nuevo Edificio'}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {editar ? 'Modifica los datos del edificio' : 'Completa los datos para crear un nuevo edificio'}
                    </p>
                  </div>
                  <button
                    onClick={cerrarModal}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={guardar} className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nombre del edificio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                      value={form.nombre_edificio}
                      onChange={e => setForm({...form, nombre_edificio: e.target.value})}
                      required
                      placeholder="Ej: Docencia 1, Laboratorios, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Cantidad de plantas
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                      value={form.cantidad_plantas}
                      onChange={e => setForm({...form, cantidad_plantas: parseInt(e.target.value) || 1})}
                    />
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.tiene_laboratorios}
                        onChange={e => setForm({...form, tiene_laboratorios: e.target.checked})}
                        className="w-4 h-4 text-[#701330] border-gray-300 rounded focus:ring-[#701330] focus:ring-2"
                      />
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Tiene laboratorios
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.tiene_auditorios}
                        onChange={e => setForm({...form, tiene_auditorios: e.target.checked})}
                        className="w-4 h-4 text-[#701330] border-gray-300 rounded focus:ring-[#701330] focus:ring-2"
                      />
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Tiene auditorios
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Observaciones
                    </label>
                    <textarea
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all resize-none"
                      rows="2"
                      value={form.observaciones}
                      onChange={e => setForm({...form, observaciones: e.target.value})}
                      placeholder="Información adicional sobre el edificio..."
                    />
                  </div>
                </div>

                {/* Gestión de responsables - solo en edición */}
                {editar && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Directores responsables ({responsables.length})
                    </h4>

                    <div className="flex flex-wrap gap-3 mb-3">
                      <select
                        value={nuevoResponsable}
                        onChange={(e) => setNuevoResponsable(e.target.value)}
                        className="flex-1 min-w-[180px] px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all bg-white text-sm"
                      >
                        <option value="">Seleccionar director...</option>
                        {directoresList.length === 0 ? (
                          <option value="" disabled>No hay directores disponibles</option>
                        ) : (
                          directoresList
                            .filter(d => !responsables.some(r => r.id_usuario === d.id_usuario))
                            .map(d => (
                              <option key={d.id_usuario} value={d.id_usuario}>
                                {d.nombre} {d.carrera_sigla ? `(${d.carrera_sigla})` : ''}
                              </option>
                            ))
                        )}
                      </select>

                      <select
                        value={plantasResponsable}
                        onChange={(e) => setPlantasResponsable(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all bg-white text-sm"
                      >
                        <option value="baja">Baja</option>
                        <option value="alta">Alta</option>
                        <option value="ambas">Ambas</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => asignarResponsable(editar.id_edificio)}
                        disabled={!nuevoResponsable}
                        className="px-4 py-2.5 bg-[#701330] hover:bg-[#912347] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {responsables.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
                          No hay responsables asignados
                        </p>
                      ) : (
                        responsables.map(r => (
                          <div key={r.id_usuario} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              {r.foto ? (
                                <img src={r.foto} alt={r.nombre} className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#701330]/10 flex items-center justify-center text-[#701330] font-bold text-xs flex-shrink-0">
                                  {getInitials(r.nombre)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 text-sm truncate">{r.nombre}</p>
                                {r.carrera_sigla && (
                                  <p className="text-xs text-gray-500 truncate">{r.carrera_nombre || r.carrera_sigla}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <select
                                value={r.plantas || 'ambas'}
                                onChange={(e) => {
                                  const nuevasPlantas = e.target.value;
                                  actualizarPlantasResponsable(editar.id_edificio, r.id_usuario, nuevasPlantas);
                                }}
                                className="text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#701330] bg-white"
                                style={{
                                  borderColor: getPlantasBadgeColor(r.plantas),
                                  color: getPlantasBadgeColor(r.plantas)
                                }}
                              >
                                <option value="baja">Baja</option>
                                <option value="alta">Alta</option>
                                <option value="ambas">Ambas</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => eliminarResponsable(editar.id_edificio, r.id_usuario)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar responsable"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editar ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Confirmar
          abierto={!!responsableEliminar}
          titulo="Eliminar responsable"
          mensaje="¿Estás seguro de eliminar este responsable del edificio?"
          textoConfirmar="Sí, eliminar"
          cargando={eliminandoResponsable}
          onCancelar={() => setResponsableEliminar(null)}
          onConfirmar={confirmarEliminarResponsable}
        />
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
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}