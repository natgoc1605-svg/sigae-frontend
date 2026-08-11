// context/TemaContext.jsx - Modo claro/noche y tamaño de letra global
import { createContext, useContext, useEffect, useState } from 'react';

const TemaContext = createContext(null);

const TAMANOS = {
  normal: 15,
  mediano: 17,
  grande: 19,
};

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem('sigae_tema') || 'claro');
  const [tamanoLetra, setTamanoLetra] = useState(() => localStorage.getItem('sigae_tamano_letra') || 'normal');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', tema === 'oscuro');
    localStorage.setItem('sigae_tema', tema);
  }, [tema]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('tamano-mediano', 'tamano-grande');
    if (tamanoLetra !== 'normal') root.classList.add(`tamano-${tamanoLetra}`);
    root.style.setProperty('--tamano-base', `${TAMANOS[tamanoLetra] || TAMANOS.normal}px`);
    localStorage.setItem('sigae_tamano_letra', tamanoLetra);
  }, [tamanoLetra]);

  return (
    <TemaContext.Provider value={{ tema, setTema, tamanoLetra, setTamanoLetra }}>
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