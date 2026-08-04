/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        utvt: {
          guinda: '#701330',
          guindaClaro: '#901a40',
          fondo: '#F8F5F6',
          texto: '#222222',
          blanco: '#FFFFFF',
          grisClaro: '#E5E7EB',
          grisMedio: '#9CA3AF',
          grisOscuro: '#4B5563'
        },
        estado: {
          pendiente: '#F59E0B',
          aprobada: '#15803D',
          rechazada: '#DC2626',
        }
      },
      fontFamily: {
        utvt: ['Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}