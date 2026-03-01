import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usuariosService, asistenciaService, authService } from '../../services/api';

const hoyISO = () => new Date().toISOString().split('T')[0];
const primerDiaMes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('usuarios');

  // ── Usuarios ─────────────────────────────────────────────────────────────
  const [usuarios, setUsuarios]       = useState([]);
  const [modalNuevo, setModalNuevo]   = useState(false);
  const [nuevoUser, setNuevoUser]     = useState({ nombre:'', apellido:'', email:'', password:'', rol:'empleado' });
  const [msgUser, setMsgUser]         = useState(null);

  const cargarUsuarios = useCallback(async () => {
    const { data } = await usuariosService.listar();
    setUsuarios(data.data);
  }, []);

  useEffect(() => { if (tab === 'usuarios') cargarUsuarios(); }, [tab, cargarUsuarios]);

  const crearUsuario = async (e) => {
    e.preventDefault();
    try {
      await authService.register(nuevoUser);
      setMsgUser({ tipo: 'success', texto: 'Usuario creado exitosamente' });
      setModalNuevo(false);
      setNuevoUser({ nombre:'', apellido:'', email:'', password:'', rol:'empleado' });
      cargarUsuarios();
    } catch (err) {
      setMsgUser({ tipo: 'error', texto: err.response?.data?.message || 'Error al crear usuario' });
    }
  };

  const toggleActivo = async (u) => {
    await usuariosService.actualizar(u.id, { activo: u.activo ? 0 : 1 });
    cargarUsuarios();
  };

  // ── Reporte ───────────────────────────────────────────────────────────────
  const [reporte, setReporte]     = useState([]);
  const [filtros, setFiltros]     = useState({ desde: primerDiaMes(), hasta: hoyISO() });

  const cargarReporte = useCallback(async () => {
    const { data } = await asistenciaService.reporte(filtros);
    setReporte(data.data);
  }, [filtros]);

  useEffect(() => { if (tab === 'reporte') cargarReporte(); }, [tab, cargarReporte]);

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-brand">AuthFlow <span className="badge badge-admin">Admin</span></div>
        <div className="topbar-user">
          <span>{user.nombre}</span>
          <button className="btn btn-ghost" onClick={logout}>Salir</button>
        </div>
      </header>

      <main className="main-content">
        <h2 className="page-title">Panel de Administración</h2>

        <div className="tabs">
          <button className={`tab ${tab === 'usuarios' ? 'active' : ''}`} onClick={() => setTab('usuarios')}>
             Usuarios
          </button>
          <button className={`tab ${tab === 'reporte' ? 'active' : ''}`} onClick={() => setTab('reporte')}>
            Reporte de Asistencia
          </button>
        </div>

        {/* ── TAB: Usuarios ── */}
        {tab === 'usuarios' && (
          <div className="tab-content">
            {msgUser && <div className={`alert alert-${msgUser.tipo}`}>{msgUser.texto}</div>}

            <div className="section-header">
              <h3>Gestión de Usuarios</h3>
              <button className="btn btn-primary" onClick={() => setModalNuevo(true)}>
                + Nuevo usuario
              </button>
            </div>

            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nombre} {u.apellido}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge badge-${u.rol}`}>{u.rol}</span></td>
                      <td>
                        <span className={`badge ${u.activo ? 'badge-success' : 'badge-error'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString('es-CO')}</td>
                      <td>
                        {u.id !== user.id && (
                          <button
                            className={`btn btn-sm ${u.activo ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleActivo(u)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal nuevo usuario */}
            {modalNuevo && (
              <div className="modal-overlay" onClick={() => setModalNuevo(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Crear Nuevo Usuario</h3>
                  <form onSubmit={crearUsuario} className="auth-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nombre</label>
                        <input value={nuevoUser.nombre} onChange={e => setNuevoUser({...nuevoUser, nombre: e.target.value})} required />
                      </div>
                      <div className="form-group">
                        <label>Apellido</label>
                        <input value={nuevoUser.apellido} onChange={e => setNuevoUser({...nuevoUser, apellido: e.target.value})} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={nuevoUser.email} onChange={e => setNuevoUser({...nuevoUser, email: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Contraseña</label>
                      <input type="password" value={nuevoUser.password} onChange={e => setNuevoUser({...nuevoUser, password: e.target.value})} required minLength={8} />
                    </div>
                    <div className="form-group">
                      <label>Rol</label>
                      <select value={nuevoUser.rol} onChange={e => setNuevoUser({...nuevoUser, rol: e.target.value})}>
                        <option value="empleado">Empleado</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn btn-ghost" onClick={() => setModalNuevo(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary">Crear usuario</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Reporte ── */}
        {tab === 'reporte' && (
          <div className="tab-content">
            <div className="card">
              <div className="reporte-filtros">
                <div className="form-group">
                  <label>Desde</label>
                  <input type="date" value={filtros.desde} onChange={e => setFiltros({...filtros, desde: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Hasta</label>
                  <input type="date" value={filtros.hasta} onChange={e => setFiltros({...filtros, hasta: e.target.value})} />
                </div>
                <button className="btn btn-primary" onClick={cargarReporte}>Actualizar</button>
              </div>
            </div>

            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Email</th>
                    <th>Días trabajados</th>
                    <th>Promedio diario</th>
                    <th>Total horas</th>
                    <th>Sin salida</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.map((r) => (
                    <tr key={r.id}>
                      <td>{r.nombre} {r.apellido}</td>
                      <td>{r.email}</td>
                      <td>{r.dias_trabajados}</td>
                      <td>{Math.floor(r.promedio_minutos / 60)}h {r.promedio_minutos % 60}min</td>
                      <td>{Math.floor(r.total_minutos / 60)}h {r.total_minutos % 60}min</td>
                      <td>
                        {r.sin_salida > 0 && (
                          <span className="badge badge-warning">{r.sin_salida}</span>
                        )}
                        {r.sin_salida === 0 && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
