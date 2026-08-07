import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import ToastLocal from '../components/ToastLocal';

const ROLES_DISPONIBLES = [
  { valor: 'director', etiqueta: 'Director de Carrera' },
  { valor: 'superadmin', etiqueta: 'Super Administrador' }
];

const getInitials = (nombre) => {
  if (!nombre) return '?';
  const partes = nombre.trim().split(' ');
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
};

const colorRol = (rol) => {
  const mapa = {
    superadmin: 'bg-amber-100 text-amber-800 border-amber-200',
    director: 'bg-blue-100 text-blue-800 border-blue-200',
    docente: 'bg-green-100 text-green-800 border-green-200',
    alumno: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  return mapa[rol] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const iconRol = (rol) => {
  switch(rol) {
    case 'superadmin': return '';
    case 'director': return '';
    case 'docente': return '';
    case 'alumno': return '';
    default: return '';
  }
};

const etiquetaRol = (rol) => {
  const r = ROLES_DISPONIBLES.find(x => x.valor === rol);
  return r ? r.etiqueta : rol;
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState({ abierto: false, editar: null });
  const [form, setForm] = useState({ nombre: '', email: '', contrasena: '', rol: 'director', id_carrera: '' });
  const [guardando, setGuardando] = useState(false);
  const [cambiarContrasena, setCambiarContrasena] = useState(null);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: 'error', mensaje: '' });

  const mostrarAlerta = (tipo, mensaje) => setAlerta({ mostrar: true, tipo, mensaje });

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resUsuarios, resCarreras] = await Promise.all([
        api.get('/api/usuarios'),
        api.get('/api/carreras')
      ]);
      setUsuarios(resUsuarios.data || []);
      setCarreras(resCarreras.data || []);
    } catch (err) {
      mostrarAlerta('error', err.response?.data?.detail || 'No se pudo cargar la lista de usuarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter(u => {
      if (filtroRol && u.rol !== filtroRol) return false;
      if (!q) return true;
      const coinciden = (campo) => (campo || '').toLowerCase().includes(q);
      return coinciden(u.nombre) ||
        coinciden(u.email_institucional) ||
        coinciden(u.nombre_carrera) ||
        coinciden(u.sigla) ||
        coinciden(u.rol) ||
        coinciden(etiquetaRol(u.rol));
    });
  }, [usuarios, busqueda, filtroRol]);

  const abrirNuevo = () => {
    setModal({ abierto: true, editar: null });
    setForm({ nombre: '', email: '', contrasena: '', rol: 'director', id_carrera: '' });
  };

  const abrirEditar = (usuario) => {
    setModal({ abierto: true, editar: usuario });
    setForm({
      nombre: usuario.nombre || '',
      email: usuario.email_institucional || '',
      contrasena: '',
      rol: usuario.rol || 'director',
      id_carrera: usuario.id_carrera ? String(usuario.id_carrera) : ''
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (modal.editar) {
        const datos = {
          rol: form.rol,
          id_carrera: form.id_carrera ? Number(form.id_carrera) : null
        };
        if (form.nombre.trim()) datos.nombre = form.nombre.trim();
        await api.put(`/api/usuarios/${modal.editar.id_usuario}`, datos);
        mostrarAlerta('exito', 'Usuario actualizado correctamente');
      } else {
        await api.post('/api/usuarios', {
          nombre: form.nombre.trim(),
          email_institucional: form.email.trim(),
          contrasena: form.contrasena,
          rol: form.rol,
          id_carrera: form.id_carrera ? Number(form.id_carrera) : null
        });
        mostrarAlerta('exito', `Usuario ${etiquetaRol(form.rol).toLowerCase()} creado correctamente`);
      }
      setModal({ abierto: false, editar: null });
      cargarDatos();
    } catch (err) {
      mostrarAlerta('error', err.response?.data?.detail || 'No se pudo guardar el usuario');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarCambiarContrasena = async () => {
    if (!cambiarContrasena || !nuevaContrasena) return;
    if (nuevaContrasena.length < 6) {
      mostrarAlerta('error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setGuardando(true);
    try {
      await api.patch(`/api/usuarios/${cambiarContrasena.id_usuario}/contrasena?nueva_contrasena=${encodeURIComponent(nuevaContrasena)}`);
      mostrarAlerta('exito', `Contraseña de ${cambiarContrasena.nombre} actualizada`);
      setCambiarContrasena(null);
      setNuevaContrasena('');
    } catch (err) {
      mostrarAlerta('error', err.response?.data?.detail || 'No se pudo cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  const directores = usuarios.filter(u => u.rol === 'director').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#701330]/10 rounded-xl">
                <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Gestión de Usuarios
                </h2>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {directores} director(es) de carrera registrados
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
            Nuevo Usuario
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
                placeholder="Buscar por nombre, correo, carrera o rol..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filtroRol}
                onChange={e => setFiltroRol(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all min-w-[140px]"
              >
                <option value="">Todos los roles</option>
                {ROLES_DISPONIBLES.map(r => (
                  <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
                ))}
              </select>
              {(busqueda || filtroRol) && (
                <button
                  onClick={() => {
                    setBusqueda('');
                    setFiltroRol('');
                  }}
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
                {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        {cargando ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">Cargando usuarios...</p>
            </div>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay usuarios</h3>
            <p className="text-gray-500">
              {busqueda || filtroRol 
                ? 'No hay usuarios que coincidan con los filtros aplicados'
                : 'Comienza creando un nuevo usuario'}
            </p>
            {(busqueda || filtroRol) && (
              <button
                onClick={() => {
                  setBusqueda('');
                  setFiltroRol('');
                }}
                className="mt-4 px-6 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
              >
                Limpiar filtros
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
                      <span className="flex items-center gap-1.5">Usuario</span>
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      <span className="flex items-center gap-1.5">Correo</span>
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">Rol</span>
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      <span className="flex items-center gap-1.5">Carrera</span>
                    </th>
                    <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center justify-end gap-1.5">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u, index) => (
                    <tr 
                      key={u.id_usuario} 
                      className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.foto ? (
                            <img src={u.foto} alt={u.nombre} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#701330]/20 to-[#701330]/5 flex items-center justify-center text-[#701330] font-bold text-sm flex-shrink-0 border-2 border-[#701330]/10">
                              {getInitials(u.nombre)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-medium text-gray-800 text-sm block truncate">
                              {u.nombre}
                            </span>
                            <span className="text-xs text-gray-400 sm:hidden block truncate">
                              {u.email_institucional}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 hidden sm:table-cell">
                        <span className="truncate block max-w-[200px]">{u.email_institucional}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colorRol(u.rol)}`}>
                          <span>{iconRol(u.rol)}</span>
                          <span>{etiquetaRol(u.rol)}</span>
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 hidden md:table-cell">
                        <span className="truncate block max-w-[150px]">
                          {u.nombre_carrera || <span className="text-gray-400">—</span>}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => abrirEditar(u)}
                            className="px-3 py-1.5 text-xs font-medium text-[#701330] bg-[#701330]/5 hover:bg-[#701330]/10 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Editar rol o carrera"
                          >
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Editar
                            </span>
                          </button>
                          <button
                            onClick={() => setCambiarContrasena(u)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Restablecer contraseña"
                          >
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              Contraseña
                            </span>
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
                  <div className="w-11 h-11 rounded-xl bg-[#701330]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {modal.editar ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {modal.editar
                        ? 'Cambia el rol o la carrera del usuario'
                        : 'Da de alta a un director de carrera, docente o alumno'}
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
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                    required
                    disabled={guardando}
                    placeholder="Ej. Juan Pérez López"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo institucional {!modal.editar && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                    required={!modal.editar}
                    disabled={guardando || !!modal.editar}
                    placeholder="correo@utvtol.edu.mx"
                  />
                  {modal.editar && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      El correo no se puede modificar
                    </p>
                  )}
                </div>

                {!modal.editar && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Contraseña inicial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.contrasena}
                      onChange={e => setForm({ ...form, contrasena: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                      required
                      minLength={6}
                      disabled={guardando}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.rol}
                    onChange={e => setForm({ ...form, rol: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all bg-white"
                    disabled={guardando}
                  >
                    {ROLES_DISPONIBLES.map(r => (
                      <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Carrera
                  </label>
                  <select
                    value={form.id_carrera}
                    onChange={e => setForm({ ...form, id_carrera: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all bg-white"
                    disabled={guardando}
                  >
                    <option value="">Sin asignar</option>
                    {carreras.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.nombre}</option>
                    ))}
                  </select>
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
                        {modal.editar ? 'Guardar cambios' : 'Crear usuario'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de cambio de contraseña */}
        {cambiarContrasena && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" 
              onClick={guardando ? undefined : () => setCambiarContrasena(null)}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Restablecer contraseña</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Nueva contraseña para <span className="font-medium text-gray-800">{cambiarContrasena.nombre}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setCambiarContrasena(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    disabled={guardando}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-amber-700">
                    La contraseña debe tener al menos 6 caracteres
                  </p>
                </div>

                <input
                  type="text"
                  value={nuevaContrasena}
                  onChange={e => setNuevaContrasena(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                  placeholder="Nueva contraseña (mínimo 6 caracteres)"
                  autoFocus
                  disabled={guardando}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setCambiarContrasena(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarCambiarContrasena}
                    disabled={guardando || !nuevaContrasena || nuevaContrasena.length < 6}
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
                        Guardar contraseña
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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