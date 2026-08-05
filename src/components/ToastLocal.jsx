import { useEffect, useState } from 'react';

export default function ToastLocal({ alerta, onCerrar }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!alerta?.mostrar) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onCerrar, 300);
    }, 4000);
    return () => clearTimeout(t);
  }, [alerta, onCerrar]);

  if (!alerta?.mostrar) return null;

  const estilos = alerta.tipo === 'exito'
    ? 'bg-green-50 border-l-4 border-green-600 text-green-900'
    : 'bg-red-50 border-l-4 border-red-600 text-red-900';

  return (
    <div className={`fixed top-4 right-4 z-[70] max-w-md w-full px-4 transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
      <div className={`${estilos} p-4 rounded-lg shadow-lg flex items-start gap-3 animate-fadeIn`}>
        {alerta.tipo === 'exito' ? (
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <p className="text-sm font-medium flex-1">{alerta.mensaje}</p>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
