import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserId, isDirector, isSuperAdmin } from '../utils/auth';
import api from '../api/axios';
import { useTema } from '../context/TemaContext';

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

const COLORS = {
  primary: '#701330',
  primaryLight: '#912347',
  primaryPale: '#FDF2F6',
  gray: '#6B7280',
  grayLight: '#F9FAFB',
  border: '#E5E7EB',
};

// Paleta de colores pastel VARIADA
const PALETA_PASTEL_VARIADA = [
  { h: 340, s: 45, l: 82 }, { h: 350, s: 40, l: 78 }, { h: 5, s: 50, l: 75 }, { h: 15, s: 45, l: 75 },
  { h: 25, s: 55, l: 75 }, { h: 35, s: 50, l: 72 }, { h: 40, s: 45, l: 70 }, { h: 45, s: 50, l: 68 },
  { h: 50, s: 55, l: 65 }, { h: 55, s: 50, l: 62 }, { h: 70, s: 45, l: 60 }, { h: 85, s: 50, l: 58 },
  { h: 105, s: 45, l: 58 }, { h: 125, s: 40, l: 58 }, { h: 145, s: 45, l: 62 }, { h: 165, s: 50, l: 65 },
  { h: 180, s: 55, l: 65 }, { h: 195, s: 55, l: 65 }, { h: 210, s: 50, l: 62 }, { h: 220, s: 45, l: 58 },
  { h: 230, s: 50, l: 58 }, { h: 245, s: 50, l: 62 }, { h: 260, s: 45, l: 62 }, { h: 275, s: 40, l: 58 },
  { h: 290, s: 35, l: 58 }, { h: 305, s: 40, l: 62 }, { h: 320, s: 45, l: 68 }, { h: 335, s: 50, l: 72 },
  { h: 15, s: 35, l: 58 }, { h: 25, s: 30, l: 55 }, { h: 35, s: 25, l: 52 }, { h: 45, s: 20, l: 48 },
];

