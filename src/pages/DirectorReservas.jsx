import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserId, isDirector, isSuperAdmin } from '../utils/auth';
import api from '../api/axios';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const BLOQUES = [
  { id: 1, hora: '07:00 – 07:50', inicio: '07:00', fin: '07:50', turno: 'matutino' },
  { id: 2, hora: '07:50 – 08:40', inicio: '07:50', fin: '08:40', turno: 'matutino' },
  { id: 3, hora: '08:40 – 09:30', inicio: '08:40', fin: '09:30', turno: 'matutino' },
  { id: 4, hora: '09:30 – 10:20', inicio: '09:30', fin: '10:20', turno: 'matutino' },
  { id: 5, hora: '10:20 – 11:10', inicio: '10:20', fin: '11:10', turno: 'matutino' },
  { id: 6, hora: '11:10 – 12:00', inicio: '11:10', fin: '12:00', turno: 'matutino' },
  { id: 7, hora: '12:00 – 12:50', inicio: '12:00', fin: '12:50', turno: 'matutino' },
  { id: 8, hora: '12:50 – 13:40', inicio: '12:50', fin: '13:40', turno: 'matutino' },
  { id: 9, hora: '13:40 – 14:30', inicio: '13:40', fin: '14:30', turno: 'matutino' },
  { id: 10, hora: '14:30 – 15:10', inicio: '14:30', fin: '15:10', turno: 'matutino' },
  { id: 11, hora: '15:20 – 16:10', inicio: '15:20', fin: '16:10', turno: 'vespertino' },
  { id: 12, hora: '16:10 – 17:00', inicio: '16:10', fin: '17:00', turno: 'vespertino' },
  { id: 13, hora: '17:00 – 17:50', inicio: '17:00', fin: '17:50', turno: 'vespertino' },
  { id: 14, hora: '17:50 – 18:40', inicio: '17:50', fin: '18:40', turno: 'vespertino' },
  { id: 15, hora: '18:40 – 19:30', inicio: '18:40', fin: '19:30', turno: 'vespertino' },
  { id: 16, hora: '19:30 – 20:20', inicio: '19:30', fin: '20:20', turno: 'vespertino' },
  { id: 17, hora: '20:20 – 21:10', inicio: '20:20', fin: '21:10', turno: 'vespertino' },
];

const PALETA_PASTEL_VARIADA = [
  { h: 340, s: 45, l: 82 }, { h: 350, s: 40, l: 78 }, { h: 5, s: 50, l: 75 },
  { h: 15, s: 45, l: 75 }, { h: 25, s: 55, l: 75 }, { h: 35, s: 50, l: 72 },
  { h: 40, s: 45, l: 70 }, { h: 45, s: 50, l: 68 }, { h: 50, s: 55, l: 65 },
  { h: 55, s: 50, l: 62 }, { h: 70, s: 45, l: 60 }, { h: 85, s: 50, l: 58 },
  { h: 105, s: 45, l: 58 }, { h: 125, s: 40, l: 58 }, { h: 145, s: 45, l: 62 },
  { h: 165, s: 50, l: 65 }, { h: 180, s: 55, l: 65 }, { h: 195, s: 55, l: 65 },
  { h: 210, s: 50, l: 62 }, { h: 220, s: 45, l: 58 }, { h: 230, s: 50, l: 58 },
  { h: 245, s: 50, l: 62 }, { h: 260, s: 45, l: 62 }, { h: 275, s: 40, l: 58 },
  { h: 290, s: 35, l: 58 }, { h: 305, s: 40, l: 62 }, { h: 320, s: 45, l: 68 },
  { h: 335, s: 50, l: 72 }, { h: 15, s: 35, l: 58 }, { h: 25, s: 30, l: 55 },
  { h: 35, s: 25, l: 52 }, { h: 45, s: 20, l: 48 },
];

function generarColorBase(texto) {
  if (!texto) return `hsl(340, 45%, 82%)`;
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % PALETA_PASTEL_VARIADA.length);
  const color = PALETA_PASTEL_VARIADA[index];
  const variacion = (hash % 10) - 5;
  const sFinal = Math.min(65, Math.max(25, color.s + variacion));
  const lFinal = Math.min(85, Math.max(55, color.l + (variacion * 0.3)));
  return `hsl(${color.h}, ${sFinal}%, ${lFinal}%)`;
}

