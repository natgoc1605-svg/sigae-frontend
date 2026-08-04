import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Configuracion() {
  const [turnos, setTurnos] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const [resTurnos, resBloques, resTipos] = await Promise.all([
          api.get('/api/turnos'),
          api.get('/api/bloques-horarios'),
          api.get('/api/tipos-aula')
        ]);
        setTurnos(resTurnos.data || []);
        setBloques(resBloques.data || []);
        setTipos(resTipos.data || []);
      } catch (err) {
        console.error('Error cargando configuración:', err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const formatHora = (h) => {
    if (!h) return '';
    const [hh, mm] = String(h).split(':');
    return `${hh}:${mm}`;
  };

  const bloquesPorTurno = turnos.map(t => ({
    ...t,
    bloques: bloques.filter(b => b.id_turno === t.id_turno)
  }));

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#701330]">Configuración del Sistema</h2>
        <p className="text-sm text-gray-500 mt-1">Catálogos base: turnos, bloques horarios y tipos de aula</p>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#701330] border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Turnos y bloques horarios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-1">Bloques Horarios por Turno</h3>
            <p className="text-sm text-gray-500 mb-4">Distribución de bloques y horarios base del sistema</p>

            {bloquesPorTurno.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Sin turnos registrados</p>
            ) : (
              <div className="space-y-5">
                {bloquesPorTurno.map(t => (
                  <div key={t.id_turno}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">{t.nombre_turno}</span>
                      <span className="text-xs bg-[#701330]/10 text-[#701330] px-2.5 py-1 rounded-full font-medium">
                        {t.bloques.length} bloques
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {t.bloques.map(b => (
                        <div key={b.id_bloque} className="flex items-center justify-between bg-white rounded-md border border-gray-100 px-3 py-1.5 text-sm">
                          <span className="text-gray-400">#{b.id_bloque}</span>
                          <span className="font-medium text-gray-700">{formatHora(b.hora_inicio)} – {formatHora(b.hora_fin)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tipos de aula */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-1">Tipos de Aula</h3>
            <p className="text-sm text-gray-500 mb-4">Clasificación de espacios del campus</p>

            {tipos.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Sin tipos registrados</p>
            ) : (
              <div className="space-y-2">
                {tipos.map(t => (
                  <div key={t.id_tipo} className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-100 px-4 py-3">
                    <span className="font-medium text-gray-800">{t.nombre_tipo}</span>
                    <span className="text-xs text-gray-400">ID {t.id_tipo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