function generarColorBase(texto) {
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

function oscurecerColor(hexColor, porcentaje = 35) {
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
  return esColorClaro(hexColor) ? '#2D3748' : '#FFFFFF';
}

function getIniciales(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function bloqueHora(bloque) {
  return bloque && bloque.hora ? bloque.hora : '—';
}

function renderDetalle(etiqueta, valor, sub = '', destacado = false, isDark = false) {
  return (
    <div className={`p-3 rounded-lg border text-sm ${destacado ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
      <p className={`text-[11px] uppercase tracking-wide font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{etiqueta}</p>
      <p className={`font-semibold mt-0.5 leading-snug ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        {valor}
        {sub ? <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} font-normal`}> ({sub})</span> : null}
      </p>
    </div>
  );
}

function etiquetaRol(rol) {
  const mapa = {
    superadmin: 'Admin',
    director: 'Director',
    coordinador: 'Coordinador',
    docente: 'Docente'
  };
  return mapa[rol] ? ` · ${mapa[rol]}` : '';
}

export default function HorarioAula({ aula: aulaProp, onCerrar, puedeEditar = false, onActualizarAula }) {
  const { usuario } = useAuth();
  const { tema } = useTema();
  const isDark = tema === 'oscuro';
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const esPagina = !aulaProp;
  const [aulaCargada, setAulaCargada] = useState(null);
  const [cargandoAula, setCargandoAula] = useState(esPagina);
  const [horario, setHorario] = useState([]);
  const [horarioOtroTurno, setHorarioOtroTurno] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('matutino');
  const [modal, setModal] = useState({ abierto: false, tipo: 'nueva', datos: null, celda: null });
  const [carreras, setCarreras] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [mostrarSelectorGrupo, setMostrarSelectorGrupo] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const [modalTutor, setModalTutor] = useState({ abierto: false, grupo: null, tutorActual: '' });
  const [modalSolicitarReserva, setModalSolicitarReserva] = useState({ abierto: false, dia: null, bloque: null });
  const [duracionSolicitud, setDuracionSolicitud] = useState(1);
  const [maxHorasSolicitud, setMaxHorasSolicitud] = useState(1);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const [eventoDetalle, setEventoDetalle] = useState(null);

  const [edificiosPermitidos, setEdificiosPermitidos] = useState([]);
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [soloOtrasDocencias, setSoloOtrasDocencias] = useState(false);

  const esSuperAdmin = isSuperAdmin(usuario);
  const esDirector = isDirector(usuario);
  const idDirector = getUserId(usuario);

  const aula = aulaProp || aulaCargada;

  useEffect(() => {
    if (aulaProp || !idParam) return;
    let activo = true;
    const cargarAula = async () => {
      try {
        const res = await api.get('/api/aulas');
        const encontrada = (res.data || []).find(a => String(a.id_aula) === String(idParam));
        if (activo) setAulaCargada(encontrada || null);
      } catch (err) {
        console.error('Error al cargar aula:', err);
      } finally {
        if (activo) setCargandoAula(false);
      }
    };
    cargarAula();
    return () => { activo = false; };
  }, [idParam, aulaProp]);

  const permisoReal = esPagina
    ? (esSuperAdmin || (esDirector && edificiosPermitidos.some(e => String(e.id_edificio) === String(aula?.id_edificio))))
    : puedeEditar;

  const [coloresMateria, setColoresMateria] = useState({});

  const limpiarCacheColor = (nombreMateria) => {
    if (nombreMateria) {
      setColoresMateria(prev => {
        const nuevo = { ...prev };
        delete nuevo[nombreMateria];
        return nuevo;
      });
    }
  };

  const obtenerColorMateria = (nombreMateria, siglaMateria, colorGuardado, forzarRecalculo = false) => {
    let colorBase;
    const clave = nombreMateria || siglaMateria || 'default';
    
    if (colorGuardado && colorGuardado !== '#FDF2F6' && colorGuardado !== '#e2e8f0' && colorGuardado !== '#701330') {
      colorBase = colorGuardado;
    } else if (!forzarRecalculo && coloresMateria[clave]) {
      return coloresMateria[clave];
    } else {
      colorBase = generarColorBase(clave);
    }
    
    const nuevoColor = {
      fondo: colorBase,
      borde: oscurecerColor(colorBase, 35),
      texto: obtenerColorContraste(colorBase)
    };
    
    if (!colorGuardado || colorGuardado === '#FDF2F6' || colorGuardado === '#e2e8f0' || colorGuardado === '#701330') {
      setColoresMateria(prev => ({ ...prev, [clave]: nuevoColor }));
    }
    
    return nuevoColor;
  };

  useEffect(() => {
    const cargarEdificiosPermitidos = async () => {
      if (esDirector && idDirector) {
        try {
          const res = await api.get(`/api/director/${idDirector}/edificios`);
          setEdificiosPermitidos(res.data || []);
        } catch (err) {
          console.error('Error al cargar edificios permitidos:', err);
        }
      }
    };
    cargarEdificiosPermitidos();
  }, [esDirector, idDirector]);

  useEffect(() => {
    if (!aula?.id_aula) return;
    const cargarTodo = async () => {
      try {
        setCargando(true);
        const otroTurno = turnoSeleccionado === 'matutino' ? 'vespertino' : 'matutino';
        const [resHorario, resOtro, resCarreras, resDocentes] = await Promise.all([
          api.get(`/api/infraestructura/aula/${aula.id_aula}/horario?turno=${turnoSeleccionado}`),
          api.get(`/api/infraestructura/aula/${aula.id_aula}/horario?turno=${otroTurno}`),
          api.get('/api/carreras'),
          api.get('/api/docentes')
        ]);
        setHorario(resHorario.data || []);
        setHorarioOtroTurno(resOtro.data || []);
        setCarreras(resCarreras.data || []);
        setDocentes(resDocentes.data || []);
      } catch (err) {
        mostrarAlerta('error', 'Error al cargar los datos.');
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [aula?.id_aula, turnoSeleccionado]);

  const normalizarTexto = (valor) => {
    if (!valor) return '';
    return String(valor)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[:\s]+$/, "")
      .replace(/\s+/g, '');
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

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ mostrar: true, tipo, mensaje });
    setTimeout(() => setAlerta({ mostrar: false, tipo: '', mensaje: '' }), 4500);
  };

  const actualizarEstadoAula = async () => {
    try {
      await api.post(`/api/infraestructura/aula/${aula.id_aula}/actualizar-estado`);
      if (onActualizarAula) onActualizarAula();
    } catch (err) {
      mostrarAlerta('error', 'No se pudo actualizar el estado');
    }
  };

  const cargarHorario = async () => {
    try {
      const res = await api.get(`/api/infraestructura/aula/${aula.id_aula}/horario?turno=${turnoSeleccionado}`);
      setHorario(res.data || []);
      return res.data;
    } catch (err) {
      mostrarAlerta('error', 'Error al recargar');
      return [];
    }
  };

  const eliminarHorarioTurno = async () => {
    if (!permisoReal) return;
    try {
      await api.delete(`/api/infraestructura/aula/${aula.id_aula}/horario?turno=${turnoSeleccionado}`);
      setConfirmar(null);
      await cargarHorario();
      await actualizarEstadoAula();
      mostrarAlerta('exito', `Horario del turno ${turnoSeleccionado} eliminado.`);
    } catch (err) {
      setConfirmar(null);
      mostrarAlerta('error', 'No se pudo eliminar.');
    }
  };

  const abrirNuevaAsignacion = (dia, bloque) => {
    if (!permisoReal) return;
    setModal({ abierto: true, tipo: 'nueva', datos: null, celda: { dia, bloque } });
  };

  const abrirEditarAsignacion = (evento, dia, bloque) => {
    if (!permisoReal) return;
    setModal({ abierto: true, tipo: 'editar', datos: evento, celda: { dia, bloque } });
  };

  const eliminarAsignacion = async (id) => {
    if (!permisoReal) return;
    try {
      await api.delete(`/api/horarios/${id}`);
      setConfirmar(null);
      await cargarHorario();
      await actualizarEstadoAula();
      mostrarAlerta('exito', 'Asignación eliminada');
    } catch (err) {
      setConfirmar(null);
      mostrarAlerta('error', 'No se pudo eliminar');
    }
  };

  const guardarAsignacion = async (formData) => {
    try {
      const payload = {
        id_aula: aula.id_aula,
        dia_semana: modal.celda.dia,
        hora_inicio: modal.celda.bloque.inicio,
        hora_fin: modal.celda.bloque.fin,
        ...formData
      };
      
      if (modal.tipo === 'nueva') {
        await api.post('/api/horarios/asignar', payload);
      } else {
        await api.put(`/api/horarios/${modal.datos.id}`, payload);
        
        const nombreMateria = formData.nombre_materia || modal.datos?.nombre_materia;
        const nuevoColor = formData.color;
        const colorOriginal = modal.datos?.color || modal.datos?.materia_color;
        
        if (nombreMateria && nuevoColor && colorOriginal && nuevoColor !== colorOriginal) {
          limpiarCacheColor(nombreMateria);
          try {
            await api.patch('/api/horarios/materia/color', {
              nombre_materia: nombreMateria,
              color: nuevoColor,
              id_aula: aula.id_aula
            });
            mostrarAlerta('exito', `Color actualizado para todas las ocurrencias de "${nombreMateria}"`);
          } catch (err) {
            console.error('Error al actualizar color de materia:', err);
            mostrarAlerta('error', 'El color se guardó en esta celda, pero no en todas las ocurrencias');
          }
        }
      }
      
      await cargarHorario();
      await actualizarEstadoAula();
      setModal({ abierto: false, tipo: 'nueva', datos: null, celda: null });
      mostrarAlerta('exito', 'Asignación guardada');
    } catch (err) {
      console.error('Error al guardar:', err);
      mostrarAlerta('error', 'Error al guardar');
    }
  };

  const abrirAsignarTutor = (grupo, tutorActual) => {
    setModalTutor({
      abierto: true,
      grupo: grupo,
      tutorActual: tutorActual || ''
    });
  };

  const guardarTutor = async (grupo, nuevoTutor) => {
    try {
      await api.post('/api/infraestructura/asignar-tutor', null, {
        params: {
          id_aula: aula.id_aula,
          grupo: grupo,
          tutor: nuevoTutor,
          turno: turnoSeleccionado
        }
      });
      await cargarHorario();
      mostrarAlerta('exito', 'Tutor asignado correctamente');
      setModalTutor({ abierto: false, grupo: null, tutorActual: '' });
    } catch (err) {
      mostrarAlerta('error', 'Error al asignar tutor');
    }
  };

  const estadoBloqueSolicitud = (dia, bloque) => {
    const evento = horario.find(e => {
      const diaCoincide = normalizarTexto(e.dia_semana || e.dia) === normalizarTexto(dia);
      const horaCoincide = normalizarHora(e.hora_inicio) === normalizarHora(bloque.inicio);
      return diaCoincide && horaCoincide;
    });
    if (!evento) return 'libre';
    return evento.pendiente ? 'pendiente' : 'ocupado';
  };

  const abrirModalSolicitar = (dia, bloque) => {
    const idx = bloquesFiltrados.findIndex(b => normalizarHora(b.inicio) === normalizarHora(bloque.inicio));
    let max = 1;
    for (let i = idx + 1; i < bloquesFiltrados.length; i++) {
      if (estadoBloqueSolicitud(dia, bloquesFiltrados[i]) !== 'libre') break;
      max++;
    }
    setDuracionSolicitud(1);
    setMaxHorasSolicitud(max);
    setModalSolicitarReserva({ abierto: true, dia: dia, bloque: bloque });
  };

  const solicitarReservaDesdeCelda = async (dia, bloque, motivo, grupo, tutor, duracion, bloqueFin) => {
    if (enviandoSolicitud) return;
    try {
      setEnviandoSolicitud(true);
      await api.post('/api/director/solicitar-reserva', {
        id_director: idDirector || usuario?.id_usuario,
        id_aula: aula.id_aula,
        dia_semana: dia,
        turno: bloque.turno,
        hora_inicio: bloque.inicio,
        hora_fin: bloqueFin ? bloqueFin.fin : bloque.fin,
        duracion_horas: duracion || 1,
        fecha_solicitud: new Date().toISOString().split('T')[0],
        observaciones: motivo,
        sigla_grupo: grupo,
        tutor_grupo: tutor,
        color: '#FDF2F6'
      });
      mostrarAlerta('exito', 'Solicitud de reserva enviada correctamente');
      setModalSolicitarReserva({ abierto: false, dia: null, bloque: null });
      cargarHorario();
    } catch (err) {
      console.error('Error al solicitar reserva:', err);
      mostrarAlerta('error', err.response?.data?.detail || 'Error al solicitar reserva');
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const manejarSeleccionArchivo = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setArchivoSeleccionado(archivo);
    setSubiendo(true);
    setMostrarSelectorGrupo(false);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      const respuesta = await api.post('/api/excel/detectar-grupos-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });
      if (respuesta.data && Array.isArray(respuesta.data) && respuesta.data.length > 0) {
        const gruposProcesados = respuesta.data.map(g => {
          let nombre = String(g.grupo || '').trim();
          const prefijos = [/GRUPO\s+CUATRIMESTRE/gi, /GRUPO\s+SEMESTRAL/gi, /GRUPO\s+/gi, /CUATRIMESTRE/gi, /SEMESTRE/gi, /PERIODO/gi, /GRUPO:/gi, /GRUPO -/gi];
          prefijos.forEach(p => nombre = nombre.replace(p, ''));
          nombre = nombre.trim().replace(/\s+/g, ' ');
          return { ...g, grupo: nombre || g.grupo };
        });
        const gruposUnicos = Array.from(
          new Map(gruposProcesados.map(g => [g.grupo.toLowerCase(), g])).values()
        ).sort((a, b) => a.grupo.localeCompare(b.grupo, 'es'));
        setGruposDisponibles(gruposUnicos);
        setMostrarSelectorGrupo(true);
        if (gruposUnicos.length === 1) {
          setGrupoSeleccionado(gruposUnicos[0].grupo);
        }
      } else {
        mostrarAlerta('error', 'No se encontraron grupos válidos');
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al leer el archivo');
    } finally {
      setSubiendo(false);
    }
    e.target.value = '';
  };

  const manejarSubirHorario = async () => {
    if (!archivoSeleccionado || !grupoSeleccionado) {
      mostrarAlerta('error', 'Selecciona archivo y grupo');
      return;
    }
    const formData = new FormData();
    formData.append('archivo', archivoSeleccionado);
    formData.append('id_aula', parseInt(aula.id_aula, 10));
    formData.append('grupo', grupoSeleccionado);
    formData.append('turno', turnoSeleccionado);
    formData.append('color_por_defecto', COLORS.primaryPale);
    try {
      setSubiendo(true);
      mostrarAlerta('info', `Procesando grupo ${grupoSeleccionado}...`);
      const respuesta = await api.post('/api/excel/subir-horario-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      });
      await cargarHorario();
      await actualizarEstadoAula();
      mostrarAlerta('exito', `Horario cargado (${respuesta.data.asignaciones_creadas} bloques).`);
      setMostrarSelectorGrupo(false);
      setGrupoSeleccionado('');
      setArchivoSeleccionado(null);
      setGruposDisponibles([]);
    } catch (error) {
      mostrarAlerta('error', 'Error al procesar el archivo');
    } finally {
      setSubiendo(false);
    }
  };

  const cancelarSeleccionGrupo = () => {
    setMostrarSelectorGrupo(false);
    setGrupoSeleccionado('');
    setArchivoSeleccionado(null);
    setGruposDisponibles([]);
  };

  const bloquesFiltrados = BLOQUES.filter(b => b.turno === turnoSeleccionado);
  const totalBloquesTurno = bloquesFiltrados.length;

  const otroTurno = turnoSeleccionado === 'matutino' ? 'vespertino' : 'matutino';
  const bloquesOtro = BLOQUES.filter(b => b.turno === otroTurno);

  const tutorGrupo = horario.find(e => !e.pendiente && e.tutor_grupo && e.tutor_grupo !== 'Sin asignar')?.tutor_grupo || 'Sin tutor';
  const grupoDelHorario = horario.find(e => !e.pendiente && e.sigla_grupo && e.sigla_grupo !== '---')?.sigla_grupo || 'Sin grupo';

  const idUsuarioActual = usuario?.id;
  const gruposDelHorario = Array.from(new Set(
    horario.filter(e => !e.pendiente && e.sigla_grupo && e.sigla_grupo !== '---').map(e => e.sigla_grupo)
  )).sort();
  const horarioFiltrado = horario.filter(e => {
    if (soloOtrasDocencias && e.id_usuario && e.id_usuario === idUsuarioActual) return false;
    if (filtroGrupo) return (e.sigla_grupo || '').toLowerCase() === filtroGrupo.toLowerCase();
    return true;
  });

  if (!aula) {
    if (cargandoAula) {
      return (
        <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-[#701330] rounded-full animate-spin mb-4"></div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} animate-pulse`}>Cargando aula...</p>
          </div>
        </div>
      );
    }
    if (esPagina) {
      return (
        <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="text-center">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>Aula no encontrada</h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-semibold bg-[#701330] hover:bg-[#912347] text-white rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const materiasUnicas = Array.from(
    new Map(horario.filter(e => !e.pendiente).map(e => [e.sigla_materia || e.nombre_materia, e])).values()
  );

  const getAyudaTexto = () => {
    if (permisoReal) {
      return 'Haz clic en una celda vacía para asignar una materia';
    }
    return 'Haz clic en una celda vacía para solicitar reserva';
  };

  const calcularOcupacion = () => {
    const total = bloquesFiltrados.length;
    const ocupados = horario.filter(h => {
      const turnoH = h.turno || (h.hora_inicio && (parseInt(h.hora_inicio.split(':')[0]) < 15 ? 'matutino' : 'vespertino'));
      return turnoH === turnoSeleccionado;
    }).length;
    const porcentaje = total > 0 ? Math.round((ocupados / total) * 100) : 0;
    return { total, ocupados, porcentaje };
  };

  const ocupacion = calcularOcupacion();

  return (
    <div className={esPagina ? `${isDark ? 'bg-gray-900' : 'bg-gray-100'} min-h-screen p-4 md:p-6` : 'fixed inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm'}>
      {alerta.mostrar && (
        <div className={`fixed top-6 right-6 z-[100] max-w-md w-full rounded-xl shadow-lg p-4 flex items-center gap-3 animate-fadeIn ${
          alerta.tipo === 'exito' ? 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-600 dark:border-green-400 text-green-900 dark:text-green-300' :
          alerta.tipo === 'error' ? 'bg-red-50 dark:bg-red-900/30 border-l-4 border-red-600 dark:border-red-400 text-red-900 dark:text-red-300' :
          alerta.tipo === 'info' ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600 dark:border-blue-400 text-blue-900 dark:text-blue-300' :
          'bg-gray-50 dark:bg-gray-800 border-l-4 border-gray-500 dark:border-gray-400 text-gray-900 dark:text-gray-300'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {alerta.tipo === 'exito' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
            {alerta.tipo === 'error' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
            {alerta.tipo === 'info' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
          </svg>
          <span className="text-sm font-medium">{alerta.mensaje}</span>
          <button onClick={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })} className="ml-auto text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Cabecera */}
        <div className={`px-4 sm:px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-[#701330]/20'} flex flex-wrap items-center justify-between gap-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-[#e59daa]' : 'text-[#701330]'}`}>{aula.nombre_aula}</h2>
            
            <div className={`flex rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button onClick={() => setTurnoSeleccionado('matutino')} className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${turnoSeleccionado === 'matutino' ? 'bg-[#701330] text-white shadow-md' : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-200'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Matutino
              </button>
              <button onClick={() => setTurnoSeleccionado('vespertino')} className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${turnoSeleccionado === 'vespertino' ? 'bg-[#701330] text-white shadow-md' : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-200'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                Vespertino
              </button>
            </div>
            
            {permisoReal && (
              <>
                <button onClick={() => setConfirmar({ titulo: 'Eliminar horario del turno', mensaje: `¿Eliminar todo el horario del turno ${turnoSeleccionado}? Se eliminarán también las solicitudes pendientes de este turno.`, accion: eliminarHorarioTurno, confirmarTexto: 'Sí, eliminar', tipo: 'peligro' })} className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Eliminar
                </button>
                {!mostrarSelectorGrupo ? (
                  <button onClick={() => document.getElementById('input-excel-horario').click()} className="px-4 py-2 text-sm font-semibold bg-[#701330] hover:bg-[#912347] text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2" disabled={subiendo}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {subiendo ? 'Procesando...' : 'Subir Excel'}
                  </button>
                ) : (
                  <div className={`flex items-center gap-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-1.5 shadow-sm`}>
                    <select value={grupoSeleccionado} onChange={(e) => setGrupoSeleccionado(e.target.value)} className={`px-3 py-1.5 text-sm ${isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/50 min-w-[140px]`}>
                      <option value="">Seleccionar grupo</option>
                      {gruposDisponibles.map((g, idx) => <option key={idx} value={g.grupo}>{g.grupo}</option>)}
                    </select>
                    <button onClick={manejarSubirHorario} disabled={!grupoSeleccionado || subiendo} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${grupoSeleccionado && !subiendo ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`}>
                      {subiendo ? 'Cargando...' : 'Subir'}
                    </button>
                    <button onClick={cancelarSeleccionGrupo} className={`px-3 py-1.5 text-sm font-medium ${isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'} rounded-lg`}>Cancelar</button>
                  </div>
                )}
                <input type="file" id="input-excel-horario" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={manejarSeleccionArchivo} />
              </>
            )}
          </div>
          
          <button onClick={() => (onCerrar ? onCerrar() : navigate('/dashboard'))} className={`w-9 h-9 flex items-center justify-center rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800'} transition-all duration-300 hover:rotate-90`} title="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`px-6 py-2.5 border-b ${isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Planta {aula.planta}
            </span>
            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              {aula.capacidad} lugares
            </span>
            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              {aula.nombre_edificio || 'Sin edificio'}
            </span>
            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-medium text-xs ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Ocupación: {ocupacion.porcentaje}% ({ocupacion.ocupados}/{ocupacion.total})
            </span>
            <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-medium text-xs ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Grupo: {grupoDelHorario}
            </span>
            {(gruposDelHorario.length > 1 || true) && (
              <>
                <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
                <select
                  value={filtroGrupo}
                  onChange={(e) => setFiltroGrupo(e.target.value)}
                  className={`px-2 py-0.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  title="Filtrar por grupo"
                >
                  <option value="">Todos los grupos</option>
                  {gruposDelHorario.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <button
                  onClick={() => setSoloOtrasDocencias(v => !v)}
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-lg border transition-all duration-200 ${soloOtrasDocencias ? 'bg-[#701330] text-white border-[#701330]' : isDark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  title="Ocultar tus propias reservas para ver solo las de otras docencias"
                >
                  Otras docencias
                </button>
              </>
            )}
            {!permisoReal && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-medium text-xs ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                Solo lectura
              </span>
            )}
            {permisoReal && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-medium text-xs ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Edición activa
              </span>
            )}
          </div>
        </div>

        <div className={`overflow-auto p-4 flex-1 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
          {cargando ? (
            <div className="py-24 text-center">
              <div className="inline-block w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-[#701330] rounded-full animate-spin mb-4"></div>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} animate-pulse`}>Cargando horario...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm`}>
                <thead>
                  <tr>
                    <th className={`border-b p-3 text-left text-sm font-semibold w-32 ${isDark ? 'border-gray-700 bg-gray-700/50 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>HORA</th>
                    {DIAS.map(dia => <th key={dia} className={`border-b p-3 text-center text-sm font-semibold capitalize ${isDark ? 'border-gray-700 bg-gray-700/50 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>{dia}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {bloquesFiltrados.map((bloque) => (
                    <tr key={bloque.inicio} className={`transition-colors duration-200 ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50/70'}`}>
                      <td className={`border-b p-3 text-sm font-medium whitespace-nowrap ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-100 text-gray-700'}`}>{bloque.hora}</td>
                      {DIAS.map(dia => {
                        const evento = horarioFiltrado.find(e => {
                          const diaCoincide = normalizarTexto(e.dia_semana || e.dia) === normalizarTexto(dia);
                          const horaCoincide = normalizarHora(e.hora_inicio) === normalizarHora(bloque.inicio);
                          return diaCoincide && horaCoincide;
                        });
                        const eventoOtro = horarioOtroTurno.find(e => {
                          const diaCoincide = normalizarTexto(e.dia_semana || e.dia) === normalizarTexto(dia);
                          const horaCoincide = normalizarHora(e.hora_inicio) === normalizarHora(bloque.inicio);
                          return diaCoincide && horaCoincide;
                        });
                        
                        let colores = null;
                        let reservaDeOtroDirector = false;
                        if (evento) {
                          const nombreMat = evento.nombre_materia || evento.sigla_materia || '';
                          const siglaMat = evento.sigla_materia || '';
                          const colorGuardado = evento.color || evento.materia_color || null;
                          const creadorSuperAdmin = evento.rol_creador === 'superadmin';
                          reservaDeOtroDirector = esDirector && !esSuperAdmin && evento.id_usuario && evento.id_usuario !== idDirector && !creadorSuperAdmin;
                          if (reservaDeOtroDirector) {
                            colores = { fondo: isDark ? '#4A5568' : '#B0BEC5', borde: isDark ? '#2D3748' : '#78909C', texto: isDark ? '#E2E8F0' : '#FFFFFF' };
                          } else {
                            colores = obtenerColorMateria(nombreMat, siglaMat, colorGuardado);
                          }
                        }
                        
                        const esPendiente = !!evento?.pendiente;
                        if (esPendiente) {
                          const creadorSuperAdmin = evento.rol_creador === 'superadmin';
                          colores = creadorSuperAdmin
                            ? { fondo: isDark ? '#92400E' : '#FEF3C7', borde: isDark ? '#B45309' : '#F59E0B', texto: isDark ? '#FDE68A' : '#92400E' }
                            : { fondo: isDark ? '#374151' : '#CBD5E1', borde: isDark ? '#4B5563' : '#64748B', texto: isDark ? '#D1D5DB' : '#1F2937' };
                        }
                        
                        return (
                          <td key={dia} className={`border-b p-1 align-top relative ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                            {evento ? (
                              <div 
                                onClick={(e) => { e.stopPropagation(); setEventoDetalle({ evento, dia, bloque }); }}
                                title="Ver detalles"
                                style={{ 
                                  backgroundColor: colores ? colores.fondo : COLORS.primaryPale,
                                  borderLeftColor: colores ? colores.borde : COLORS.primary,
                                  borderLeftWidth: '6px'
                                }}
                                className="w-full h-[96px] p-2 rounded-lg relative group transition-all duration-200 hover:shadow-md border-l-4 text-xs flex flex-col justify-between overflow-hidden cursor-pointer"
                              >
                                <div className="flex flex-wrap items-center gap-1">
                                  {esPendiente && (
                                    <span 
                                      className="font-bold uppercase bg-white/40 dark:bg-black/30 px-1.5 py-0.5 rounded shadow-sm text-[9px]"
                                      style={{ color: colores ? colores.texto : COLORS.primary }}
                                    >
                                      En espera
                                    </span>
                                  )}
                                  {!esPendiente && evento.sigla_grupo && (
                                    <span 
                                      className="font-bold bg-white/30 dark:bg-black/20 px-1.5 py-0.5 rounded shadow-sm text-[10px]"
                                      style={{ color: colores ? colores.texto : COLORS.primary }}
                                    >
                                      {evento.sigla_grupo}
                                    </span>
                                  )}
                                  {!esPendiente && evento.sigla_carrera && (
                                    <span className="font-mono bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded text-[9px]" style={{ color: colores ? colores.texto : (isDark ? '#9CA3AF' : '#4B5563') }}>
                                      {evento.sigla_carrera}
                                    </span>
                                  )}
                                </div>
                                <p 
                                  className="font-bold text-xs leading-tight truncate"
                                  style={{ color: colores ? colores.texto : COLORS.primary }}
                                >
                                  {esPendiente ? (evento.codigo_solicitud || 'Solicitud en espera') : (evento.sigla_materia || evento.nombre_materia)}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-1 text-[10px]" style={{ color: colores ? colores.texto : (isDark ? '#9CA3AF' : '#4B5563') }}>
                                  {esPendiente ? (
                                    <span>Pendiente de aprobación</span>
                                  ) : (
                                    <span>{evento.sigla_docente || evento.nombre_docente || 'Sin docente'}</span>
                                  )}
                                </div>
                                {!esPendiente && evento.nombre_creador && evento.rol_creador === 'director' && (
                                  <div className="flex flex-wrap items-center gap-1 text-[10px]" style={{ color: colores ? colores.texto : (isDark ? '#9CA3AF' : '#4B5563') }}>
                                    <span
                                      title={`${evento.nombre_creador}${etiquetaRol(evento.rol_creador)}`}
                                      className="px-1.5 py-0.5 rounded font-bold bg-amber-500/90 text-white"
                                    >
                                      {getIniciales(evento.nombre_creador)}
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Reserva aprobada"></span>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-x-2 text-[10px]" style={{ color: colores ? colores.texto : (isDark ? '#9CA3AF' : '#4B5563') }}>
                                  {!esPendiente && evento.aula_clase && <span className="bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded">Aula: {evento.aula_clase}</span>}
                                </div>
                                {eventoOtro && (
                                  <div className="absolute bottom-1 right-1 bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                                    OTRO TURNO
                                  </div>
                                )}
                                {permisoReal && !esPendiente && (
                                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-gray-700/90 rounded p-0.5 shadow-sm">
                                    <button onClick={(e) => { e.stopPropagation(); abrirEditarAsignacion(evento, dia, bloque); }} className={`p-1 rounded ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`} title="Editar">
                                      <svg className={`w-3 h-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setConfirmar({ titulo: 'Eliminar asignación', mensaje: '¿Eliminar esta asignación del horario?', accion: () => eliminarAsignacion(evento.id), confirmarTexto: 'Sí, eliminar', tipo: 'peligro' }); }} className={`p-1 rounded ${isDark ? 'hover:bg-gray-600' : 'hover:bg-red-50'}`} title="Eliminar">
                                      <svg className={`w-3 h-3 ${isDark ? 'text-red-400' : 'text-red-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div 
                                className={`w-full h-[96px] flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-300 cursor-pointer ${
                                  permisoReal 
                                    ? isDark ? 'border-gray-600 hover:border-[#701330] hover:bg-[#701330]/20' : 'border-gray-300 hover:border-[#701330] hover:bg-[#FDF2F6]' 
                                    : isDark ? 'border-gray-700 bg-gray-800/50 hover:border-blue-400 hover:bg-blue-900/20' : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                                }`}
                                onClick={() => {
                                  if (permisoReal) {
                                    abrirNuevaAsignacion(dia, bloque);
                                  } else {
                                    abrirModalSolicitar(dia, bloque);
                                  }
                                }}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  {permisoReal ? (
                                    <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-2xl font-light`}>+</span>
                                  ) : (
                                    <>
                                      <svg className={`w-5 h-5 ${isDark ? 'text-blue-500' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-[9px]`}>Solicitar</span>
                                    </>
                                  )}
                                </div>
                                {eventoOtro && (
                                  <div className="absolute bottom-1 right-1 bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                                    OTRO TURNO
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {horario.length > 0 && (
                <div className={`mt-3 flex flex-wrap items-center gap-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="text-sm font-medium">Tutor del grupo:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-800'}`}>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {tutorGrupo}
                  </span>
                  {permisoReal && (tutorGrupo === 'Sin tutor' || tutorGrupo === 'Sin asignar') && (
                    <button className="px-3 py-1 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-300 flex items-center gap-1" onClick={() => abrirAsignarTutor(grupoDelHorario, '')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Asignar Tutor
                    </button>
                  )}
                  {permisoReal && tutorGrupo !== 'Sin tutor' && tutorGrupo !== 'Sin asignar' && (
                    <button className="px-3 py-1 text-sm font-semibold bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-md transition-all duration-300 flex items-center gap-1" onClick={() => abrirAsignarTutor(grupoDelHorario, tutorGrupo)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Editar Tutor
                    </button>
                  )}
                </div>
              )}

              {horario.length > 0 && materiasUnicas.length > 0 && (
                <div className={`mt-4 p-3 rounded-lg border shadow-sm ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Materias en este horario:</p>
                  <div className="flex flex-wrap gap-2">
                    {materiasUnicas.map((e) => {
                      const nombreMat = e.nombre_materia || e.sigla_materia || '';
                      const siglaMat = e.sigla_materia || '';
                      const colorGuardado = e.color || e.materia_color || null;
                      const colores = obtenerColorMateria(nombreMat, siglaMat, colorGuardado);
                      return (
                        <span 
                          key={siglaMat || nombreMat} 
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border"
                          style={{ 
                            backgroundColor: colores ? colores.fondo : (isDark ? '#374151' : '#e5e7eb'),
                            color: colores ? colores.texto : (isDark ? '#D1D5DB' : '#1f2937'),
                            borderColor: isDark ? '#4B5563' : '#D1D5DB'
                          }}
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: colores ? colores.borde : '#6B7280' }}
                          ></span>
                          {siglaMat || nombreMat}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] ${isDark ? 'text-gray-400 bg-gray-800/50 border-gray-700' : 'text-gray-600 bg-white/70 border-gray-200/60'} px-3 py-2 rounded-lg border`}>
                <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Leyenda:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: isDark ? '#4A5568' : '#CBD5E1', border: '1px solid #64748B' }}></span>
                  Espera de aprobación (director)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400"></span>
                  Espera de aprobación (admin)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Reserva aprobada
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: isDark ? '#4A5568' : '#B0BEC5', border: '1px solid #64748B' }}></span>
                  Otra docencia (incidencia)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600"></span>
                  Bloque del otro turno
                </span>
              </div>

              <div className={`mt-4 text-xs text-center ${isDark ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-white/70'} py-2 rounded-lg`}>
                {getAyudaTexto()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales - los mismos modales con clases dark: */}
      {modal.abierto && permisoReal && (
        <div className="fixed inset-0 bg-black/55 dark:bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-7 shadow-xl`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{modal.tipo === 'nueva' ? 'Nueva Asignación' : 'Editar Asignación'}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 capitalize`}>{modal.celda?.dia} • {modal.celda?.bloque?.inicio}–{modal.celda?.bloque?.fin} • {aula.nombre_aula}</p>
              </div>
              <button onClick={() => setModal({ abierto: false, tipo: 'nueva', datos: null, celda: null })} className={`w-9 h-9 flex items-center justify-center rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'} transition-all duration-300 hover:rotate-90`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const datos = Object.fromEntries(new FormData(e.target)); guardarAsignacion(datos); }} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Carrera</label>
                <select name="id_carrera" defaultValue={modal.datos?.id_carrera || ''} className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} required>
                  <option value="">Seleccionar carrera</option>
                  {carreras.map(c => <option key={c.id} value={c.id}>{c.sigla} — {c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Materia{modal.datos?.sigla_materia && <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} font-normal`}> ({modal.datos.sigla_materia})</span>}</label>
                <input type="text" name="nombre_materia" defaultValue={modal.datos?.nombre_materia || ''} placeholder="Ej. Programación Avanzada" className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`} required />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Profesor{modal.datos?.sigla_docente && <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} font-normal`}> ({modal.datos.sigla_docente})</span>}</label>
                <select name="id_docente" defaultValue={modal.datos?.id_docente || ''} className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} required>
                  <option value="">Seleccionar profesor</option>
                  {docentes.map(d => <option key={d.id_docente || d.id} value={d.id_docente || d.id}>{d.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Grupo / Sigla</label>
                <input type="text" name="sigla" defaultValue={modal.datos?.sigla_grupo || ''} placeholder="Ej. DSM 31" className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Aula (lugar físico)</label>
                <input type="text" name="aula_clase" defaultValue={modal.datos?.aula_clase || ''} placeholder="Ej. E1 A108" className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tutor del grupo</label>
                <input type="text" name="tutor_grupo" defaultValue={modal.datos?.tutor_grupo || ''} placeholder="Nombre del tutor" className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Color de la materia</label>
                <input type="color" name="color" defaultValue={modal.datos?.color || COLORS.primaryPale} className={`w-full h-10 p-1 border rounded-lg cursor-pointer ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal({ abierto: false, tipo: 'nueva', datos: null, celda: null })} className={`flex-1 px-4 py-2.5 border rounded-lg font-medium ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancelar</button>
                <button type="submit" className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg ${modal.tipo === 'nueva' ? 'bg-[#701330] hover:bg-[#912347]' : 'bg-[#912347] hover:bg-[#701330]'}`}>
                  {modal.tipo === 'nueva' ? 'Asignar' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalTutor.abierto && permisoReal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-7 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Asignar Tutor</h3>
                <p className="text-sm text-gray-500 mt-1">Grupo: {modalTutor.grupo}</p>
              </div>
              <button onClick={() => setModalTutor({ abierto: false, grupo: null, tutorActual: '' })} 
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all duration-300 hover:rotate-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              guardarTutor(modalTutor.grupo, formData.get('tutor'));
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Tutor</label>
                <input 
                  type="text" 
                  name="tutor" 
                  defaultValue={modalTutor.tutorActual}
                  placeholder="Ej. Mtro. Juan Pérez" 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" 
                  onClick={() => setModalTutor({ abierto: false, grupo: null, tutorActual: '' })} 
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" 
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-[#701330] hover:bg-[#912347] transition-all duration-300 shadow-md hover:shadow-lg">
                  Asignar Tutor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalSolicitarReserva.abierto && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-7 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Solicitar Reserva</h3>
                <p className="text-sm text-gray-500 mt-1 capitalize">
                  {modalSolicitarReserva.dia} • {modalSolicitarReserva.bloque?.hora} • {aula.nombre_aula}
                </p>
                <p className="text-xs text-gray-400 mt-1">Esta solicitud será revisada por el responsable del edificio</p>
              </div>
              <button
                onClick={() => setModalSolicitarReserva({ abierto: false, dia: null, bloque: null })}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all duration-300 hover:rotate-90"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {(() => {
              const idxInicial = modalSolicitarReserva.bloque
                ? bloquesFiltrados.findIndex(b => normalizarHora(b.inicio) === normalizarHora(modalSolicitarReserva.bloque.inicio))
                : -1;
              const ultimoIdx = idxInicial >= 0 ? idxInicial + duracionSolicitud - 1 : -1;
              return (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horas a ocupar</label>
                    <div className="flex flex-wrap items-end gap-2">
                      {bloquesFiltrados.map((b, i) => {
                        const estado = estadoBloqueSolicitud(modalSolicitarReserva.dia, b);
                        const enRango = i >= idxInicial && i <= ultimoIdx;
                        const esInicio = i === idxInicial;
                        let cls = '';
                        let dot = '';
                        if (enRango) {
                          cls = 'bg-blue-600 text-white border-blue-700 shadow-lg scale-105 z-10';
                          dot = 'bg-white';
                        } else if (estado === 'ocupado') {
                          cls = 'bg-red-50 text-red-700 border-red-200';
                          dot = 'bg-red-500';
                        } else if (estado === 'pendiente') {
                          cls = 'bg-amber-50 text-amber-700 border-amber-200';
                          dot = 'bg-amber-500';
                        } else {
                          cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          dot = 'bg-emerald-500';
                        }
                        return (
                          <div key={b.inicio} className={`flex-1 min-w-[52px] rounded-lg border px-2 py-1.5 text-center transition-all duration-200 relative ${cls} ${esInicio ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
                            <div className={`text-[9px] font-bold uppercase ${enRango ? 'text-blue-100' : estado === 'libre' ? 'text-emerald-500' : estado === 'pendiente' ? 'text-amber-500' : 'text-red-500'}`}>
                              {enRango ? 'Seleccion' : estado}
                            </div>
                            <div className="text-xs font-semibold">{b.hora}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {[1, 2, 3].map(h => {
                        const disponible = h <= Math.max(1, maxHorasSolicitud);
                        return (
                          <button
                            key={h}
                            type="button"
                            disabled={!disponible || enviandoSolicitud}
                            onClick={() => setDuracionSolicitud(h)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                              duracionSolicitud === h
                                ? 'bg-[#701330] text-white border-[#701330] shadow-md'
                                : disponible
                                ? 'bg-white text-gray-700 border-gray-300 hover:border-[#701330] hover:text-[#701330]'
                                : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            {h} {h === 1 ? 'hora' : 'horas'}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {maxHorasSolicitud > 1
                        ? `Puedes solicitar hasta ${maxHorasSolicitud} horas consecutivas (las siguientes casillas están libres).`
                        : 'El siguiente bloque no disponible: solo puedes solicitar 1 hora.'}
                    </p>
                  </div>
                </div>
              );
            })()}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const idxInicial = modalSolicitarReserva.bloque
                  ? bloquesFiltrados.findIndex(b => normalizarHora(b.inicio) === normalizarHora(modalSolicitarReserva.bloque.inicio))
                  : -1;
                const bloqueFin = idxInicial >= 0 ? bloquesFiltrados[idxInicial + duracionSolicitud - 1] : null;
                solicitarReservaDesdeCelda(
                  modalSolicitarReserva.dia,
                  modalSolicitarReserva.bloque,
                  formData.get('motivo'),
                  formData.get('grupo'),
                  formData.get('tutor'),
                  duracionSolicitud,
                  bloqueFin
                );
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la reserva (opcional)</label>
                <textarea
                  name="motivo"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                  placeholder="Describe el motivo de la reserva..."
                  disabled={enviandoSolicitud}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo *</label>
                <input
                  type="text"
                  name="grupo"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                  placeholder="Ej. DSM 31"
                  required
                  disabled={enviandoSolicitud}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutor *</label>
                <input
                  type="text"
                  name="tutor"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#701330]/20"
                  placeholder="Nombre del tutor"
                  required
                  disabled={enviandoSolicitud}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalSolicitarReserva({ abierto: false, dia: null, bloque: null })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                  disabled={enviandoSolicitud}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoSolicitud}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-[#701330] hover:bg-[#912347] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enviandoSolicitud ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Solicitar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {eventoDetalle && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/55 animate-fadeIn" onClick={() => setEventoDetalle(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modalIn">
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 bg-gradient-to-r from-[#FDF2F6] to-white sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm" style={{ backgroundColor: eventoDetalle.evento.color && eventoDetalle.evento.color !== '#701330' ? eventoDetalle.evento.color : COLORS.primaryPale, color: COLORS.primary }}>
                  {getIniciales(eventoDetalle.evento.sigla_materia || eventoDetalle.evento.nombre_materia || '?')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {eventoDetalle.evento.esPendiente ? 'Solicitud en espera' : (eventoDetalle.evento.sigla_materia || eventoDetalle.evento.nombre_materia || 'Asignación')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                    {eventoDetalle.dia} • {bloqueHora(eventoDetalle.bloque)} • {aula.nombre_aula}
                  </p>
                </div>
              </div>
              <button onClick={() => setEventoDetalle(null)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all duration-300 hover:rotate-90 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {eventoDetalle.evento.esPendiente ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Esta solicitud está pendiente de aprobación por el responsable del edificio.
                </div>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderDetalle('Materia', eventoDetalle.evento.nombre_materia || '—', eventoDetalle.evento.sigla_materia)}
                {renderDetalle('Profesor', eventoDetalle.evento.nombre_docente || 'Sin asignar', eventoDetalle.evento.sigla_docente)}
                {renderDetalle('Grupo', eventoDetalle.evento.sigla_grupo)}
                {renderDetalle('Carrera', eventoDetalle.evento.nombre_carrera || '—', eventoDetalle.evento.sigla_carrera)}
                {renderDetalle('Aula de clase', eventoDetalle.evento.aula_clase || '—')}
                {renderDetalle('Tutor', eventoDetalle.evento.tutor_grupo || '—')}
                {renderDetalle('Turno', eventoDetalle.evento.turno ? String(eventoDetalle.evento.turno).charAt(0).toUpperCase() + String(eventoDetalle.evento.turno).slice(1) : '—')}
                {!eventoDetalle.evento.esPendiente && (() => {
                  const delEvento = eventoDetalle.evento;
                  const esOtroDirector = esDirector && !esSuperAdmin && delEvento.id_usuario && delEvento.id_usuario !== idDirector && delEvento.rol_creador !== 'superadmin';
                  return renderDetalle('Responsable de la reserva', delEvento.nombre_creador ? `${delEvento.nombre_creador}${etiquetaRol(delEvento.rol_creador)}` : 'Importado por Excel', delEvento.nombre_creador ? getIniciales(delEvento.nombre_creador) : '', esOtroDirector);
                })()}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEventoDetalle(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={() => setConfirmar(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-modalIn">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${confirmar.tipo === 'peligro' ? 'bg-red-100' : 'bg-amber-100'}`}>
                <svg className={`w-6 h-6 ${confirmar.tipo === 'peligro' ? 'text-red-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{confirmar.titulo}</h3>
                <p className="text-sm text-gray-600 mt-1">{confirmar.mensaje}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmar(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar.accion}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700"
              >
                {confirmar.confirmarTexto || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out forwards; }
        .animate-modalIn { animation: modalIn 0.3s ease-out forwards; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}