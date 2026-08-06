import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const getInitials = (nombre) => {
  if (!nombre) return 'U';
  const partes = nombre.trim().split(' ');
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
};

export default function Perfil() {
  const { usuario, actualizarUsuario } = useAuth();
  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    carrera: ''
  });
  const [contrasena, setContrasena] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mensajeFoto, setMensajeFoto] = useState({ tipo: '', texto: '' });
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const inputFoto = useRef(null);

  const foto = usuario?.foto || usuario?.foto_perfil || null;

  useEffect(() => {
    if (usuario) {
      setDatos({
        nombre: usuario.nombre || '',
        email: usuario.email || usuario.email_institucional || '',
        carrera: usuario.carrera_nombre || 'Sin asignar'
      });
    }
  }, [usuario]);

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
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-[#701330] mb-6">Mi Perfil</h2>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
        <div className="space-y-6">
          {/* Foto de perfil */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Foto de Perfil</h3>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative">
                {foto || previewFoto ? (
                  <img
                    src={previewFoto || foto}
                    alt={usuario?.nombre}
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#701330]/20 shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-[#701330] flex items-center justify-center text-white font-bold text-3xl border-4 border-[#701330]/20 shadow-md">
                    {getInitials(usuario?.nombre)}
                  </div>
                )}
              </div>
              <div className="flex-1 w-full">
                {previewFoto && (
                  <div className="mb-3 flex gap-2">
                    <button
                      onClick={guardarFoto}
                      disabled={subiendoFoto}
                      className="flex-1 px-4 py-2 bg-[#701330] hover:bg-[#912347] text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                    >
                      {subiendoFoto ? 'Guardando...' : 'Guardar foto'}
                    </button>
                    <button
                      onClick={() => { setPreviewFoto(null); inputFoto.current.value = ''; }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                <button
                  onClick={() => inputFoto.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 border-2 border-dashed border-gray-300 hover:border-[#701330] hover:text-[#701330] rounded-lg text-gray-600 transition-colors text-sm"
                >
                  {previewFoto ? 'Elegir otra imagen' : foto ? 'Cambiar foto' : 'Subir foto'}
                </button>
                <input
                  ref={inputFoto}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={seleccionarFoto}
                />
                <p className="text-xs text-gray-400 mt-2">JPG o PNG, máximo 2MB</p>
                {mensajeFoto.texto && (
                  <p className={`mt-2 text-sm ${mensajeFoto.tipo === 'exito' ? 'text-green-600' : 'text-red-600'}`}>
                    {mensajeFoto.texto}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Tu foto se mostrará en el encabezado, en tus solicitudes y notificaciones.
            </p>
          </div>

          {/* Datos de usuario */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Datos de Usuario</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Nombre completo</label>
                <input type="text" className="input" value={datos.nombre} readOnly />
              </div>
              <div>
                <label className="label">Correo institucional</label>
                <input type="email" className="input" value={datos.email} readOnly />
              </div>
              <div>
                <label className="label">Carrera</label>
                <input type="text" className="input" value={datos.carrera} readOnly />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
          {mensaje.texto && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {mensaje.texto}
            </div>
          )}
          <form onSubmit={cambiarContrasena} className="space-y-3">
            <div>
              <label className="label">Contraseña actual</label>
              <input type="password" className="input" value={contrasena.actual} onChange={e => setContrasena({...contrasena, actual: e.target.value})} required />
            </div>
            <div>
              <label className="label">Nueva contraseña</label>
              <input type="password" className="input" value={contrasena.nueva} onChange={e => setContrasena({...contrasena, nueva: e.target.value})} required />
            </div>
            <div>
              <label className="label">Confirmar nueva contraseña</label>
              <input type="password" className="input" value={contrasena.confirmar} onChange={e => setContrasena({...contrasena, confirmar: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2">Actualizar contraseña</button>
          </form>
        </div>
      </div>
    </div>
  );
}
