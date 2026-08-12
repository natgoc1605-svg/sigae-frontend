// context/TemaContext.jsx - Modo claro/noche y tamaño de letra global
import { createContext, useContext, useEffect, useState } from 'react';

const TemaContext = createContext(null);

const TAMANOS = {
  normal: 15,
  mediano: 17,
  grande: 19,
};

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => {
    const stored = localStorage.getItem('sigae_tema');
    // Detectar preferencia del sistema si no hay almacenado
    if (!stored) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
    }
    return stored;
  });
  const [tamanoLetra, setTamanoLetra] = useState(() => 
    localStorage.getItem('sigae_tamano_letra') || 'normal'
  );

  useEffect(() => {
    const root = document.documentElement;
    
    // Aplicar tema
    if (tema === 'oscuro') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sigae_tema', tema);
    
    // Forzar actualización de estilos
    document.body.style.backgroundColor = tema === 'oscuro' ? '#111827' : '#f3f4f6';
  }, [tema]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('tamano-mediano', 'tamano-grande');
    if (tamanoLetra !== 'normal') {
      root.classList.add(`tamano-${tamanoLetra}`);
    }
    root.style.setProperty('--tamano-base', `${TAMANOS[tamanoLetra] || TAMANOS.normal}px`);
    localStorage.setItem('sigae_tamano_letra', tamanoLetra);
  }, [tamanoLetra]);

  // Escuchar cambios en preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!localStorage.getItem('sigae_tema')) {
        setTema(e.matches ? 'oscuro' : 'claro');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleTema = () => {
    setTema(prev => prev === 'claro' ? 'oscuro' : 'claro');
  };

  return (
    <TemaContext.Provider value={{ 
      tema, 
      setTema, 
      tamanoLetra, 
      setTamanoLetra,
      toggleTema 
    }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) {
    throw new Error('useTema debe usarse dentro de TemaProvider');
  }
  return ctx;
}