function oscurecerColor(hexColor, porcentaje = 30) {
  if (!hexColor) return '#6B7280';
  if (hexColor.startsWith('hsl')) {
    const match = hexColor.match(/hsl\(([^,]+),\s*([^%]+)%,\s*([^%]+)%\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = Math.max(0, parseInt(match[3]) - porcentaje);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    return hexColor;
  }
  const hex = hexColor.replace('#', '');
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  r = Math.max(0, r - porcentaje);
  g = Math.max(0, g - porcentaje);
  b = Math.max(0, b - porcentaje);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function esColorClaro(hexColor) {
  if (!hexColor) return true;
  if (hexColor.startsWith('hsl')) {
    const match = hexColor.match(/hsl\(([^,]+),\s*([^%]+)%,\s*([^%]+)%\)/);
    if (match) {
      const l = parseInt(match[3]);
      return l > 55;
    }
    return true;
  }
  const hex = hexColor.replace('#', '');
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function obtenerColorContraste(hexColor) {
  return esColorClaro(hexColor) ? '#1A202C' : '#FFFFFF';
}

function obtenerColorMateria(evento) {
  let colorBase = evento?.color || evento?.materia_color || null;
  if (!colorBase || colorBase === '#FDF2F6' || colorBase === '#e2e8f0' || colorBase === '#701330') {
    const nombre = evento?.nombre_materia || evento?.sigla_materia || 'default';
    colorBase = generarColorBase(nombre);
  }
  return {
    fondo: colorBase,
    borde: oscurecerColor(colorBase, 30),
    texto: obtenerColorContraste(colorBase)
  };
}

export default function DirectorReservas() {
  const { usuario } = useAuth();
  const location = useLocation();
  const [edificios, setEdificios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [edificioSeleccionado, setEdificioSeleccionado] = useState('');
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [horario, setHorario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalReserva, setModalReserva] = useState({ abierto: false, dia: null, bloque: null });
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });
  const [enviando, setEnviando] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [respondiendo, setRespondiendo] = useState(null);
  const [resaltarSolicitud, setResaltarSolicitud] = useState(null);
  const [modalRechazoPropuesta, setModalRechazoPropuesta] = useState(null);

  const idDirector = getUserId(usuario);

  const [cantidadHoras, setCantidadHoras] = useState(1);
  const [horaFinSeleccionada, setHoraFinSeleccionada] = useState(null);
  const [maxHorasDisponibles, setMaxHorasDisponibles] = useState(1);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');

  const verificarHorasDisponibles = (dia, bloqueInicio) => {
    const turno = bloqueInicio.turno;
    const bloquesTurno = BLOQUES.filter(b => b.turno === turno);
    const indexInicio = bloquesTurno.findIndex(b => b.id === bloqueInicio.id);
    
    if (indexInicio === -1) return 0;
    
    let horasDisponibles = 0;
    for (let i = 0; i < bloquesTurno.length - indexInicio; i++) {
      const idx = indexInicio + i;
      const bloque = bloquesTurno[idx];
      if (!isBloqueOcupado(dia, bloque)) {
        horasDisponibles++;
      } else {
        break;
      }
    }
    return horasDisponibles;
  };

  const isBloqueOcupado = (dia, bloque) => {
    return horario.some(e => {
      const diaCoincide = normalizarTexto(e.dia_semana || e.dia) === normalizarTexto(dia);
      const horaCoincide = normalizarHora(e.hora_inicio) === normalizarHora(bloque.inicio);
      return diaCoincide && horaCoincide;
    });
  };

  useEffect(() => {
    if (modalReserva.abierto && modalReserva.bloque && modalReserva.dia) {
      const disponibles = verificarHorasDisponibles(modalReserva.dia, modalReserva.bloque);
      setMaxHorasDisponibles(disponibles);
      
      if (cantidadHoras > disponibles) {
        setCantidadHoras(Math.min(disponibles, 1));
      }
    }
  }, [modalReserva.abierto, modalReserva.bloque, modalReserva.dia, horario]);

  useEffect(() => {
    if (!usuario) return;
    if (!isDirector(usuario) && !isSuperAdmin(usuario)) {
      console.warn('Usuario no tiene permisos de director. Rol:', usuario.rol);
      return;
    }
    if (idDirector === null || idDirector === undefined) {
      mostrarAlerta('error', 'No se pudo identificar al director.');
      setCargando(false);
      return;
    }
    cargarEdificios();
  }, [usuario]);

  useEffect(() => {
    if (modalReserva.abierto && modalReserva.bloque) {
      const turno = modalReserva.bloque.turno;
      const bloquesTurno = BLOQUES.filter(b => b.turno === turno);
      const indexActual = bloquesTurno.findIndex(b => b.id === modalReserva.bloque.id);
      
      if (indexActual !== -1) {
        const indexFin = Math.min(indexActual + cantidadHoras - 1, bloquesTurno.length - 1);
        if (indexFin < bloquesTurno.length) {
          setHoraFinSeleccionada(bloquesTurno[indexFin]);
        } else {
          setHoraFinSeleccionada(null);
        }
      }
    }
  }, [cantidadHoras, modalReserva.abierto, modalReserva.bloque]);

  const cargarEdificios = async () => {
    try {
      setCargando(true);
      const res = await api.get('/api/edificios');
      setEdificios(res.data || []);
      if (res.data.length > 0) {
        setEdificioSeleccionado(res.data[0].id_edificio);
        cargarAulas(res.data[0].id_edificio);
      }
    } catch (err) {
      mostrarAlerta('error', err.response?.data?.detail || 'Error al cargar edificios');
    } finally {
      setCargando(false);
    }
  };

  const cargarAulas = async (idEdificio) => {
    try {
      setCargando(true);
      const res = await api.get(`/api/infraestructura/aulas-estado?id_edificio=${idEdificio}`);
      setAulas(res.data || []);
    } catch (err) {
      mostrarAlerta('error', 'Error al cargar aulas');
    } finally {
      setCargando(false);
    }
  };

  const cargarHorarioAula = async (idAula) => {
    try {
      setCargando(true);
      const res = await api.get(`/api/infraestructura/aula/${idAula}/horario`);
      setHorario(res.data || []);
    } catch (err) {
      mostrarAlerta('error', 'Error al cargar horario');
    } finally {
      setCargando(false);
    }
  };

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ mostrar: true, tipo, mensaje });
    setTimeout(() => setAlerta({ mostrar: false, tipo: '', mensaje: '' }), 4500);
  };

  const cargarMisSolicitudes = async () => {
    try {
      setCargandoSolicitudes(true);
      const res = await api.get('/api/solicitudes-espacio?solo_mias=1');
      setMisSolicitudes(res.data || []);
    } catch (err) {
      console.error('Error al cargar mis solicitudes:', err);
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  useEffect(() => {
    if (!usuario) return;
    cargarMisSolicitudes();
    const intervalo = setInterval(cargarMisSolicitudes, 30000);
    window.addEventListener('nueva-notificacion', cargarMisSolicitudes);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener('nueva-notificacion', cargarMisSolicitudes);
    };
  }, [usuario]);

  useEffect(() => {
    const id = location.state?.idSolicitud;
    if (id) {
      setResaltarSolicitud(id);
      window.setTimeout(() => setResaltarSolicitud(null), 6000);
    }
  }, [location.state]);

  const responderPropuesta = async (solicitud, aceptar, observaciones = '') => {
    if (respondiendo) return;
    if (!aceptar) {
      setModalRechazoPropuesta({ solicitud, observaciones: '' });
      return;
    }
    try {
      setRespondiendo(solicitud.id_solicitud);
      await api.post(`/api/solicitudes-espacio/${solicitud.id_solicitud}/responder-propuesta`, {
        aceptar,
        observaciones
      });
      mostrarAlerta('exito', 'Propuesta aceptada. Tu reserva fue aprobada con el horario propuesto.');
      cargarMisSolicitudes();
    } catch (err) {
      console.error('Error al responder propuesta:', err);
      const detail = err.response?.data?.detail;
      mostrarAlerta('error', typeof detail === 'string' ? detail : (detail?.mensaje || 'No se pudo responder la propuesta'));
    } finally {
      setRespondiendo(null);
    }
  };

  const confirmarRechazoPropuesta = async () => {
    if (!modalRechazoPropuesta) return;
    const { solicitud, observaciones } = modalRechazoPropuesta;
    try {
      setRespondiendo(solicitud.id_solicitud);
      await api.post(`/api/solicitudes-espacio/${solicitud.id_solicitud}/responder-propuesta`, {
        aceptar: false,
        observaciones: observaciones || ''
      });
      setModalRechazoPropuesta(null);
      mostrarAlerta('exito', 'Propuesta rechazada. El responsable será notificado.');
      cargarMisSolicitudes();
    } catch (err) {
      console.error('Error al responder propuesta:', err);
      const detail = err.response?.data?.detail;
      mostrarAlerta('error', typeof detail === 'string' ? detail : (detail?.mensaje || 'No se pudo responder la propuesta'));
    } finally {
      setRespondiendo(null);
    }
  };

  const handleEdificioChange = (e) => {
    const id = parseInt(e.target.value);
    setEdificioSeleccionado(id);
    cargarAulas(id);
    setAulaSeleccionada(null);
    setHorario([]);
  };

  const handleAulaSelect = (aula) => {
    setAulaSeleccionada(aula);
    cargarHorarioAula(aula.id_aula);
  };

  const normalizarDia = (dia) => {
    if (!dia) return '';
    let d = dia.toLowerCase().trim();
    d = d.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
    const diasMap = {
      'lunes': 'lunes',
      'martes': 'martes',
      'miercoles': 'miercoles',
      'miércoles': 'miercoles',
      'jueves': 'jueves',
      'viernes': 'viernes',
      'sabado': 'sabado',
      'sábado': 'sabado'
    };
    return diasMap[d] || d;
  };

  const calcularProximaFecha = (dia) => {
    const diasSemana = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
    const diaLower = dia.toLowerCase().trim();
    const diaIndex = diasSemana.indexOf(diaLower);
    if (diaIndex === -1) return new Date().toISOString().split('T')[0];
    const hoy = new Date();
    const diff = (diaIndex - hoy.getDay() + 7) % 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diff);
    return fecha.toISOString().split('T')[0];
  };

  const solicitarReserva = async (dia, bloqueInicio, motivo, grupo, tutor, horas) => {
    if (enviando) return;
    if (!aulaSeleccionada) {
      mostrarAlerta('error', 'No hay un aula seleccionada');
      return;
    }

    const turno = bloqueInicio.turno;
    const bloquesTurno = BLOQUES.filter(b => b.turno === turno);
    const indexInicio = bloquesTurno.findIndex(b => b.id === bloqueInicio.id);
    
    if (indexInicio === -1) {
      mostrarAlerta('error', 'Error al identificar el bloque');
      return;
    }

    if (!fechaSeleccionada) {
      mostrarAlerta('error', 'Selecciona una fecha para la reserva');
      return;
    }

    for (let i = 0; i < horas; i++) {
      const idx = indexInicio + i;
      if (idx >= bloquesTurno.length) {
        mostrarAlerta('error', `No hay suficientes bloques disponibles (solo hay ${bloquesTurno.length - indexInicio})`);
        return;
      }
      const bloque = bloquesTurno[idx];
      if (isBloqueOcupado(dia, bloque)) {
        mostrarAlerta('error', `El bloque ${bloque.hora} ya está ocupado`);
        return;
      }
    }

    try {
      setEnviando(true);
      
      let color = '#FDF2F6';
      if (usuario && usuario.rol === 'superadmin') {
        color = '#FCD34D';
      }

      const bloqueFinal = bloquesTurno[indexInicio + horas - 1];
      const horaInicio = bloqueInicio.inicio + ':00';
      const horaFin = bloqueFinal.fin + ':00';
      const diaNormalizado = normalizarDia(dia);
      const fechaStr = fechaSeleccionada;
      
      await api.post('/api/director/solicitar-reserva', {
        id_director: idDirector,
        id_aula: aulaSeleccionada.id_aula,
        dia_semana: diaNormalizado,
        turno: turno,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        fecha_solicitud: fechaStr,
        observaciones: motivo,
        sigla_grupo: grupo || '',
        tutor_grupo: tutor || '',
        color: color,
        duracion_horas: horas,
        bloques: horas
      });
      
      mostrarAlerta('exito', `Solicitud de reserva de ${horas} hora(s) enviada correctamente`);
      setModalReserva({ abierto: false, dia: null, bloque: null });
      setCantidadHoras(1);
      setHoraFinSeleccionada(null);
      setMaxHorasDisponibles(1);
      setFechaSeleccionada('');
      cargarHorarioAula(aulaSeleccionada.id_aula);
    } catch (err) {
      console.error('Error al solicitar reserva:', err);
      mostrarAlerta('error', err.response?.data?.detail || err.message || 'Error al solicitar reserva');
    } finally {
      setEnviando(false);
    }
  };

  const normalizarTexto = (valor) => {
    if (!valor) return '';
    let texto = String(valor)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[:\s]+$/, "")
      .replace(/\s+/g, '');
    
    const diasMap = {
      'miercoles': 'miercoles',
      'miércoles': 'miercoles',
      'jueves': 'jueves',
      'viernes': 'viernes',
      'sabado': 'sabado',
      'sábado': 'sabado',
      'lunes': 'lunes',
      'martes': 'martes'
    };
    
    return diasMap[texto] || texto;
  };

  const normalizarHora = (hora) => {
    if (!hora) return '';
    let limpia = String(hora).trim()
      .replace(/:+$/, '')
      .replace(/^(\d):/, '0$1:')
      .replace(/\s+/g, '');
    if (limpia.includes(':')) {
      const partes = limpia.split(':');
      const hh = partes[0].padStart(2, '0');
      const mm = (partes[1] || '00').padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return limpia;
  };

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8 max-w-md w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">No has iniciado sesión</h2>
              <p className="text-sm text-gray-600 mt-0.5">Por favor, inicia sesión para continuar</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isDirector(usuario) && !isSuperAdmin(usuario)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Acceso Restringido</h2>
              <p className="text-sm text-gray-600 mt-0.5">No tienes permisos para acceder</p>
            </div>
          </div>
          <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
            Tu rol actual es: <strong className="text-red-800">{usuario.rol}</strong>
          </p>
        </div>
      </div>
    );
  }

  if (idDirector === null || idDirector === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Error de Autenticación</h2>
              <p className="text-sm text-gray-600 mt-0.5">No se pudo identificar al director</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">Por favor, cierra sesión y vuelve a iniciar.</p>
          <button 
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="w-full px-4 py-2.5 bg-[#701330] hover:bg-[#912347] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
          >
            Cerrar sesión y recargar
          </button>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-[#701330]/20 border-t-[#701330] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Cargando horario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Alerta flotante */}
        {alerta.mostrar && (
          <div className={`fixed top-4 right-4 z-[100] max-w-md w-full rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-fadeIn ${
            alerta.tipo === 'exito' ? 'bg-green-50 border-2 border-green-200 text-green-800' :
            alerta.tipo === 'error' ? 'bg-red-50 border-2 border-red-200 text-red-800' :
            'bg-blue-50 border-2 border-blue-200 text-blue-800'
          }`}>
            <div className={`p-1.5 rounded-full flex-shrink-0 ${
              alerta.tipo === 'exito' ? 'bg-green-200' : 
              alerta.tipo === 'error' ? 'bg-red-200' : 'bg-blue-200'
            }`}>
              {alerta.tipo === 'exito' ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : alerta.tipo === 'error' ? (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium flex-1">{alerta.mensaje}</span>
            <button 
              onClick={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#701330]/10 rounded-xl">
                <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Solicitar Reserva de Espacio
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Puedes solicitar reservas en cualquier edificio del campus
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mis Solicitudes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h2 className="font-semibold text-gray-800">Mis Solicitudes</h2>
              <span className="text-xs bg-[#701330]/10 text-[#701330] px-2.5 py-0.5 rounded-full font-medium">
                {misSolicitudes.length}
              </span>
            </div>
            <button
              onClick={cargarMisSolicitudes}
              className="text-xs text-gray-500 hover:text-[#701330] flex items-center gap-1.5 transition-colors duration-200 hover:scale-105"
              title="Actualizar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {cargandoSolicitudes && misSolicitudes.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-[#701330] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando solicitudes...</p>
              </div>
            ) : misSolicitudes.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Aún no has enviado solicitudes de reserva</p>
              </div>
            ) : (
              misSolicitudes.map((sol) => {
                const propuestaPendiente = sol.propuesta_estado === 'enviada';
                const propuestaBloque = BLOQUES.find(b => b.id === sol.propuesta_id_bloque);
                return (
                  <div
                    key={sol.id_solicitud}
                    className={`px-4 sm:px-6 py-3 transition-all duration-300 ${
                      resaltarSolicitud === sol.id_solicitud
                        ? 'bg-[#701330]/10 ring-2 ring-inset ring-[#701330]/40'
                        : propuestaPendiente
                        ? 'bg-amber-50/60 hover:bg-amber-50/80'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900">{sol.codigo_solicitud}</span>
                          <span className="text-xs text-gray-500">{sol.aula_nombre}</span>
                          {sol.edificio_nombre && (
                            <span className="text-xs text-gray-400">• {sol.edificio_nombre}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {sol.dia_semana_mostrar || ''}
                          {sol.fecha_solicitud ? ` • ${new Date(sol.fecha_solicitud + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}
                          {sol.hora_inicio_str && sol.hora_fin_str ? ` • ${sol.hora_inicio_str} - ${sol.hora_fin_str} hrs` : ''}
                        </div>
                        {sol.motivo && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{sol.motivo}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            sol.estado === 'Aprobada' ? 'bg-green-100 text-green-700' :
                            sol.estado === 'Rechazada' ? 'bg-red-100 text-red-700' :
                            sol.solicitante_rol === 'superadmin'
                              ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]'
                              : 'bg-[#CBD5E1] text-[#1F2937] border border-[#64748B]'
                          }`}>
                            {sol.estado}
                          </span>
                          {sol.propuesta_estado === 'enviada' && (
                            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Propuesta enviada
                            </span>
                          )}
                          {sol.propuesta_estado === 'aceptada' && (
                            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                              Propuesta aceptada
                            </span>
                          )}
                          {sol.propuesta_estado === 'rechazada' && (
                            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                              Propuesta rechazada
                            </span>
                          )}
                        </div>
                      </div>
                      {propuestaPendiente && (
                        <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => responderPropuesta(sol, true)}
                            disabled={respondiendo === sol.id_solicitud}
                            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 hover:scale-105"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Aceptar
                          </button>
                          <button
                            onClick={() => responderPropuesta(sol, false)}
                            disabled={respondiendo === sol.id_solicitud}
                            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition-all duration-200 disabled:opacity-50 hover:scale-105"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                    {propuestaPendiente && (
                      <div className="mt-2 bg-amber-100/70 border border-amber-200 rounded-xl px-4 py-2.5 text-xs">
                        <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          El responsable te propone otro horario:
                        </p>
                        <p className="text-amber-900 mt-0.5">
                          {sol.propuesta_fecha ? `${new Date(sol.propuesta_fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}
                          {propuestaBloque ? ` • Bloque ${propuestaBloque.id} (${propuestaBloque.hora})` : ''}
                        </p>
                        {sol.propuesta_observaciones && (
                          <p className="text-amber-700 mt-0.5 italic">"{sol.propuesta_observaciones}"</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selección y Horario */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Edificios y Aulas */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
                Edificio
              </label>
              <select
                value={edificioSeleccionado}
                onChange={handleEdificioChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all bg-white text-sm"
                disabled={edificios.length === 0}
              >
                <option value="">{edificios.length === 0 ? 'No hay edificios' : 'Seleccionar edificio'}</option>
                {edificios.map((e) => (
                  <option key={e.id_edificio} value={e.id_edificio}>{e.nombre_edificio}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3" />
                </svg>
                Espacios
                <span className="text-xs text-gray-400 font-normal ml-auto">{aulas.length}</span>
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {aulas.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    {cargando ? 'Cargando...' : 'No hay aulas en este edificio'}
                  </p>
                ) : (
                  aulas.map((aula) => (
                    <button
                      key={aula.id_aula}
                      onClick={() => handleAulaSelect(aula)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                        aulaSeleccionada?.id_aula === aula.id_aula
                          ? 'bg-[#701330] text-white shadow-md hover:shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                        aulaSeleccionada?.id_aula === aula.id_aula
                          ? 'bg-white/20 text-white'
                          : 'bg-[#701330]/10 text-[#701330]'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3m6 4h.01M14 12h.01" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">{aula.nombre_aula}</span>
                          {aula.nombre_tipo && aula.nombre_tipo !== 'Aula' && (
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              aula.nombre_tipo === 'Laboratorio'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {aula.nombre_tipo}
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] truncate ${
                          aulaSeleccionada?.id_aula === aula.id_aula ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          Planta {aula.planta} • Cap: {aula.capacidad} • {aula.estado}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Horario */}
          <div className="lg:col-span-3">
            {aulaSeleccionada ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
                <div className="mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900">{aulaSeleccionada.nombre_aula}</h2>
                        {aulaSeleccionada.nombre_tipo && aulaSeleccionada.nombre_tipo !== 'Aula' && (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            aulaSeleccionada.nombre_tipo === 'Laboratorio'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {aulaSeleccionada.nombre_tipo}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {aulaSeleccionada.nombre_edificio} • Planta {aulaSeleccionada.planta} • {aulaSeleccionada.capacidad} lugares
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                      Haz clic en celda verde para reservar
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                      <tr>
                        <th className="border-b-2 border-gray-200 bg-gray-50/80 p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28 sticky left-0 z-10">
                          Hora
                        </th>
                        {DIAS.map((dia) => (
                          <th key={dia} className="border-b-2 border-gray-200 bg-gray-50/80 p-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider capitalize min-w-[90px]">
                            {dia.slice(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {BLOQUES.map((bloque) => (
                        <tr key={bloque.inicio} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="border-b border-gray-100 p-2 text-xs font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-white z-10">
                            {bloque.hora}
                          </td>
                          {DIAS.map((dia) => {
                            const evento = horario.find((e) => {
                              const diaCoincide = normalizarTexto(e.dia_semana || e.dia) === normalizarTexto(dia);
                              const horaCoincide = normalizarHora(e.hora_inicio) === normalizarHora(bloque.inicio);
                              return diaCoincide && horaCoincide;
                            });
                            
                            let colores = null;
                            if (evento) {
                              colores = obtenerColorMateria(evento);
                            }
                            
                            return (
                              <td
                                key={dia}
                                className="border-b border-gray-100 p-1 align-top h-16 relative cursor-pointer hover:bg-gray-50/30 transition-all duration-150"
                                onClick={() => {
                                  if (!evento) {
                                    setModalReserva({
                                      abierto: true,
                                      dia: dia,
                                      bloque: bloque
                                    });
                                    setCantidadHoras(1);
                                    setHoraFinSeleccionada(null);
                                    setFechaSeleccionada(calcularProximaFecha(dia));
                                  }
                                }}
                              >
                                {evento ? (
                                  <div
                                    style={{ 
                                      backgroundColor: evento.pendiente ? '#FEF3C7' : (colores?.fondo || '#9CA3AF'),
                                      borderLeftColor: evento.pendiente ? '#F59E0B' : (colores?.borde || '#6B7280'),
                                      borderLeftWidth: '6px',
                                      color: evento.pendiente ? '#92400E' : (colores?.texto || '#1A202C')
                                    }}
                                    className="w-full h-full p-2 rounded-xl border-l-4 text-xs flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
                                  >
                                    {evento.pendiente ? (
                                      <>
                                        <div className="flex items-center gap-1">
                                          <span className="flex items-center gap-1 text-[8px] font-bold uppercase bg-white/60 px-1.5 py-0.5 rounded-full">
                                            <svg className="w-2.5 h-2.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            En espera
                                          </span>
                                        </div>
                                        <p className="font-semibold text-xs line-clamp-2">
                                          {evento.codigo_solicitud || 'Solicitud en espera'}
                                        </p>
                                        <div className="text-[10px] opacity-80">
                                          {evento.sigla_grupo && evento.sigla_grupo !== '---' ? evento.sigla_grupo : 'Pendiente'}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <p className="font-semibold text-xs line-clamp-2">
                                          {evento.nombre_materia || 'Reservado'}
                                        </p>
                                        <div className="text-[10px] opacity-80">
                                          {evento.nombre_docente || 'Sin docente'}
                                        </div>
                                        <div className="text-[9px] opacity-70">
                                          {evento.sigla_grupo || ''}
                                        </div>
                                      </>
                                    )}
                                    {evento.color === '#FCD34D' && (
                                      <div className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                                        Super Admin
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center rounded-xl border-2 border-dashed border-green-300 hover:border-green-600 hover:bg-green-50 transition-all duration-300 bg-green-100/30 group">
                                    <span className="text-green-600 text-xs font-medium group-hover:scale-105 transition-transform duration-200">
                                      Disponible
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center bg-gray-50 py-2.5 rounded-xl border border-gray-100">
                  Las solicitudes serán revisadas por el responsable del edificio
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-[#701330]/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3m6 4h.01M14 12h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecciona un aula</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Elige un edificio y un aula para ver su horario y solicitar reservas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Reserva */}
        {modalReserva.abierto && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
              <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#701330]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#701330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Solicitar Reserva</h3>
                    <p className="text-sm text-gray-500 mt-0.5 capitalize">
                      {modalReserva.dia} • {modalReserva.bloque?.hora} • {aulaSeleccionada?.nombre_aula}
                    </p>
                    {fechaSeleccionada && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                    {horaFinSeleccionada && cantidadHoras > 1 && (
                      <p className="text-xs text-blue-600 mt-0.5">
                        Hasta: {horaFinSeleccionada.hora} ({cantidadHoras} horas)
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="font-medium">Disponible:</span> {maxHorasDisponibles} hora(s) consecutivas
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setModalReserva({ abierto: false, dia: null, bloque: null });
                      setCantidadHoras(1);
                      setHoraFinSeleccionada(null);
                      setMaxHorasDisponibles(1);
                      setFechaSeleccionada('');
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all duration-300 hover:rotate-90"
                    disabled={enviando}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración de la reserva
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((horas) => (
                      <button
                        key={horas}
                        type="button"
                        onClick={() => {
                          if (maxHorasDisponibles >= horas) {
                            setCantidadHoras(horas);
                          } else {
                            mostrarAlerta('error', `No hay suficientes bloques disponibles para ${horas} horas consecutivas`);
                          }
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-medium transition-all duration-200 ${
                          cantidadHoras === horas
                            ? 'bg-[#701330] text-white shadow-md'
                            : maxHorasDisponibles >= horas
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={enviando || maxHorasDisponibles < horas}
                        title={maxHorasDisponibles < horas ? 'No hay suficientes bloques disponibles' : ''}
                      >
                        {horas} Hora{horas > 1 ? 's' : ''}
                        {maxHorasDisponibles < horas && (
                          <span className="text-[8px] block text-gray-400">No disponible</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {horaFinSeleccionada && cantidadHoras > 1 && (
                    <p className="text-xs text-gray-500 mt-2">
                      <span className="font-medium">Rango:</span> {modalReserva.bloque?.hora} - {horaFinSeleccionada.hora}
                    </p>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    solicitarReserva(
                      modalReserva.dia,
                      modalReserva.bloque,
                      formData.get('motivo'),
                      formData.get('grupo'),
                      formData.get('tutor'),
                      cantidadHoras
                    );
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Fecha de la reserva <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={fechaSeleccionada}
                      onChange={(e) => setFechaSeleccionada(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                      required
                      disabled={enviando}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Motivo de la reserva
                    </label>
                    <textarea
                      name="motivo"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all resize-none"
                      placeholder="Describe el motivo de la reserva..."
                      disabled={enviando}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Grupo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="grupo"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                      placeholder="Ej. DSM 31"
                      required
                      disabled={enviando}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tutor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tutor"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all"
                      placeholder="Nombre del tutor"
                      required
                      disabled={enviando}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalReserva({ abierto: false, dia: null, bloque: null });
                        setCantidadHoras(1);
                        setHoraFinSeleccionada(null);
                        setMaxHorasDisponibles(1);
                        setFechaSeleccionada('');
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={enviando}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-[#701330] hover:bg-[#912347] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {enviando ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Enviando...
                        </>
                      ) : (
                        `Solicitar ${cantidadHoras} Hora${cantidadHoras > 1 ? 's' : ''}`
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Rechazo de Propuesta */}
        {modalRechazoPropuesta && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalRechazoPropuesta(null)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Rechazar propuesta</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      La propuesta de horario será rechazada y el responsable será notificado.
                    </p>
                  </div>
                  <button
                    onClick={() => setModalRechazoPropuesta(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    disabled={respondiendo}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Motivo del rechazo (opcional)
                  </label>
                  <textarea
                    value={modalRechazoPropuesta.observaciones || ''}
                    onChange={(e) => setModalRechazoPropuesta({ ...modalRechazoPropuesta, observaciones: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#701330]/30 focus:border-[#701330] transition-all resize-none"
                    placeholder="Describe el motivo del rechazo..."
                    disabled={respondiendo}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setModalRechazoPropuesta(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={respondiendo}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarRechazoPropuesta}
                    disabled={respondiendo}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {respondiendo ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Rechazando...
                      </>
                    ) : (
                      'Confirmar rechazo'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}