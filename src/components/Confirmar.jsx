export default function Confirmar({ abierto, titulo, mensaje, textoConfirmar = 'Confirmar', tipo = 'peligro', cargando = false, onCancelar, onConfirmar }) {
  if (!abierto) return null;

  const colorBoton = tipo === 'peligro' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#701330] hover:bg-[#912347]';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={cargando ? undefined : onCancelar}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${tipo === 'peligro' ? 'bg-red-100' : 'bg-amber-100'}`}>
            <svg className={`w-6 h-6 ${tipo === 'peligro' ? 'text-red-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{titulo}</h3>
            <p className="text-sm text-gray-600 mt-1">{mensaje}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${colorBoton}`}
          >
            {cargando && (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
