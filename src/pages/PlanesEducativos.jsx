import { useState, useEffect } from 'react';
import api from '../api/axios';
import { hasPermission, ROLES } from '../utils/auth';
import Confirmar from '../components/Confirmar';
import ToastLocal from '../components/ToastLocal';

export default function PlanesEducativos() {
  const [lista, setLista] = useState([]);
  const [carreras, setCarreras] = useState([]);
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
      const [resPlanes, resCarreras] = await Promise.all([
        api.get('/api/planes-educativos'),
        api.get('/api/carreras')
      ]);
      setLista(resPlanes.data || []);
      setCarreras(resCarreras.data || []);
    } catch (err) {
      console.error('Error cargando planes:', err);
      mostrarAlerta('error', 'No se pudo cargar la lista de planes');
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datos = {
      nombre_plan: formData.get('nombre_plan'),
      id_carrera: Number(formData.get('id_carrera'))
    };

    try {
      if (modal.datos) {
        await api.put(`/api/planes-educativos/${modal.datos.id_plan}`, datos);
      } else {
        await api.post('/api/planes-educativos', datos);
      }
      setModal({ abierto: false, datos: null });
      cargarDatos();
    } catch (err) {
      console.error('Error guardando:', err);
      mostrarAlerta('error', err.response?.data?.detail || 'Error al guardar el plan');
    }
  };

  const eliminar = async (id) => {
    setConfirmarEliminar(id);
  };

  const confirmarBorrar = async () => {
    if (!confirmarEliminar || eliminando) return;
    setEliminando(true);
    try {
      await api.delete(`/api/planes-educativos/${confirmarEliminar}`);
      setConfirmarEliminar(null);
      cargarDatos();
    } catch (err) {
      console.error('Error eliminando:', err);
      mostrarAlerta('error', err.response?.data?.detail || 'No se puede eliminar el plan');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div>
      <h2>Gestión de Planes Educativos</h2>

      {puedeEditar && (
        <button onClick={() => setModal({ abierto: true, datos: null })}>
          Nuevo Plan
        </button>
      )}

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre del Plan</th>
            <th>Carrera</th>
            {puedeEditar && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 ? (
            <tr><td colSpan="4" align="center">No hay planes registrados</td></tr>
          ) : (
            lista.map(plan => (
              <tr key={plan.id_plan}>
                <td>{plan.id_plan}</td>
                <td>{plan.nombre_plan}</td>
                <td>{plan.nombre_carrera}</td>
                {puedeEditar && (
                  <td>
                    <button onClick={() => setModal({ abierto: true, datos: plan })}>Editar</button>
                    <button onClick={() => eliminar(plan.id_plan)} style={{ marginLeft: '0.5rem', color: 'red' }}>Eliminar</button>
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
            <h3>{modal.datos ? 'Editar Plan' : 'Nuevo Plan Educativo'}</h3>
            <form onSubmit={guardar}>
              <div style={{ marginBottom: '1rem' }}>
                <label>Nombre del Plan:</label><br />
                <input
                  type="text"
                  name="nombre_plan"
                  defaultValue={modal.datos?.nombre_plan || ''}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Carrera:</label><br />
                <select
                  name="id_carrera"
                  defaultValue={modal.datos?.id_carrera || ''}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Seleccione una carrera</option>
                  {carreras.map(c => (
                    <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
                  ))}
                </select>
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
        titulo="Eliminar plan"
        mensaje="¿Estás seguro de eliminar este plan educativo?"
        textoConfirmar="Sí, eliminar"
        cargando={eliminando}
        onCancelar={() => setConfirmarEliminar(null)}
        onConfirmar={confirmarBorrar}
      />
      <ToastLocal alerta={alerta} onCerrar={() => setAlerta({ mostrar: false, tipo: '', mensaje: '' })} />
    </div>
  );
}