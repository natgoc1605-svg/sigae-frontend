import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';

export default function Login() {
  const { usuario, iniciarSesion } = useAuth();
  const { tema } = useTema();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [animar, setAnimar] = useState(false);
  const isDark = tema === 'oscuro';

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
        background: isDark 
          ? `
            radial-gradient(circle at top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.95) 100%),
            url('/logoUtvt.png')
          `
          : `
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
      {/* Efectos de luz difusa */}
      <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none ${
        isDark ? 'bg-white/5' : 'bg-white/4'
      }`}></div>
      <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[110px] pointer-events-none ${
        isDark ? 'bg-white/4' : 'bg-white/3'
      }`}></div>

      {/* Tarjeta */}
      <div 
        className={`w-full max-w-md transition-all duration-1000 ease-out ${
          animar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className={`${
          isDark 
            ? 'bg-gray-800/90 backdrop-blur-lg border-gray-700/50' 
            : 'bg-white/50 backdrop-blur-lg border-white/5'
        } rounded-[24px] shadow-[0_30px_70px_rgba(0,0,0,0.35)] p-9 relative overflow-hidden border`}>

          {/* Logos */}
          <div className="flex flex-col items-center gap-6 mb-8 relative z-10">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center p-2 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              isDark ? 'bg-[#701330]/20' : 'bg-[#B32338]/10'
            }`}>
              <img 
                src="cuervo.jpg" 
                alt="Gobierno del Estado de México" 
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="%23B32338" stroke-width="2"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/%3E%3C/svg%3E';
                }}
              />
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-8 relative z-10">
            <h1 className={`text-[36px] font-extrabold tracking-wide ${
              isDark ? 'text-[#e59daa]' : 'text-[#701330]'
            }`}>SIGAE</h1>
            <p className={`mt-3 text-[15px] font-normal ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Sistema Integral de Gestión y Administración de Espacios
            </p>
            <p className={`text-sm mt-1 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Universidad Tecnológica del Valle de Toluca
            </p>
            <div className={`w-44 h-[1.5px] mx-auto mt-5 rounded-full ${
              isDark ? 'bg-[#e59daa]' : 'bg-[#701330]'
            }`}></div>
          </div>

          {/* Error */}
          {error && (
            <div className={`mb-6 p-3 border-l-4 rounded-md text-sm animate-shake ${
              isDark 
                ? 'bg-red-900/30 border-red-500 text-red-300' 
                : 'bg-red-50 border-red-600 text-red-800'
            }`}>
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="group">
              <label htmlFor="email" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                isDark 
                  ? 'text-gray-300 group-focus-within:text-[#e59daa]' 
                  : 'text-gray-700 group-focus-within:text-[#701330]'
              }`}>
                Correo Institucional
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                  isDark
                    ? 'bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-[#e59daa]/30 focus:border-[#e59daa]'
                    : 'bg-blue-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-[#701330]/30 focus:border-[#701330] focus:bg-white'
                }`}
                placeholder="ejemplo@utvtol.edu.mx"
                required
                disabled={cargando}
              />
            </div>

            <div className="group">
              <label htmlFor="password" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                isDark 
                  ? 'text-gray-300 group-focus-within:text-[#e59daa]' 
                  : 'text-gray-700 group-focus-within:text-[#701330]'
              }`}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                  isDark
                    ? 'bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-[#e59daa]/30 focus:border-[#e59daa]'
                    : 'bg-blue-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-[#701330]/30 focus:border-[#701330] focus:bg-white'
                }`}
                placeholder="Ingrese su contraseña"
                required
                disabled={cargando}
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/recuperar-contrasena')}
                className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                  isDark ? 'text-[#e59daa] hover:text-[#f0b3bd]' : 'text-[#701330] hover:text-[#9a1a42]'
                }`}
                disabled={cargando}
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className={`w-full text-white font-semibold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group ${
                isDark ? 'bg-[#701330] hover:bg-[#912347]' : 'bg-[#701330] hover:bg-[#8a183c]'
              }`}
            >
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

          {/* Footer */}
          <div className={`mt-9 text-center text-sm relative z-10 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>© {new Date().getFullYear()} Universidad Tecnológica del Valle de Toluca</p>
            <p className={`mt-1 font-medium ${
              isDark ? 'text-[#e59daa]' : 'text-[#701330]'
            }`}>Gobierno del Estado de México</p>
          </div>
        </div>
      </div>

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