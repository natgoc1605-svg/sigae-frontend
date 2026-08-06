import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import ToastLocal from '../components/ToastLocal';

const ROLES_DISPONIBLES = [
  { valor: 'director', etiqueta: 'Director de Carrera' },
  { valor: 'docente', etiqueta: 'Docente' },
  { valor: 'alumno', etiqueta: 'Alumno' },
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
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#701330]">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500 mt-1">
            {directores} director(es) de carrera registrados
          </p>
        </div>
        <button onClick={abrirNuevo} className="px-4 py-2 bg-[#701330] hover:bg-[#912347] text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, correo, carrera o rol..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/20 text-sm"
          />
        </div>
        <select
          value={filtroRol}
          onChange={e => setFiltroRol(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
        >
          <option value="">Todos los roles</option>
          {ROLES_DISPONIBLES.map(r => (
            <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 self-center ml-auto">
          {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#701330] border-t-transparent"></div>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <svg className="w-14 h-14 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500">No hay usuarios que coincidan con la búsqueda</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Usuario</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Correo</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Rol</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Carrera</th>
                  <th className="p-4 text-right text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map(u => (
                  <tr key={u.id_usuario} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {u.foto ? (
                          <img src={u.foto} alt={u.nombre} className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#701330]/10 flex items-center justify-center text-[#701330] font-bold text-xs flex-shrink-0">
                            {getInitials(u.nombre)}
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{u.nombre}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{u.email_institucional}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colorRol(u.rol)}`}>
                        {etiquetaRol(u.rol)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{u.nombre_carrera || '—'}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(u)}
                          className="px-3 py-1.5 text-xs font-medium text-[#701330] bg-[#701330]/5 hover:bg-[#701330]/10 rounded-lg transition-colors"
                          title="Editar rol o carrera"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setCambiarContrasena(u)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Restablecer contraseña"
                        >
                          Contraseña
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
              {modal.editar ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {modal.editar
                ? 'Cambia el rol o la carrera del usuario'
                : 'Da de alta a un director de carrera, docente o alumno'}
            </p>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                  required
                  disabled={guardando}
                  placeholder="Ej. Juan Pérez López"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo institucional</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                  required={!modal.editar}
                  disabled={guardando || !!modal.editar}
                  placeholder="correo@utvtol.edu.mx"
                />
              </div>
              {!modal.editar && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña inicial</label>
                  <input
                    type="text"
                    value={form.contrasena}
                    onChange={e => setForm({ ...form, contrasena: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                    required
                    minLength={6}
                    disabled={guardando}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 bg-white"
                  disabled={guardando}
                >
                  {ROLES_DISPONIBLES.map(r => (
                    <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
                <select
                  value={form.id_carrera}
                  onChange={e => setForm({ ...form, id_carrera: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 bg-white"
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
                  {guardando ? 'Guardando...' : (modal.editar ? 'Guardar cambios' : 'Crear usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cambiarContrasena && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={guardando ? undefined : () => setCambiarContrasena(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-800">Restablecer contraseña</h3>
            <p className="text-sm text-gray-600 mt-1">
              Nueva contraseña para <span className="font-medium text-gray-800">{cambiarContrasena.nombre}</span>
            </p>
            <div className="mt-4">
              <input
                type="text"
                value={nuevaContrasena}
                onChange={e => setNuevaContrasena(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                placeholder="Nueva contraseña (mínimo 6 caracteres)"
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCambiarContrasena(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCambiarContrasena}
                disabled={guardando}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-[#701330] hover:bg-[#912347] disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastLocal alerta={alerta} onCerrar={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })} />
    </div>
  );
}
