import { useState, useEffect } from 'react';
import api from '../api/axios';
import { hasPermission, ROLES } from '../utils/auth';
import Confirmar from '../components/Confirmar';
import ToastLocal from '../components/ToastLocal';

export default function Materias() {
  const [lista, setLista] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [modal, setModal] = useState({ abierto: false, datos: null });
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: 'error', mensaje: '' });
  const puedeEditar = hasPermission(["superadmin", "director"]);

  const mostrarAlerta = (tipo, mensaje) => setAlerta({ mostrar: true, tipo, mensaje });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resMat, resPlanes] = await Promise.all([
        api.get('/api/materias'),
        api.get('/api/planes-educativos')
      ]);
      setLista(resMat.data || []);
      setPlanes(resPlanes.data || []);
    } catch (err) {
      console.error('Error cargando materias:', err);
      mostrarAlerta('error', 'No se pudo cargar la lista de materias');
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datos = {
      nombre_materia: formData.get('nombre_materia'),
      id_plan: Number(formData.get('id_plan')),
      color: formData.get('color') || '#701330'
    };

    try {
      if (modal.datos) {
        await api.put(`/api/materias/${modal.datos.id_materia}`, datos);
      } else {
        await api.post('/api/materias', datos);
      }
      setModal({ abierto: false, datos: null });
      cargarDatos();
    } catch (err) {
      console.error('Error guardando materia:', err);
      mostrarAlerta('error', err.response?.data?.detail || 'Error al guardar la materia');
    }
  };

  const eliminar = async (id) => {
    setConfirmarEliminar(id);
  };

  const confirmarBorrar = async () => {
    if (!confirmarEliminar || eliminando) return;
    setEliminando(true);
    try {
      await api.delete(`/api/materias/${confirmarEliminar}`);
      setConfirmarEliminar(null);
      cargarDatos();
    } catch (err) {
      console.error('Error eliminando:', err);
      mostrarAlerta('error', err.response?.data?.detail || 'No se puede eliminar la materia');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div>
      <h2>Gestión de Materias</h2>

      {puedeEditar && (
        <button onClick={() => setModal({ abierto: true, datos: null })}>
          Nueva Materia
        </button>
      )}

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Plan Educativo</th>
            <th>Color</th>
            {puedeEditar && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 ? (
            <tr><td colSpan="5" align="center">No hay materias registradas</td></tr>
          ) : (
            lista.map(m => (
              <tr key={m.id_materia}>
                <td>{m.id_materia}</td>
                <td>{m.nombre_materia}</td>
                <td>{m.nombre_plan}</td>
                <td><div style={{ width: '20px', height: '20px', background: m.color, border: '1px solid #ccc' }}></div></td>
                {puedeEditar && (
                  <td>
                    <button onClick={() => setModal({ abierto: true, datos: m })}>Editar</button>
                    <button onClick={() => eliminar(m.id_materia)} style={{ marginLeft: '0.5rem', color: 'red' }}>Eliminar</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal Formulario */}
      {modal.abierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '4px', width: '400px' }}>
            <h3>{modal.datos ? 'Editar Materia' : 'Nueva Materia'}</h3>
            <form onSubmit={guardar}>
              <div style={{ marginBottom: '1rem' }}>
                <label>Nombre de la Materia:</label><br />
                <input
                  type="text"
                  name="nombre_materia"
                  defaultValue={modal.datos?.nombre_materia || ''}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Plan Educativo:</label><br />
                <select
                  name="id_plan"
                  defaultValue={modal.datos?.id_plan || ''}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Seleccione un plan</option>
                  {planes.map(p => (
                    <option key={p.id_plan} value={p.id_plan}>{p.nombre_plan}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Color:</label><br />
                <input
                  type="color"
                  name="color"
                  defaultValue={modal.datos?.color || '#701330'}
                  style={{ width: '100%', height: '40px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal({ abierto: false, datos: null })}>Cancelar</button>
                <button type="submit">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Confirmar
        abierto={!!confirmarEliminar}
        titulo="Eliminar materia"
        mensaje="¿Estás seguro de eliminar esta materia?"
        textoConfirmar="Sí, eliminar"
        cargando={eliminando}
        onCancelar={() => setConfirmarEliminar(null)}
        onConfirmar={confirmarBorrar}
      />
      <ToastLocal alerta={alerta} onCerrar={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })} />
    </div>
  );
}