import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import api from '../api/axios';

const getInitials = (nombre) => {
  if (!nombre) return 'U';
  const partes = nombre.trim().split(' ');
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
};

export default function Perfil() {
  const { usuario, actualizarUsuario } = useAuth();
  const { tamanoLetra, setTamanoLetra } = useTema();
  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    carrera: '',
    id_carrera: ''
  });
  const [contrasena, setContrasena] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mensajeFoto, setMensajeFoto] = useState({ tipo: '', texto: '' });
  const [mensajeDatos, setMensajeDatos] = useState({ tipo: '', texto: '' });
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [eliminandoFoto, setEliminandoFoto] = useState(false);
  const [guardaDatos, setGuardaDatos] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const inputFoto = useRef(null);

  const foto = usuario?.foto || usuario?.foto_perfil || null;

  useEffect(() => {
    if (usuario) {
      setDatos({
        nombre: usuario.nombre || '',
        email: usuario.email || usuario.email_institucional || '',
        carrera: usuario.carrera_nombre || 'Sin asignar',
        id_carrera: usuario.id_carrera !== undefined && usuario.id_carrera !== null ? String(usuario.id_carrera) : ''
      });
    }
  }, [usuario]);

  const [carreras, setCarreras] = useState([]);

  useEffect(() => {
    let activo = true;
    api.get('/api/carreras')
      .then(res => { if (activo) setCarreras(res.data || []); })
      .catch(() => {});
    return () => { activo = false; };
  }, []);

  const guardarDatos = async (e) => {
    e.preventDefault();
    setMensajeDatos({ tipo: '', texto: '' });
    if (datos.nombre.trim().length < 3) {
      setMensajeDatos({ tipo: 'error', texto: 'El nombre debe tener al menos 3 caracteres' });
      return;
    }
    setGuardaDatos(true);
    try {
      const res = await api.put('/api/auth/perfil', {
        nombre: datos.nombre.trim(),
        id_carrera: datos.id_carrera ? Number(datos.id_carrera) : null
      });
      const u = res.data?.usuario;
      actualizarUsuario({ nombre: datos.nombre.trim(), id_carrera: datos.id_carrera ? Number(datos.id_carrera) : null, carrera_nombre: u?.carrera_nombre || (carreras.find(c => String(c.id_carrera) === datos.id_carrera)?.nombre_carrera || null) });
      setMensajeDatos({ tipo: 'exito', texto: 'Datos actualizados correctamente' });
    } catch (err) {
      setMensajeDatos({ tipo: 'error', texto: err.response?.data?.detail || 'No se pudieron guardar los datos' });
    } finally {
      setGuardaDatos(false);
    }
  };

  const eliminarFoto = async () => {
    setEliminandoFoto(true);
    setMensajeFoto({ tipo: '', texto: '' });
    try {
      await api.delete('/api/auth/foto/eliminar');
      actualizarUsuario({ foto: null, foto_perfil: null });
      setPreviewFoto(null);
      if (inputFoto.current) inputFoto.current.value = '';
      setMensajeFoto({ tipo: 'exito', texto: 'Foto eliminada correctamente' });
    } catch (err) {
      setMensajeFoto({ tipo: 'error', texto: err.response?.data?.detail || 'No se pudo eliminar la foto' });
    } finally {
      setEliminandoFoto(false);
    }
  };

  const cambiarContrasena = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    if (contrasena.nueva.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }
    if (contrasena.nueva !== contrasena.confirmar) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' });
      return;
    }
    try {
      await api.post('/api/auth/cambiar-contrasena', {
        actual: contrasena.actual,
        nueva: contrasena.nueva
      });
      setMensaje({ tipo: 'exito', texto: 'Contraseña actualizada correctamente' });
      setContrasena({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.detail || 'No se pudo actualizar la contraseña' });
    }
  };

  const seleccionarFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      setMensajeFoto({ tipo: 'error', texto: 'El archivo debe ser una imagen' });
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      setMensajeFoto({ tipo: 'error', texto: 'La imagen no puede superar los 2MB' });
      return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const factor = MAX / Math.max(width, height);
          width = Math.round(width * factor);
          height = Math.round(height * factor);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewFoto(dataUrl);
      };
      img.onerror = () => setMensajeFoto({ tipo: 'error', texto: 'No se pudo leer la imagen' });
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  };

  const guardarFoto = async () => {
    if (!previewFoto) return;
    setSubiendoFoto(true);
    setMensajeFoto({ tipo: '', texto: '' });
    try {
      const res = await api.post('/api/auth/foto', { foto: previewFoto });
      actualizarUsuario({ foto: res.data.foto });
      setPreviewFoto(null);
      setMensajeFoto({ tipo: 'exito', texto: 'Foto de perfil actualizada correctamente' });
    } catch (err) {
      setMensajeFoto({ tipo: 'error', texto: err.response?.data?.detail || 'No se pudo guardar la foto' });
    } finally {
      setSubiendoFoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-[#701330]/10 rounded-xl">
            <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Mi Perfil</h2>
            <p className="text-sm text-gray-500 mt-0.5">Gestiona tu información personal y seguridad</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Foto y datos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Foto de perfil */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 bg-[#701330] rounded-full"></div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Foto de Perfil</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  {foto || previewFoto ? (
                    <img
                      src={previewFoto || foto}
                      alt={usuario?.nombre}
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#701330]/20 shadow-lg group-hover:shadow-xl transition-all duration-300"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#701330] to-[#912347] flex items-center justify-center text-white font-bold text-4xl border-4 border-[#701330]/20 shadow-lg group-hover:shadow-xl transition-all duration-300">
                      {getInitials(usuario?.nombre)}
                    </div>
                  )}
                  {previewFoto && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-3">
                  {previewFoto && (
                    <div className="flex gap-2">
                      <button
                        onClick={guardarFoto}
                        disabled={subiendoFoto}
                        className="flex-1 px-4 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                      >
                        {subiendoFoto ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Guardar foto
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => { setPreviewFoto(null); if (inputFoto.current) inputFoto.current.value = ''; }}
                        className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => inputFoto.current?.click()}
                      className="flex-1 min-w-[120px] px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-[#701330] hover:text-[#701330] rounded-xl text-gray-600 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {previewFoto ? 'Elegir otra imagen' : foto ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    {foto && !previewFoto && (
                      <button
                        onClick={eliminarFoto}
                        disabled={eliminandoFoto}
                        className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {eliminandoFoto ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    )}
                  </div>

                  <input
                    ref={inputFoto}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={seleccionarFoto}
                  />

                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    JPG o PNG, máximo 2MB
                  </p>

                  {mensajeFoto.texto && (
                    <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                      mensajeFoto.tipo === 'exito' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {mensajeFoto.tipo === 'exito' ? (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {mensajeFoto.texto}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tu foto se mostrará en el encabezado, en tus solicitudes y notificaciones.
                </p>
              </div>
            </div>

            {/* Datos de usuario */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 bg-[#701330] rounded-full"></div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Datos de Usuario</h3>
              </div>

              {mensajeDatos.texto && (
                <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
                  mensajeDatos.tipo === 'exito' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {mensajeDatos.tipo === 'exito' ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {mensajeDatos.texto}
                </div>
              )}

              <form onSubmit={guardarDatos} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                    value={datos.nombre}
                    onChange={e => setDatos({ ...datos, nombre: e.target.value })}
                    required
                    disabled={guardaDatos}
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo institucional
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      value={datos.email} 
                      readOnly 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    El correo no se puede modificar
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Carrera
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all bg-white"
                    value={datos.id_carrera}
                    onChange={e => setDatos({ ...datos, id_carrera: e.target.value, carrera: carreras.find(c => String(c.id_carrera) === e.target.value)?.nombre_carrera || 'Sin asignar' })}
                    disabled={guardaDatos}
                  >
                    <option value="">Sin asignar</option>
                    {carreras.map(c => (
                      <option key={c.id_carrera} value={String(c.id_carrera)}>{c.nombre_carrera}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full px-4 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={guardaDatos}
                >
                  {guardaDatos ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Guardar cambios
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Preferencias de accesibilidad */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 bg-[#701330] rounded-full"></div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Preferencias</h3>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Tamaño de letra</p>
                  <p className="text-xs text-gray-400 mt-0.5">Agranda el texto para facilitar la lectura</p>
                </div>
                <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                  {[
                    { valor: 'normal', etiqueta: 'A' },
                    { valor: 'mediano', etiqueta: 'A+' },
                    { valor: 'grande', etiqueta: 'A++' },
                  ].map((opcion) => (
                    <button
                      key={opcion.valor}
                      onClick={() => setTamanoLetra(opcion.valor)}
                      className={`px-5 py-2 text-sm font-medium transition-all duration-200 ${
                        tamanoLetra === opcion.valor
                          ? 'bg-[#701330] text-white shadow'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {opcion.etiqueta}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Cambiar contraseña */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 sticky top-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 bg-[#701330] rounded-full"></div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Cambiar Contraseña</h3>
              </div>

              {mensaje.texto && (
                <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
                  mensaje.tipo === 'exito' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {mensaje.tipo === 'exito' ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {mensaje.texto}
                </div>
              )}

              <form onSubmit={cambiarContrasena} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contraseña actual <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all" 
                      value={contrasena.actual} 
                      onChange={e => setContrasena({...contrasena, actual: e.target.value})} 
                      required 
                      placeholder="••••••••"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nueva contraseña <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all" 
                    value={contrasena.nueva} 
                    onChange={e => setContrasena({...contrasena, nueva: e.target.value})} 
                    required 
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmar nueva contraseña <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all" 
                    value={contrasena.confirmar} 
                    onChange={e => setContrasena({...contrasena, confirmar: e.target.value})} 
                    required 
                    placeholder="Repite la contraseña"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-amber-700">
                    La contraseña debe tener al menos 6 caracteres
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="w-full px-4 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Actualizar contraseña
                </button>
              </form>

              {/* Información de seguridad */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Recomendamos cambiar la contraseña cada 90 días</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}