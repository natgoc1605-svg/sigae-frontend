import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { usuario, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    setAnimar(true);
  }, []);

  if (usuario) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await iniciarSesion(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.mensaje || 'Correo o contraseña incorrectos. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div 
  className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
  style={{ 
    background: `
      radial-gradient(circle at top, rgba(112,19,48,0.5) 0%, rgba(88,16,38,0.5) 40%, rgba(63,12,29,0.9) 100%),
      url('/logoUtvt.png')
    `,
    backgroundSize: 'cover, cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  }}
>
      {/* Efectos de luz difusa para dar sensación de espacio */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/4 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/3 rounded-full blur-[110px] pointer-events-none"></div>

      {/* Tarjeta con animación de entrada suave */}
      <div 
        className={`w-full max-w-md transition-all duration-1000 ease-out ${
          animar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        
        <div className="bg-white/50 backdrop-blur-lg rounded-[24px] shadow-[0_30px_70px_rgba(0,0,0,0.35)] p-9 relative overflow-hidden border border-white/5">

          {/* Logos: IGUAL A TU DISEÑO */}
          <div className="flex items-center justify-center gap-5 mb-8 relative z-10">
            <img 
              src="logoUtvt.png"
              alt="Gobierno del Estado de México" 
              className="h-12 w-auto object-contain"
            />
            <div className="w-[1px] h-14 bg-black-200"></div>
            <img 
              src="https://i.ytimg.com/vi/y0_7Q1fpbHc/maxresdefault.jpg"
              alt="UTVT" 
              className="h-16 w-auto rounded-md shadow-sm object-cover"
            />
          </div>

          {/* Título y descripción */}
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-[36px] font-extrabold text-[#701330] tracking-wide">SIGAE</h1>
            <p className="text-black-600 mt-3 text-[15px] font-normal">
              Sistema Integral de Gestión y Administración de Espacios
            </p>
            <p className="text-black-500 text-sm mt-1">
              Universidad Tecnológica del Valle de Toluca
            </p>
            <div className="w-44 h-[1.5px] bg-[#701330] mx-auto mt-5 rounded-full"></div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-md text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-black-700 mb-2 transition-colors duration-200 group-focus-within:text-[#701330]">
                Correo Institucional
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-blue-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all duration-300"
                placeholder="ejemplo@utvtol.edu.mx"
                required
                disabled={cargando}
              />
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-black-700 mb-2 transition-colors duration-200 group-focus-within:text-[#701330]">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-blue-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all duration-300"
                placeholder="Ingrese su contraseña"
                required
                disabled={cargando}
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/recuperar-contrasena')}
                className="text-sm font-medium text-[#701330] hover:text-[#9a1a42] transition-colors duration-200 hover:underline"
                disabled={cargando}
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#701330] hover:bg-[#8a183c] text-white font-semibold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {/* Efecto de brillo en botón */}
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {cargando ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </span>
            </button>
          </form>

          {/* Pie de página */}
          <div className="mt-9 text-center text-sm text-black-500 relative z-10">
            <p>© {new Date().getFullYear()} Universidad Tecnológica del Valle de Toluca</p>
            <p className="mt-1 font-medium text-[#701330]">Gobierno del Estado de México</p>
          </div>
        </div>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}