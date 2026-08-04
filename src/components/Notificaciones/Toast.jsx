import { useEffect, useState } from 'react';
import socket from '../../api/socket';

export default function Toast() {
  const [lista, setLista] = useState([]);

  useEffect(() => {
    const manejarActualizacion = (datos) => {
      console.log('Notificacion recibida:', datos);
      const nueva = {
        id: Date.now() + Math.random(),
        mensaje: datos.mensaje || 'Notificacion',
        tipo: datos.tipo || 'info'
      };
      setLista(prev => [nueva, ...prev]);
      setTimeout(() => {
        setLista(prev => prev.filter(n => n.id !== nueva.id));
      }, 5000);
    };

    socket.on('actualizacion', manejarActualizacion);

    return () => {
      socket.off('actualizacion', manejarActualizacion);
    };
  }, []);

  const getColor = (tipo) => {
    switch(tipo) {
      case 'exito': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      case 'alerta': return 'bg-yellow-500';
      case 'nueva_solicitud': return 'bg-blue-600';
      case 'cambio_estado_solicitud': return 'bg-purple-600';
      default: return 'bg-[#701330]';
    }
  };

  if (lista.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {lista.map(notif => (
        <div 
          key={notif.id} 
          className={`toast ${getColor(notif.tipo)} text-white p-3 rounded-lg shadow-lg animate-slideDown`}
        >
          <div className="flex justify-between items-center gap-3">
            <p className="text-sm flex-1">{notif.mensaje}</p>
            <button 
              onClick={() => setLista(prev => prev.filter(n => n.id !== notif.id))} 
              className="text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}