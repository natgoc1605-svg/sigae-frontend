import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function NuevaSolicitud({ cerrar, onCreada }) {
  const { usuario } = useAuth();
  const [form, setForm] = useState({
    id_aula: '',
    fecha_solicitud: '',
    turno: 'Matutino',
    motivo: '',
    id_carrera: usuario?.id_carrera || ''
  });
  const [aulas, setAulas] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    const cargarAulas = async () => {
      try {
        const res = await api.get('/api/infraestructura/aulas-estado');
        setAulas(res.data || []);
      } catch (err) {
        console.error('Error al cargar aulas:', err);
        setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los espacios disponibles' });
      }
    };
    cargarAulas();
  }, []);

  useEffect(() => {
    const cargarCarreras = async () => {
      try {
        const res = await api.get('/api/solicitudes-espacio/carreras');
        const lista = res.data || [];
        setCarreras(lista);
        setForm(prev => {
          const coincide = lista.some(c => String(c.id_carrera) === String(prev.id_carrera));
          if (coincide || prev.id_carrera) return { ...prev, id_carrera: prev.id_carrera ? String(prev.id_carrera) : '' };
          if (lista.length === 1) return { ...prev, id_carrera: String(lista[0].id_carrera) };
          return prev;
        });
      } catch (err) {
        console.error('Error al cargar carreras:', err);
      }
    };
    cargarCarreras();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);

    // Log para depurar la fecha
    console.log('Fecha seleccionada (valor del input):', form.fecha_solicitud);
    // Verificar la fecha local
    if (form.fecha_solicitud) {
      const fechaObj = new Date(form.fecha_solicitud + 'T00:00:00');
      console.log('Fecha interpretada localmente:', fechaObj.toLocaleDateString('es-MX'));
    }

    try {
      await api.post('/api/solicitudes-espacio', form);
      setMensaje({ tipo: 'exito', texto: 'Solicitud enviada correctamente' });
      if (onCreada) onCreada();
      setTimeout(cerrar, 1200);
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      const errorMsg = err.response?.data?.detail || 'Error al procesar la solicitud';
      setMensaje({ tipo: 'error', texto: errorMsg });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start gap-3 p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="w-10 h-10 rounded-lg bg-[#701330]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Nueva Solicitud</h3>
            <p className="text-sm text-gray-500 mt-0.5">Completa los datos para solicitar un aula</p>
          </div>
          <button
            onClick={cerrar}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            title="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {mensaje && (
            <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-3 ${
              mensaje.tipo === 'exito'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {mensaje.tipo === 'exito' ? (
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Espacio / Aula <span className="text-red-500">*</span>
            </label>
            <select
              value={form.id_aula}
              onChange={(e) => setForm({ ...form, id_aula: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 focus:border-[#701330] transition-all bg-white"
              required
            >
              <option value="">Selecciona un espacio</option>
              {aulas.map(a => (
                <option key={a.id_aula} value={a.id_aula}>
                  {a.nombre_aula} ({a.nombre_edificio}) - {a.estado}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Carrera <span className="text-red-500">*</span>
            </label>
            <select
              value={form.id_carrera}
              onChange={(e) => setForm({ ...form, id_carrera: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 focus:border-[#701330] transition-all bg-white"
              required
            >
              <option value="">Selecciona la carrera</option>
              {carreras.map(c => (
                <option key={c.id_carrera} value={String(c.id_carrera)}>
                  {c.nombre_carrera}{c.sigla ? ` (${c.sigla})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha de uso <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.fecha_solicitud}
              onChange={(e) => setForm({ ...form, fecha_solicitud: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 focus:border-[#701330] transition-all"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Turno <span className="text-red-500">*</span>
            </label>
            <select
              value={form.turno}
              onChange={(e) => setForm({ ...form, turno: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 focus:border-[#701330] transition-all bg-white"
              required
            >
              <option value="Matutino">Matutino (07:00 - 15:10)</option>
              <option value="Vespertino">Vespertino (15:20 - 21:10)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Motivo de la solicitud <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 focus:border-[#701330] transition-all resize-none"
              placeholder="Describe el motivo, cantidad de alumnos y equipo necesario..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100 -mx-5 mt-5">
            <button
              type="button"
              onClick={cerrar}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-4 py-2 bg-[#701330] hover:bg-[#912347] text-white rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {enviando ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar Solicitud'
              )}
            </button>
          </div>
          </form>
        </div>
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
          from { opacity: 0; transform: translateY(-8px); }
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